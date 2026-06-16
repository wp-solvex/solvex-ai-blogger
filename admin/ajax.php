<?php
/**
 * Admin AJAX class for Solvex AI Blogger.
 *
 * This class handles AJAX requests for admin operations including
 * settings management, campaign operations, and post creation.
 * Implements security measures including rate limiting,
 * input validation, and proper authentication.
 *
 * @package solvex-ai-blogger
 * @subpackage Admin
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Admin;

use WPSolvex\AutoAIBlogger\Inc\Cron_Handler;
use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;
use WPSolvex\AutoAIBlogger\Inc\Utils\Helper;
use WPSolvex\AutoAIBlogger\Inc\Utils\Metadata;
use WPSolvex\AutoAIBlogger\Inc\Utils\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Admin AJAX class for Solvex AI Blogger.
 *
 * @package solvex-ai-blogger
 * @subpackage Admin
 * @since 1.0.0
 */
class Ajax {
	use Get_Instance;

	/**
	 * Maximum request size in bytes (2MB for AJAX operations).
	 */
	private const MAX_REQUEST_SIZE = 2097152;

	/**
	 * Maximum campaign content length.
	 */
	private const MAX_CAMPAIGN_CONTENT_LENGTH = 50000;

	/**
	 * Holds all AJAX action events.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @var array<string>
	 */
	public $ajax_events = [
		'wpsolvex_autoaiblogger_update_admin_setting',
		'wpsolvex_autoaiblogger_create_campaign',
		'wpsolvex_autoaiblogger_update_campaign',
		'wpsolvex_autoaiblogger_get_campaign_metadata',
		'wpsolvex_autoaiblogger_create_post',
		'wpsolvex_autoaiblogger_run_campaign',
		'wpsolvex_autoaiblogger_get_campaign_analytics',
		'wpsolvex_autoaiblogger_delete_campaign',
		'wpsolvex_autoaiblogger_get_campaign_logs',
		'wpsolvex_autoaiblogger_pause_campaign',
		'wpsolvex_autoaiblogger_resume_campaign',
		'wpsolvex_autoaiblogger_reschedule_campaign',
		'wpsolvex_autoaiblogger_generate_campaign_topics',
		'wpsolvex_autoaiblogger_get_all_campaigns_live',
	];

	/**
	 * Holds all nonce for AJAX events.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @var array<string, string>
	 */
	public static $nonce = [];

	/**
	 * Errors
	 *
	 * @access private
	 * @var array<string, string> Errors strings.
	 * @since 1.0.0
	 */
	private $errors = [];

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->errors = [
			'permission'         => __( 'Sorry, you are not allowed to do this operation.', 'solvex-ai-blogger' ),
			'nonce'              => __( 'Nonce validation failed', 'solvex-ai-blogger' ),
			'default'            => __( 'Sorry, something went wrong.', 'solvex-ai-blogger' ),
			'success'            => __( 'Successfully saved data!', 'solvex-ai-blogger' ),
			'rate_limit'         => __( 'Too many requests. Please try again later.', 'solvex-ai-blogger' ),
			'request_too_large'  => __( 'Request size exceeds maximum allowed limit.', 'solvex-ai-blogger' ),
			'invalid_data'       => __( 'Invalid or malformed data provided.', 'solvex-ai-blogger' ),
			'security_violation' => __( 'Security check failed. Request blocked.', 'solvex-ai-blogger' ),
			'content_too_long'   => __( 'Content exceeds maximum allowed length.', 'solvex-ai-blogger' ),
		];

		/* Initialize AJAX events */
		foreach ( $this->ajax_events as $action ) {
			add_action( 'wp_ajax_' . $action, [ $this, $action ] );
		}

		// Add security headers for AJAX responses.
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_update_admin_setting', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_create_campaign', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_update_campaign', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_get_campaign_metadata', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_create_post', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_run_campaign', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_delete_campaign', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_get_campaign_logs', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_pause_campaign', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_resume_campaign', [ $this, 'add_security_headers' ], 1 );
		add_action( 'wp_ajax_wpsolvex_autoaiblogger_get_all_campaigns_live', [ $this, 'add_security_headers' ], 1 );
	}

	/**
	 * Get error message.
	 *
	 * @param string $type Message type.
	 * @return string
	 * @access public
	 * @since 1.0.0
	 */
	public function get_error_msg( $type ) {

		if ( ! isset( $this->errors[ $type ] ) ) {
			$type = 'default';
		}

		return $this->errors[ $type ];
	}

	/**
	 * Add security headers to AJAX responses.
	 *
	 * @since 0.0.2
	 */
	public function add_security_headers(): void {
		if ( ! headers_sent() ) {
			header( 'X-Content-Type-Options: nosniff' );
			header( 'X-Frame-Options: DENY' );
			header( 'X-XSS-Protection: 1; mode=block' );
			header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		}
	}

	/**
	 * Handler to update admin app settings with security.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_update_admin_setting(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'update_admin_setting' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			// Validate and sanitize input.
			$sub_option_key = isset( $_POST['key'] ) ? sanitize_text_field( wp_unslash( $_POST['key'] ) ) : '';
			if ( empty( $sub_option_key ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}

			// Get allowed setting keys for validation.
			$type_settings = Settings::get_all_type_wise_settings();
			$allowed_keys  = array_keys( $type_settings );

			// Additional whitelist allowed setting keys.
			if ( ! in_array( $sub_option_key, $allowed_keys, true ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}

			$sub_option_value = '';
			if ( isset( $_POST['value'] ) ) {
				$raw_value = wp_unslash( $_POST['value'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized below by sanitize_data().
				if ( ! empty( $type_settings[ $sub_option_key ] ) ) {
					$sub_option_value = Settings::sanitize_data( $raw_value, $type_settings[ $sub_option_key ] );
				} else {
					$sub_option_value = Settings::sanitize_data( $raw_value );
				}
			}

			// Update option with error handling.
			$update_result = Helper::update_option( $sub_option_key, $sub_option_value );

			if ( ! $update_result['success'] ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
				return;
			}

			wp_send_json_success(
				[
					'message' => $this->get_error_msg( 'success' ),
					'key'     => $sub_option_key,
					'updated' => true,
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
		}
	}   /**
		 * Handler to create campaign with security.
		 *
		 * @since 1.0.0
		 * @return void
		 */
	public function wpsolvex_autoaiblogger_create_campaign(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'create_campaign' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			// Validate and sanitize input — JSON string decoded then each field sanitized individually.
			$campaign_raw = isset( $_POST['value'] ) ? sanitize_text_field( wp_unslash( $_POST['value'] ) ) : '';

			if ( empty( $campaign_raw ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}

			// Decode and validate JSON.
			$campaign_details = json_decode( $campaign_raw, true );
			if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $campaign_details ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}

			// data sanitization.
			$sanitized_campaign = $this->sanitize_campaign_data( $campaign_details );
			if ( is_wp_error( $sanitized_campaign ) ) {
				wp_send_json_error( [ 'message' => $sanitized_campaign->get_error_message() ] );
				return;
			}

			// Legacy sanitization for backward compatibility.
			$campaign_details        = Metadata::sanitize_data( $campaign_details, 'array' );
			$formatted_campaign_data = Metadata::format_data( $campaign_details );

			// Validate required fields.
			if ( ! is_array( $formatted_campaign_data ) || empty( $formatted_campaign_data['title'] ) ) {
				wp_send_json_error( [ 'message' => __( 'Campaign title is required.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Create a new campaign with error handling.
			$campaign_id = \wp_insert_post(
				[
					'post_title'   => $formatted_campaign_data['title'],
					'post_content' => $formatted_campaign_data['content'] ?? '',
					'post_status'  => $formatted_campaign_data['status'] ?? 'draft',
					'post_type'    => WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN,
					'meta_input'   => $formatted_campaign_data['meta_input'] ?? [],
				]
			);

			if ( is_wp_error( $campaign_id ) || ! $campaign_id ) {
				wp_send_json_error(
					[
						'message' => $this->get_error_msg( 'default' ),
						'details' => is_wp_error( $campaign_id ) ? $campaign_id->get_error_message() : 'Failed to create campaign',
					]
				);
				return;
			}

			// New simplified post creation scheduler.
			$this->schedule_campaign_posts( $campaign_id, $formatted_campaign_data['meta_input'] );

			wp_send_json_success(
				[
					'message'     => $this->get_error_msg( 'success' ),
					'campaign_id' => $campaign_id,
					'title'       => $formatted_campaign_data['title'],
					'status'      => $formatted_campaign_data['status'] ?? 'draft',
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
		}
	}

	/**
	 * Handler to update campaign with security.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_update_campaign(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'update_campaign' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			// Validate and sanitize input — JSON string decoded then each field sanitized individually.
			$campaign_raw = isset( $_POST['value'] ) ? sanitize_text_field( wp_unslash( $_POST['value'] ) ) : '';

			if ( empty( $campaign_raw ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}

			// Decode and validate JSON.
			$campaign_details = json_decode( $campaign_raw, true );
			if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $campaign_details ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}
			$campaign_id = absint( $campaign_details['id'] ?? 0 );
			if ( ! $campaign_id ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Check if campaign exists and user can edit it.
			$campaign_post = get_post( $campaign_id );
			if ( ! $campaign_post || $campaign_post->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				wp_send_json_error( [ 'message' => __( 'Campaign not found.', 'solvex-ai-blogger' ) ] );
				return;
			}

			if ( ! current_user_can( 'edit_post', $campaign_id ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
				return;
			}

			// Data sanitization.
			$sanitized_campaign = $this->sanitize_campaign_data( $campaign_details );
			if ( is_wp_error( $sanitized_campaign ) ) {
				wp_send_json_error( [ 'message' => $sanitized_campaign->get_error_message() ] );
				return;
			}

			// Legacy sanitization for backward compatibility.
			$campaign_details        = Metadata::sanitize_data( $campaign_details, 'array' );
			$formatted_campaign_data = Metadata::format_data( $campaign_details );

			// Validate required fields.
			if ( ! is_array( $formatted_campaign_data ) || empty( $formatted_campaign_data['title'] ) ) {
				wp_send_json_error( [ 'message' => __( 'Campaign title is required.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Update the campaign with error handling.
			$updated = \wp_update_post(
				[
					'ID'           => $campaign_id,
					'post_title'   => $formatted_campaign_data['title'],
					'post_content' => $formatted_campaign_data['content'] ?? '',
					'post_status'  => $formatted_campaign_data['status'] ?? 'draft',
					'meta_input'   => $formatted_campaign_data['meta_input'] ?? [],
				]
			);

			if ( is_wp_error( $updated ) || ! $updated ) {
				wp_send_json_error(
					[
						'message' => $this->get_error_msg( 'default' ),
						'details' => is_wp_error( $updated ) ? $updated->get_error_message() : 'Failed to update campaign',
					]
				);
				return;
			}

			// Update campaign scheduling using new system.
			$this->schedule_campaign_posts( $campaign_id, $formatted_campaign_data['meta_input'] );

			wp_send_json_success(
				[
					'message'     => $this->get_error_msg( 'success' ),
					'campaign_id' => $campaign_id,
					'title'       => $formatted_campaign_data['title'],
					'updated'     => true,
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
		}
	}

	/**
	 * Handler to get campaign metadata in drawer edit settings with security.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_get_campaign_metadata(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'get_campaign_metadata' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			// Validate campaign ID.
			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;
			if ( ! $campaign_id ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Check if campaign exists and user can read it.
			$campaign_post = get_post( $campaign_id );
			if ( ! $campaign_post || $campaign_post->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				wp_send_json_error( [ 'message' => __( 'Campaign not found.', 'solvex-ai-blogger' ) ] );
				return;
			}

			if ( ! current_user_can( 'read_post', $campaign_id ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
				return;
			}

			// Get campaign metadata with error handling.
			$campaign_data = Metadata::get_campaign_data( $campaign_id, true );

			if ( empty( $campaign_data ) ) {
				wp_send_json_error( [ 'message' => __( 'Failed to retrieve campaign data.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Sanitize sensitive data before sending.
			if ( isset( $campaign_data['api_key'] ) ) {
				$campaign_data['api_key'] = '***masked***';
			}
			if ( isset( $campaign_data['token'] ) ) {
				$campaign_data['token'] = '***masked***';
			}

			wp_send_json_success(
				[
					'data'        => $campaign_data,
					'campaign_id' => $campaign_id,
					'message'     => __( 'Campaign data retrieved successfully.', 'solvex-ai-blogger' ),
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
		}
	}

	/**
	 * Handler to create post with security.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_create_post(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'create_post' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			// Check if user can create posts.
			if ( ! current_user_can( 'edit_posts' ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
				return;
			}

			// Validate and sanitize input — JSON containing HTML post_content; individual fields sanitized after json_decode via Metadata::sanitize_data().
			$post_data = isset( $_POST['post_data'] ) && is_string( $_POST['post_data'] ) ? wp_unslash( $_POST['post_data'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- JSON with HTML content; each field sanitized individually after decode via Metadata::sanitize_data().

			if ( empty( $post_data ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}

			// Decode and validate JSON.
			$post_data = json_decode( (string) $post_data, true );
			if ( json_last_error() !== JSON_ERROR_NONE ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'invalid_data' ) ] );
				return;
			}

			if ( ! is_array( $post_data ) || empty( $post_data['title'] ) ) {
				wp_send_json_error( [ 'message' => __( 'Post title is required.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Sanitize post data.
			$post_data = Metadata::sanitize_data( $post_data, 'array' );

			// Validate and sanitize title.
			$post_title = sanitize_text_field( (string) $post_data['title'] );
			if ( strlen( $post_title ) > 200 ) {
				wp_send_json_error( [ 'message' => __( 'Post title is too long (max 200 characters).', 'solvex-ai-blogger' ) ] );
				return;
			}

			// If no content provided, generate content from title via API.
			$featured_image_id = null;
			$post_content      = $post_data['post_content'] ?? '';
			$post_excerpt      = ''; // Initialize excerpt variable.
			$token_data        = null; // Initialize token data variable.

			if ( empty( $post_content ) && ! empty( $post_title ) ) {
				$api_result = $this->generate_content_from_title_api( $post_title, $post_data );
				if ( is_wp_error( $api_result ) ) {
					$error_response = [
						'message' => $api_result->get_error_message(),
						'code'    => $api_result->get_error_code(),
					];

					// Include HTTP status code if available.
					$error_data = $api_result->get_error_data();
					if ( is_array( $error_data ) && isset( $error_data['status'] ) ) {
						$error_response['status'] = (int) $error_data['status'];
					}

					// Include token_data so React can update Redux state on errors.
					if ( is_array( $error_data ) && isset( $error_data['token_data'] ) && is_array( $error_data['token_data'] ) ) {
						$error_response['token_data'] = $error_data['token_data'];
					}

					wp_send_json_error( $error_response );
					return;
				}

				if ( is_array( $api_result ) ) {
					$post_content = $api_result['post_content'] ?? '';
					// Store token data from API response.
					$token_data = $api_result['token_data'] ?? null;

					// Extract and limit excerpt/summary to 160 characters.
					if ( ! empty( $api_result['summary'] ) && is_string( $api_result['summary'] ) ) {
						$post_excerpt = (string) $api_result['summary'];
						if ( mb_strlen( $post_excerpt ) > 160 ) {
							$post_excerpt = mb_substr( $post_excerpt, 0, 157 ) . '...';
						}
					}

					// Process images if they exist in the API response.
					if ( ! empty( $api_result['images'] ) && is_array( $api_result['images'] ) ) {
						$processed_result = $this->process_images_and_replace_placeholders( $post_content, $api_result['images'] );
						if ( ! is_wp_error( $processed_result ) ) {
							$post_content      = $processed_result['content'];
							$featured_image_id = $processed_result['featured_image_id'];
						}
					}
				}
			}

			// Validate and sanitize content.
			$post_content = wp_kses_post( (string) $post_content );
			if ( strlen( $post_content ) > 100000 ) { // 100KB limit.
				wp_send_json_error( [ 'message' => __( 'Post content is too long.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Validate post status.
			$allowed_statuses = [ 'draft', 'publish', 'private', 'pending' ];
			$post_status      = isset( $post_data['status'] ) && is_string( $post_data['status'] ) && in_array( $post_data['status'], $allowed_statuses, true )
				? $post_data['status']
				: 'draft';

			// Validate post type.
			$post_type = sanitize_text_field( (string) ( $post_data['post_type'] ?? 'post' ) );
			if ( ! post_type_exists( $post_type ) ) {
				$post_type = 'post';
			}

			// Check if user can create this post type.
			$post_type_object = get_post_type_object( $post_type );
			if ( ! $post_type_object || ! current_user_can( $post_type_object->cap->create_posts ) ) {
				wp_send_json_error( [ 'message' => __( 'You do not have permission to create this type of post.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Sanitize metadata.
			$meta_data = [];
			if ( ! empty( $post_data['metadata'] ) ) {
				$metadata_raw = json_decode( (string) $post_data['metadata'], true );
				if ( json_last_error() === JSON_ERROR_NONE && is_array( $metadata_raw ) ) {
					$meta_data = Metadata::sanitize_data( $metadata_raw, 'array' );
				}
			}

			// Create a new post with error handling.
			$post_args = [
				'post_title'   => $post_title,
				'post_content' => $post_content,
				'post_status'  => $post_status,
				'post_type'    => $post_type,
			];

			// Add excerpt if available.
			if ( ! empty( $post_excerpt ) ) {
				$post_args['post_excerpt'] = wp_kses_post( $post_excerpt );
			}

			if ( ! empty( $meta_data ) && is_array( $meta_data ) ) {
				$post_args['meta_input'] = $meta_data;
			}

			$post_id = \wp_insert_post( $post_args );

			if ( is_wp_error( $post_id ) || ! $post_id ) {
				$error_message = is_wp_error( $post_id )
					? $post_id->get_error_message()
					: __( 'Failed to create post - unknown error occurred.', 'solvex-ai-blogger' );

				wp_send_json_error(
					[
						'message' => $error_message,
						'details' => is_wp_error( $post_id ) ? $post_id->get_error_message() : 'Failed to create post',
					]
				);
				return;
			}

			// Set featured image if available.
			if ( $featured_image_id && is_numeric( $featured_image_id ) ) {
				set_post_thumbnail( $post_id, $featured_image_id );
				// Note: We don't fail the post creation if thumbnail setting fails as the post content already includes the images.
			}

			// Remove this title from the postIdeas DB option (but keep Redux unchanged).
			if ( ! empty( $post_data['title'] ) && is_string( $post_data['title'] ) ) {
				$this->remove_post_idea_from_db( $post_data['title'] );
			}

			// Update token data if available from API response.
			if ( is_array( $token_data ) && isset( $token_data['total'] ) && isset( $token_data['remaining'] ) ) {
				wpsolvex_autoaiblogger_update_token_data( $token_data );
			}

			$success_response = [
				'message'   => $this->get_error_msg( 'success' ),
				'post_id'   => $post_id,
				'title'     => $post_title,
				'status'    => $post_status,
				'edit_link' => get_edit_post_link( $post_id, 'raw' ),
			];

			// Include token data in response if available (for Redux state updates).
			if ( is_array( $token_data ) && isset( $token_data['total'] ) && isset( $token_data['remaining'] ) ) {
				$success_response['token_data'] = $token_data;
			}

			wp_send_json_success( $success_response );

		} catch ( \Exception $e ) {
			wp_send_json_error(
				[
					'message' => __( 'An unexpected error occurred while creating the post. Please try again.', 'solvex-ai-blogger' ),
				]
			);
		}
	}

	/**
	 * Handler to run campaign with security.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_run_campaign(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'run_campaign' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			// Check if user can publish posts (required for running campaigns).
			if ( ! current_user_can( 'publish_posts' ) ) {
				wp_send_json_error( [ 'message' => __( 'You do not have permission to run campaigns.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Validate campaign ID.
			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;

			if ( ! $campaign_id ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Check if campaign exists and user can edit it.
			$campaign_post = get_post( $campaign_id );
			if ( ! $campaign_post || $campaign_post->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				wp_send_json_error( [ 'message' => __( 'Campaign not found.', 'solvex-ai-blogger' ) ] );
				return;
			}

			if ( ! current_user_can( 'edit_post', $campaign_id ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
				return;
			}

			// Check if campaign is active/published.
			if ( $campaign_post->post_status !== 'publish' ) {
				wp_send_json_error( [ 'message' => __( 'Campaign must be published to run.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Run the campaign using Cron_Handler.
			$result = Cron_Handler::get_instance()->generate_post_from_campaign( $campaign_id );

			if ( ! $result['success'] ) {
				wp_send_json_error(
					[
						'message'     => $result['message'],
						'campaign_id' => $campaign_id,
					]
				);
				return;
			}

			$post_id = $result['post_id'] ?? null;
			if ( ! $post_id ) {
				wp_send_json_error(
					[
						'message'     => __( 'Failed to create post from campaign.', 'solvex-ai-blogger' ),
						'campaign_id' => $campaign_id,
					]
				);
				return;
			}

			// Get the created post details.
			$created_post = get_post( $post_id );
			$post_title   = $created_post ? $created_post->post_title : '';

			wp_send_json_success(
				[
					'message'     => $this->get_error_msg( 'success' ),
					'post_id'     => $post_id,
					'campaign_id' => $campaign_id,
					'post_title'  => $post_title,
					'edit_link'   => get_edit_post_link( $post_id, 'raw' ),
					'view_link'   => get_permalink( $post_id ),
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error(
				[
					'message' => $this->get_error_msg( 'default' ),
					'error'   => 'Exception occurred during campaign execution',
				]
			);
		}
	}

	/**
	 * Handler to get campaign analytics data.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_get_campaign_analytics(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'get_campaign_analytics' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Validate nonce.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
			}

			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;
			if ( ! $campaign_id ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
			}

			// Get campaign metadata.
			$campaign_meta = Metadata::get_campaign_data( $campaign_id, true );
			$posts_target  = absint( $campaign_meta['postsTarget'] ?? 0 );
			$posts_created = absint( $campaign_meta['postsCreated'] ?? 0 );

			$published_posts = get_posts(
				[
					'post_type'              => 'any',
					'post_status'            => 'any',
					'meta_query'             => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Using meta query for campaign posts.
						[
							'key'     => 'wpsolvex_autoaiblogger_campaign_id',
							'value'   => $campaign_id,
							'compare' => '=',
						],
					],
					'numberposts'            => -1,
					'fields'                 => 'ids',
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				]
			);

			// Calculate total views (basic implementation - can be enhanced with analytics plugins).
			$total_views = 0;
			foreach ( $published_posts as $post_id ) {
				$views = absint( get_post_meta( $post_id, 'post_views_count', true ) ?? 0 );
				if ( $views ) {
					$total_views += $views;
				}
			}

			// Calculate total comments.
			$total_comments = 0;
			if ( ! empty( $published_posts ) ) {
				$comment_count  = get_comments(
					[
						'post__in' => $published_posts,
						'count'    => true,
						'status'   => 'approve',
					]
				);
				$total_comments = absint( $comment_count );
			}

			// Calculate success rate.
			$success_rate = $posts_target > 0 ? round( $posts_created / $posts_target * 100 ) : 100;

			// Calculate days active.
			$campaign_post = get_post( $campaign_id );
			$days_active   = 0;
			if ( $campaign_post ) {
				$created_date = new \DateTime( $campaign_post->post_date );
				$current_date = new \DateTime();
				$days_active  = $created_date->diff( $current_date )->days;
			}

			// Get author name.
			$author_id   = $campaign_meta['author'] ?? get_current_user_id();
			$author_data = get_userdata( $author_id );
			$author_name = $author_data ? $author_data->display_name : __( 'Unknown', 'solvex-ai-blogger' );

			// Get top performing posts.
			$top_posts = [];
			if ( ! empty( $published_posts ) ) {
				$posts_with_views = [];
				foreach ( $published_posts as $post_id ) {
					$views = absint( get_post_meta( $post_id, 'post_views_count', true ) ?? 0 );
					$post  = get_post( $post_id );
					if ( $post ) {
						$posts_with_views[] = [
							'id'    => $post_id,
							'title' => $post->post_title,
							'views' => $views,
							'date'  => $post->post_date,
						];
					}
				}

				// Sort by views and get top 5.
				usort(
					$posts_with_views,
					static function( $a, $b ) {
						return $b['views'] - $a['views'];
					}
				);

				$top_posts = array_slice( $posts_with_views, 0, 5 );
			}

			$analytics_data = [
				'publishedPosts' => $posts_created . '/' . $posts_target,
				'totalViews'     => $total_views,
				'totalComments'  => $total_comments,
				'successRate'    => $success_rate,
				'daysActive'     => $days_active,
				'authorName'     => $author_name,
				'topPosts'       => $top_posts,
				'lastRun'        => Metadata::get_campaign_meta( $campaign_id, 'lastRun' ),
			];

			wp_send_json_success( $analytics_data );
		} catch ( \Exception $e ) {
			wp_send_json_error(
				[
					'message' => $this->get_error_msg( 'default' ),
					'error'   => 'Exception occurred during fetching campaign analytics',
				]
			);
		}
	}

	/**
	 * Handler to delete campaign with security.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_delete_campaign(): void {
		try {
			// security validation.
			$security_check = $this->validate_ajax_security( 'delete_campaign' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
			}

			// Validate campaign ID.
			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;
			if ( ! $campaign_id ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID.', 'solvex-ai-blogger' ) ] );
			}

			// Check if campaign exists and user can read it.
			$campaign_post = get_post( $campaign_id );
			if ( ! $campaign_post || $campaign_post->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				wp_send_json_error( [ 'message' => __( 'Campaign not found.', 'solvex-ai-blogger' ) ] );
			}

			if ( ! current_user_can( 'delete_post', $campaign_id ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
			}

			// Clear scheduled events for this campaign.
			wp_clear_scheduled_hook( 'wpsolvex_autoaiblogger_create_single_post', [ $campaign_id ] );
			wp_delete_post( $campaign_id, true );
			wp_send_json_success( [ 'message' => __( 'Campaign deleted successfully.', 'solvex-ai-blogger' ) ] );
		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => __( 'Error occurred while deleting campaign: ', 'solvex-ai-blogger' ) . $e->getMessage() ] );
		}
	}

	/**
	 * Handler to get campaign logs with security.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_get_campaign_logs(): void {
		try {
			// Security validation.
			$security_check = $this->validate_ajax_security( 'get_campaign_logs' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			// Validate campaign ID.
			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;
			if ( ! $campaign_id ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Check if campaign exists and user can read it.
			$campaign_post = get_post( $campaign_id );
			if ( ! $campaign_post || $campaign_post->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				wp_send_json_error( [ 'message' => __( 'Campaign not found.', 'solvex-ai-blogger' ) ] );
				return;
			}

			if ( ! current_user_can( 'read_post', $campaign_id ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
				return;
			}

			// Get campaign logs.
			$logs = $this->get_campaign_creation_logs( $campaign_id );

			wp_send_json_success(
				[
					'logs'        => $logs,
					'campaign_id' => $campaign_id,
					'message'     => __( 'Logs retrieved successfully.', 'solvex-ai-blogger' ),
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
		}
	}

	/**
	 * Handler to pause campaign with security.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_pause_campaign(): void {
		try {
			// Validate security.
			$security_check = $this->validate_ajax_security( 'pause_campaign' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
			}

			// Get and validate campaign ID.
			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;

			if ( $campaign_id <= 0 ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID.', 'solvex-ai-blogger' ) ] );
			}

			// Verify campaign exists.
			$campaign = get_post( $campaign_id );
			if ( ! $campaign || $campaign->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				wp_send_json_error( [ 'message' => __( 'Campaign not found.', 'solvex-ai-blogger' ) ] );
			}

			// Check user permissions.
			if ( ! current_user_can( 'edit_post', $campaign_id ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
			}

			// Check if campaign is already paused.
			$is_paused = Metadata::get_campaign_meta( $campaign_id, 'isPaused' );
			if ( $is_paused ) {
				wp_send_json_error( [ 'message' => __( 'Campaign is already paused.', 'solvex-ai-blogger' ) ] );
			}

			// Check if campaign is already completed.
			$campaign_completed = Metadata::get_campaign_meta( $campaign_id, 'campaignCompleted' );
			if ( $campaign_completed ) {
				wp_send_json_error( [ 'message' => __( 'Cannot pause a completed campaign.', 'solvex-ai-blogger' ) ] );
			}

			// Pause the campaign.
			Metadata::update_campaign_meta( $campaign_id, 'isPaused', true );
			Metadata::update_campaign_meta( $campaign_id, 'pausedAt', current_time( 'mysql' ) );

			// Clear scheduled events.
			wp_clear_scheduled_hook( 'wpsolvex_autoaiblogger_create_single_post', [ $campaign_id ] );

			wp_send_json_success(
				[
					'message'  => __( 'Campaign paused successfully.', 'solvex-ai-blogger' ),
					'isPaused' => true,
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => __( 'An error occurred while pausing the campaign.', 'solvex-ai-blogger' ) ] );
		}
	}

	/**
	 * Handler to resume campaign with security.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_resume_campaign(): void {
		try {
			// Validate security.
			$security_check = $this->validate_ajax_security( 'resume_campaign' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
			}

			// Get and validate campaign ID.
			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;

			if ( $campaign_id <= 0 ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID.', 'solvex-ai-blogger' ) ] );
			}

			// Verify campaign exists.
			$campaign = get_post( $campaign_id );
			if ( ! $campaign || $campaign->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				wp_send_json_error( [ 'message' => __( 'Campaign not found.', 'solvex-ai-blogger' ) ] );
			}

			// Check user permissions.
			if ( ! current_user_can( 'edit_post', $campaign_id ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
			}

			// Check if campaign is paused.
			$is_paused = Metadata::get_campaign_meta( $campaign_id, 'isPaused' );
			if ( ! $is_paused ) {
				wp_send_json_error( [ 'message' => __( 'Campaign is not paused.', 'solvex-ai-blogger' ) ] );
			}

			// Check if campaign is completed.
			$campaign_completed = Metadata::get_campaign_meta( $campaign_id, 'campaignCompleted' );
			if ( $campaign_completed ) {
				wp_send_json_error( [ 'message' => __( 'Cannot resume a completed campaign.', 'solvex-ai-blogger' ) ] );
			}

			// Check if target is already reached.
			$posts_created = absint( Metadata::get_campaign_meta( $campaign_id, 'postsCreated' ) );
			$posts_target  = absint( Metadata::get_campaign_meta( $campaign_id, 'postsTarget' ) );

			if ( $posts_target > 0 && $posts_created >= $posts_target ) {
				wp_send_json_error( [ 'message' => __( 'Campaign target already reached.', 'solvex-ai-blogger' ) ] );
			}

			// Resume the campaign.
			Metadata::update_campaign_meta( $campaign_id, 'isPaused', false );
			Metadata::update_campaign_meta( $campaign_id, 'pausedAt', '' );
			Metadata::update_campaign_meta( $campaign_id, 'pauseReason', '' );

			// Ensure campaign status is publish.
			if ( $campaign->post_status !== 'publish' ) {
				wp_update_post(
					[
						'ID'          => $campaign_id,
						'post_status' => 'publish',
					]
				);
			}

			// Schedule the next post immediately (or after a short delay).
			$next_run = time() + 60; // Start in 1 minute.
			wp_schedule_single_event( $next_run, 'wpsolvex_autoaiblogger_create_single_post', [ $campaign_id ] );

			wp_send_json_success(
				[
					'message'  => __( 'Campaign resumed successfully.', 'solvex-ai-blogger' ),
					'isPaused' => false,
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => __( 'An error occurred while resuming the campaign.', 'solvex-ai-blogger' ) ] );
		}
	}

	/**
	 * Reschedule a campaign's cron jobs (debug utility).
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_reschedule_campaign(): void {
		try {
			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_reschedule_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => __( 'Security check failed', 'solvex-ai-blogger' ) ] );
			}

			// Permission check.
			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( [ 'message' => __( 'You do not have permission to perform this action', 'solvex-ai-blogger' ) ] );
			}

			// Get campaign ID.
			$campaign_id = isset( $_POST['campaign_id'] ) ? absint( $_POST['campaign_id'] ) : 0;

			if ( ! $campaign_id ) {
				wp_send_json_error( [ 'message' => __( 'Invalid campaign ID', 'solvex-ai-blogger' ) ] );
			}

			// Get campaign metadata.
			$repeat_interval = get_post_meta( $campaign_id, 'repeatInterval', true );
			$repeat_unit     = get_post_meta( $campaign_id, 'repeatUnit', true );
			$start_date      = get_post_meta( $campaign_id, 'startDate', true );

			if ( empty( $repeat_interval ) || empty( $repeat_unit ) ) {
				wp_send_json_error( [ 'message' => __( 'Campaign is missing repeat interval or unit', 'solvex-ai-blogger' ) ] );
			}

			// Create meta_input array.
			$meta_input = [
				'repeatInterval' => $repeat_interval,
				'repeatUnit'     => $repeat_unit,
				'startDate'      => $start_date,
			];

			// Call the existing schedule method.
			$this->schedule_campaign_posts( $campaign_id, $meta_input );

			wp_send_json_success(
				[
					'message' => __( 'Campaign cron jobs rescheduled successfully!', 'solvex-ai-blogger' ),
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => __( 'Failed to reschedule campaign', 'solvex-ai-blogger' ) ] );
		}
	}

	/**
	 * Generate unique blog topics for a campaign based on SEO keywords.
	 *
	 * Calls the server's generate-post-ideas endpoint with campaign-specific context
	 * to generate unique, diverse topic titles for multi-post campaigns.
	 *
	 * @since 1.1.1
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_generate_campaign_topics(): void {
		try {
			// Security validation.
			$security_check = $this->validate_ajax_security( 'generate_campaign_topics' );
			if ( is_wp_error( $security_check ) ) {
				wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
				return;
			}

			// Nonce validation.
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			$keywords = isset( $_POST['keywords'] ) ? sanitize_text_field( wp_unslash( $_POST['keywords'] ) ) : '';
			$count    = isset( $_POST['count'] ) ? absint( $_POST['count'] ) : 5;
			$format   = isset( $_POST['format'] ) ? sanitize_text_field( wp_unslash( $_POST['format'] ) ) : 'standard';

			if ( empty( $keywords ) ) {
				wp_send_json_error( [ 'message' => __( 'Keywords are required to generate topics.', 'solvex-ai-blogger' ) ] );
				return;
			}

			$count = max( 1, min( 20, $count ) );

			// Get license and site persona.
			$license = Helper::get_option( 'license', '' );
			if ( empty( $license ) ) {
				wp_send_json_error( [ 'message' => __( 'License is required. Please activate your license first.', 'solvex-ai-blogger' ) ] );
				return;
			}

			$settings     = Settings::get_ai_blogger_settings();
			$site_title   = $settings['siteTitle'] ?? get_bloginfo( 'name' );
			$site_purpose = $settings['siteFor'] ?? '';
			$site_desc    = $settings['siteDescription'] ?? get_bloginfo( 'description' );

			// Format-specific context for better topic generation.
			$format_labels = [
				'listicle'    => 'listicle/top-list',
				'step_by_step' => 'how-to guide',
				'comparison'  => 'comparison article',
				'glossary'    => 'glossary/terms reference',
				'standard'    => 'blog post',
			];
			$format_label = $format_labels[ $format ] ?? 'blog post';

			// Call the server generate-post-ideas endpoint.
			$api_url  = 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-post-ideas';
			$response = wp_remote_post(
				$api_url,
				[
					'headers' => [
						'Content-Type' => 'application/json',
						'User-Agent'   => 'Solvex-AI-Blogger/' . WPSOLVEX_AUTOAIBLOGGER_VERSION,
					],
					'body'    => wp_json_encode(
						[
							'license'            => $license,
							'site_title'         => $site_title,
							'site_purpose'       => "Generate {$count} unique {$format_label} topics about: {$keywords}. " . $site_purpose,
							'site_description'   => $site_desc,
							'temperature'        => floatval( $settings['temperature'] ?? 1 ),
							'harassment'         => absint( $settings['harassment'] ?? 2 ),
							'hate'               => absint( $settings['hate'] ?? 2 ),
							'sexually_explicit'  => absint( $settings['sexuallyExplicit'] ?? 2 ),
							'dangerous_content'  => absint( $settings['dangerousContent'] ?? 2 ),
						]
					),
					'timeout' => 30,
				]
			);

			if ( is_wp_error( $response ) ) {
				$error_message = $response->get_error_message();
				$error_code    = $response->get_error_code();
				wp_send_json_error( [
					'message' => sprintf(
						/* translators: %s: error details */
						__( 'Failed to connect to the server: %s (Code: %s)', 'solvex-ai-blogger' ),
						$error_message,
						$error_code
					),
				] );
				return;
			}

			$response_code = wp_remote_retrieve_response_code( $response );
			$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

			if ( $response_code !== 200 || empty( $response_body ) ) {
				$error_msg = $response_body['message'] ?? __( 'Server returned an error. Please try again.', 'solvex-ai-blogger' );
				wp_send_json_error( [ 'message' => $error_msg ] );
				return;
			}

			// Extract topics from response.
			$topics = $response_body['data']['post_ideas'] ?? $response_body['post_ideas'] ?? [];

			if ( empty( $topics ) || ! is_array( $topics ) ) {
				wp_send_json_error( [ 'message' => __( 'No topics were generated. Please try again.', 'solvex-ai-blogger' ) ] );
				return;
			}

			// Trim to requested count.
			$topics = array_slice( array_values( $topics ), 0, $count );

			wp_send_json_success(
				[
					'topics'  => $topics,
					'message' => sprintf(
						/* translators: %d: number of topics generated */
						__( '%d topics generated successfully!', 'solvex-ai-blogger' ),
						count( $topics )
					),
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => __( 'Failed to generate topics. Please try again.', 'solvex-ai-blogger' ) ] );
		}
	}

	/**
	 * Perform comprehensive security validation for AJAX requests.
	 *
	 * @param string $action The AJAX action being performed.
	 * @return bool|\WP_Error True if valid, WP_Error if security check fails.
	 * @since 0.0.2
	 */
	private function validate_ajax_security( $action = '' ) {
		try {
			// Check user capabilities.
			if ( ! current_user_can( WPSOLVEX_AUTOAIBLOGGER_CAPABILITY ) ) {
				return new \WP_Error( 'permission_denied', $this->get_error_msg( 'permission' ) );
			}

			// Validate request size.
			$request_size_check = $this->validate_ajax_request_size();
			if ( is_wp_error( $request_size_check ) ) {
				return $request_size_check;
			}

			// Check for suspicious User-Agent.
			$user_agent_check = $this->validate_user_agent();
			if ( is_wp_error( $user_agent_check ) ) {
				return $user_agent_check;
			}

			// Validate referer for admin requests.
			$referer_check = $this->validate_admin_referer();
			if ( is_wp_error( $referer_check ) ) {
				return $referer_check;
			}

			return true;

		} catch ( \Exception $e ) {
			return new \WP_Error( 'security_error', $this->get_error_msg( 'security_violation' ) );
		}
	}

	/**
	 * Validate AJAX request size.
	 *
	 * @return bool|\WP_Error True if valid, WP_Error if too large.
	 * @since 0.0.2
	 */
	private function validate_ajax_request_size() {
		$content_length = isset( $_SERVER['CONTENT_LENGTH'] ) ? absint( $_SERVER['CONTENT_LENGTH'] ) : 0;

		if ( (int) $content_length > self::MAX_REQUEST_SIZE ) {
			return new \WP_Error( 'request_too_large', $this->get_error_msg( 'request_too_large' ) );
		}

		return true;
	}

	/**
	 * Validate User-Agent header.
	 *
	 * @return bool|\WP_Error True if valid, WP_Error if suspicious.
	 * @since 0.0.2
	 */
	private function validate_user_agent() {
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';

		if ( empty( $user_agent ) ) {
			return new \WP_Error( 'invalid_user_agent', $this->get_error_msg( 'security_violation' ) );
		}

		$suspicious_patterns = [
			'bot',
			'crawler',
			'spider',
			'scraper',
			'curl/7.',
			'wget',
			'python-requests',
			'libwww-perl',
			'java/',
			'go-http-client',
		];

		$user_agent_lower = strtolower( $user_agent );

		foreach ( $suspicious_patterns as $pattern ) {
			if ( strpos( $user_agent_lower, $pattern ) !== false ) {
				// Allow legitimate WordPress and plugin requests.
				if ( strpos( $user_agent_lower, 'wordpress' ) === false && strpos( $user_agent_lower, 'solvex-ai-blogger' ) === false ) {
					return new \WP_Error( 'suspicious_user_agent', $this->get_error_msg( 'security_violation' ) );
				}
			}
		}

		return true;
	}

	/**
	 * Validate admin referer.
	 *
	 * @return bool|\WP_Error True if valid, WP_Error if invalid.
	 * @since 0.0.2
	 */
	private function validate_admin_referer() {
		$referer = isset( $_SERVER['HTTP_REFERER'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : '';

		if ( ! empty( $referer ) ) {
			$admin_url = admin_url();
			$site_url  = get_site_url();

			if ( strpos( $referer, $admin_url ) !== 0 && strpos( $referer, $site_url ) !== 0 ) {
				return new \WP_Error( 'invalid_referer', $this->get_error_msg( 'security_violation' ) );
			}
		}

		return true;
	}

	/**
	 * Sanitize and validate campaign data.
	 *
	 * @param array<string, mixed> $campaign_data Raw campaign data.
	 * @return array<string, mixed>|\WP_Error Sanitized data or error.
	 * @since 0.0.2
	 */
	private function sanitize_campaign_data( $campaign_data ) {
		if ( ! is_array( $campaign_data ) ) {
			return new \WP_Error( 'invalid_data_type', $this->get_error_msg( 'invalid_data' ) );
		}

		$allowed_keys = [
			'id',
			'title',
			'content',
			'status',
			'frequency',
			'keywords',
			'category',
			'tags',
			'meta_input',
			'post_count',
			'schedule',
			'repeatWeeklyOn',
			'startDate',
		];

		$sanitized = [];

		foreach ( $campaign_data as $key => $value ) {
			// Only allow whitelisted keys.
			if ( ! in_array( $key, $allowed_keys, true ) ) {
				continue;
			}

			// Sanitize based on key type.
			switch ( $key ) {
				case 'id':
				case 'post_count':
					$sanitized[ $key ] = absint( $value );
					break;
				case 'title':
					$sanitized[ $key ] = sanitize_text_field( (string) $value );
					if ( strlen( $sanitized[ $key ] ) > 200 ) {
						return new \WP_Error( 'title_too_long', __( 'Campaign title is too long.', 'solvex-ai-blogger' ) );
					}
					break;
				case 'content':
					$sanitized[ $key ] = wp_kses_post( (string) $value );
					if ( strlen( $sanitized[ $key ] ) > self::MAX_CAMPAIGN_CONTENT_LENGTH ) {
						return new \WP_Error( 'content_too_long', $this->get_error_msg( 'content_too_long' ) );
					}
					break;
				case 'status':
					$allowed_statuses  = [ 'draft', 'publish', 'private', 'pending' ];
					$sanitized[ $key ] = is_string( $value ) && in_array( $value, $allowed_statuses, true ) ? $value : 'draft';
					break;
				case 'keywords':
				case 'tags':
				case 'repeatWeeklyOn':
					if ( is_array( $value ) ) {
						$sanitized[ $key ] = array_map( 'sanitize_text_field', array_map( 'strval', $value ) );
					} else {
						$sanitized[ $key ] = sanitize_text_field( (string) $value );
					}
					break;
				case 'category':
					$sanitized[ $key ] = absint( $value );
					break;
				case 'meta_input':
					if ( is_array( $value ) ) {
						$sanitized[ $key ] = $this->sanitize_meta_input( $value );
					}
					break;
				default:
					$sanitized[ $key ] = sanitize_text_field( (string) $value );
			}
		}

		return $sanitized;
	}

	/**
	 * Sanitize meta input data.
	 *
	 * @param array<string, mixed> $meta_data Raw meta data.
	 * @return array<string, mixed> Sanitized meta data.
	 * @since 0.0.2
	 */
	private function sanitize_meta_input( $meta_data ) {
		$sanitized         = [];
		$allowed_meta_keys = [
			'frequency',
			'keywords',
			'category',
			'tags',
			'post_count',
			'content_length',
			'tone',
			'language',
			'include_images',
		];

		foreach ( $meta_data as $key => $value ) {
			if ( ! in_array( $key, $allowed_meta_keys, true ) ) {
				continue;
			}

			switch ( $key ) {
				case 'frequency':
				case 'post_count':
				case 'content_length':
				case 'category':
					$sanitized[ $key ] = absint( $value );
					break;
				case 'include_images':
					$sanitized[ $key ] = (bool) $value;
					break;
				case 'tone':
				case 'language':
					$sanitized[ $key ] = sanitize_text_field( (string) $value );
					break;
				case 'keywords':
				case 'tags':
					if ( is_array( $value ) ) {
						$sanitized[ $key ] = array_map( 'sanitize_text_field', array_map( 'strval', $value ) );
					} else {
						$sanitized[ $key ] = sanitize_text_field( (string) $value );
					}
					break;
				default:
					$sanitized[ $key ] = sanitize_text_field( (string) $value );
			}
		}

		return $sanitized;
	}

	/**
	 * Remove a post idea from the database when a post is created from it.
	 * This keeps Redux unchanged so UI can show "Open Post" button until page refresh.
	 * Uses atomic operations to prevent race conditions when multiple posts are created quickly.
	 *
	 * @param string $post_title The title of the post that was created.
	 * @since 0.0.2
	 */
	private function remove_post_idea_from_db( $post_title ): void {
		$lock_key = 'wpsolvex_autoaiblogger_postideas_lock'; // Define early to avoid undefined variable issues.

		try {
			// Sanitize the title.
			$post_title = sanitize_text_field( trim( $post_title ) );
			if ( empty( $post_title ) ) {
				return;
			}

			// Use WordPress transients for atomic operations to prevent race conditions.
			$max_lock_time = 10; // Maximum lock time in seconds.

			// Try to acquire lock (retry up to 5 times).
			$lock_acquired = false;
			$retry_count   = 0;
			$max_retries   = 5;

			while ( ! $lock_acquired && $retry_count < $max_retries ) {
				$existing_lock = get_transient( $lock_key );

				if ( $existing_lock === false ) {
					// No lock exists, try to set one.
					$lock_acquired = set_transient( $lock_key, time(), $max_lock_time );
					if ( $lock_acquired ) {
						break; // Successfully acquired lock.
					}
				} else {
					// Lock exists, check if it's expired.
					$lock_time = intval( $existing_lock );
					if ( time() - $lock_time > $max_lock_time ) {
						// Lock is expired, force remove it and try again.
						delete_transient( $lock_key );
					} else {
						// Wait a bit before retrying.
						usleep( 50000 ); // 50ms.
					}
				}
				$retry_count++;
			}

			if ( ! $lock_acquired ) {
				// Could not acquire lock, return.
				return;
			}

			// Now we have the lock, perform the operation.
			try {
				// Get current post ideas from database (fresh read).
				$current_post_ideas = \WPSolvex\AutoAIBlogger\Inc\Utils\Helper::get_option( 'postIdeas', '' );

				if ( empty( $current_post_ideas ) || ! is_string( $current_post_ideas ) ) {
					return;
				}

				// Convert post ideas string to array.
				$ideas_array = array_filter( array_map( 'trim', explode( "\n", $current_post_ideas ) ) );

				// Find and remove the exact matching idea.
				$updated_ideas     = [];
				$found_and_removed = false;

				foreach ( $ideas_array as $idea ) {
					if ( ! $found_and_removed && trim( $idea ) === $post_title ) {
						$found_and_removed = true;
						continue; // Skip this idea (remove it).
					}
					$updated_ideas[] = $idea;
				}

				// Only update if we actually removed something.
				if ( $found_and_removed ) {
					// Check if this was the last post idea.
					if ( empty( $updated_ideas ) ) {
						// Set to "-1" to indicate post ideas are exhausted.
						\WPSolvex\AutoAIBlogger\Inc\Utils\Helper::update_option( 'postIdeas', '-1' );
					} else {
						$updated_post_ideas_string = implode( "\n", $updated_ideas );
						\WPSolvex\AutoAIBlogger\Inc\Utils\Helper::update_option( 'postIdeas', $updated_post_ideas_string );
					}
				}
			} finally {
				// Always release the lock.
				delete_transient( $lock_key );
			}

		} catch ( \Exception $e ) {
			// Log error but don't fail the post creation.
			// Make sure to release lock even on exception.
			delete_transient( $lock_key );
		}
	}

	/**
	 * Generate content from title using the API.
	 *
	 * @param string               $title The post title.
	 * @param array<string, mixed> $post_data Additional post data.
	 * @return array<string, mixed>|\WP_Error Generated content or error.
	 * @since 0.0.2
	 */
	private function generate_content_from_title_api( $title, $post_data = [] ) {
		try {
			// Prepare API request data.
			$api_data = [
				'title' => $title,
			];

			// Add optional parameters if they exist in post_data with fallback values.
			if ( ! empty( $post_data['license'] ) && is_string( $post_data['license'] ) ) {
				$api_data['license'] = sanitize_text_field( $post_data['license'] );
			} else {
				// Get license from plugin settings if not provided.
				$api_data['license'] = \WPSolvex\AutoAIBlogger\Inc\Utils\Helper::get_option( 'license', '' );
			}

			if ( ! empty( $post_data['site_title'] ) && is_string( $post_data['site_title'] ) ) {
				$api_data['site_title'] = sanitize_text_field( $post_data['site_title'] );
			}

			if ( ! empty( $post_data['site_purpose'] ) && is_string( $post_data['site_purpose'] ) ) {
				$api_data['site_purpose'] = sanitize_text_field( $post_data['site_purpose'] );
			}

			if ( ! empty( $post_data['site_description'] ) && is_string( $post_data['site_description'] ) ) {
				$api_data['site_description'] = sanitize_text_field( $post_data['site_description'] );
			}

			// Temperature with fallback to 0.7.
			$api_data['temperature'] = isset( $post_data['temperature'] ) ? floatval( $post_data['temperature'] ) : 0.7;

			// Add image count parameter (default to 0 if not specified).
			$api_data['image_count'] = isset( $post_data['image_count'] ) ? absint( $post_data['image_count'] ) : 0;

			// Safety settings with fallback values.
			$safety_settings = [
				'harassment'        => 1,
				'hate'              => 1,
				'sexually_explicit' => 2,
				'dangerous_content' => 1,
			];

			foreach ( $safety_settings as $setting => $default_value ) {
				if ( isset( $post_data[ $setting ] ) ) {
					$api_data[ $setting ] = absint( $post_data[ $setting ] );
				} else {
					$api_data[ $setting ] = $default_value;
				}
			}

			// Make API request.
			$api_url = WPSOLVEX_AUTOAIBLOGGER_CONTENT_FROM_TITLE_POST_API;

			$response = wp_remote_post(
				$api_url,
				[
					'timeout' => 90,
					'headers' => [
						'Content-Type' => 'application/json',
						'User-Agent'   => 'Solvex-AI-Blogger/' . WPSOLVEX_AUTOAIBLOGGER_VERSION . ' WordPress/' . get_bloginfo( 'version' ),
					],
					'body'    => $api_data ? wp_json_encode( $api_data ) : '',
				]
			);

			// Check for HTTP errors.
			if ( is_wp_error( $response ) ) {
				return new \WP_Error(
					'api_request_failed',
					__( 'Failed to connect to content generation API: ', 'solvex-ai-blogger' ) . $response->get_error_message()
				);
			}

			$http_code = wp_remote_retrieve_response_code( $response );

			// Parse response.
			$body             = wp_remote_retrieve_body( $response );
			$decoded_response = json_decode( $body, true );

			if ( json_last_error() !== JSON_ERROR_NONE ) {
				return new \WP_Error(
					'api_json_error',
					__( 'Invalid JSON response from API', 'solvex-ai-blogger' )
				);
			}

			// Handle non-200 HTTP status codes with API error response.
			if ( $http_code !== 200 ) {
				// Sync token data even on error responses to keep local cache accurate.
				if ( is_array( $decoded_response ) && isset( $decoded_response['token_data'] ) && is_array( $decoded_response['token_data'] ) ) {
					wpsolvex_autoaiblogger_update_token_data( $decoded_response['token_data'] );
				}

				// Try to extract error details from API response first.
				if ( is_array( $decoded_response ) && isset( $decoded_response['code'] ) && isset( $decoded_response['message'] ) ) {
					$error_code    = (string) $decoded_response['code'];
					$error_message = (string) $decoded_response['message'];
					$error_data    = isset( $decoded_response['data'] ) && is_array( $decoded_response['data'] ) && isset( $decoded_response['data']['status'] ) ? [ 'status' => (int) $decoded_response['data']['status'] ] : [ 'status' => $http_code ];

					// Attach token_data to WP_Error so callers can forward it.
					if ( is_array( $decoded_response['token_data'] ?? null ) ) {
						$error_data['token_data'] = $decoded_response['token_data'];
					}

					return new \WP_Error( $error_code, $error_message, $error_data );
				}
					// Fallback to generic HTTP error.
					return new \WP_Error(
						'api_http_error',
						sprintf(
							/* translators: %d is the HTTP status code */
							__( 'API returned HTTP error %d', 'solvex-ai-blogger' ),
							$http_code
						),
						[ 'status' => $http_code ]
					);

			}

			// Check API response status.
			if ( is_array( $decoded_response ) && isset( $decoded_response['code'] ) && $decoded_response['code'] !== 'success' ) {
				// Sync token data even on non-success responses.
				if ( isset( $decoded_response['token_data'] ) && is_array( $decoded_response['token_data'] ) ) {
					wpsolvex_autoaiblogger_update_token_data( $decoded_response['token_data'] );
				}

				$error_message = (string) ( $decoded_response['message'] ?? __( 'Unknown API error', 'solvex-ai-blogger' ) );
				$error_code    = (string) ( $decoded_response['code'] ?? 'api_error' );

				// Include HTTP status code if available.
				$http_status = isset( $decoded_response['data'] ) && is_array( $decoded_response['data'] ) && isset( $decoded_response['data']['status'] ) ? (int) $decoded_response['data']['status'] : null;
				$error_data  = $http_status ? [ 'status' => $http_status ] : [];

				// Attach token_data to WP_Error for caller forwarding.
				if ( is_array( $decoded_response['token_data'] ?? null ) ) {
					$error_data['token_data'] = $decoded_response['token_data'];
				}

				return new \WP_Error( $error_code, $error_message, $error_data );
			}

			// Extract generated content and images.
			if ( ! is_array( $decoded_response ) || ! isset( $decoded_response['post_content'] ) ) {
				return new \WP_Error(
					'api_no_content',
					__( 'API did not return generated content', 'solvex-ai-blogger' )
				);
			}

			$generated_content = (string) $decoded_response['post_content'];

			// Validate content length.
			if ( empty( $generated_content ) || strlen( $generated_content ) < 50 ) {
				return new \WP_Error(
					'api_content_too_short',
					__( 'Generated content is too short or empty', 'solvex-ai-blogger' )
				);
			}

			// Extract images array if present.
			$images = isset( $decoded_response['images'] ) && is_array( $decoded_response['images'] ) ? $decoded_response['images'] : [];

			// Extract summary/excerpt if present.
			$summary = isset( $decoded_response['summary'] ) && is_string( $decoded_response['summary'] ) ? (string) $decoded_response['summary'] : '';

			// Extract and update token data if present.
			$token_data = isset( $decoded_response['token_data'] ) && is_array( $decoded_response['token_data'] ) ? $decoded_response['token_data'] : null;

			return [
				'post_content' => $generated_content,
				'summary'      => $summary,
				'images'       => $images,
				'token_data'   => $token_data,
			];

		} catch ( \Exception $e ) {
			return new \WP_Error(
				'api_exception',
				__( 'Exception occurred during content generation: ', 'solvex-ai-blogger' ) . $e->getMessage()
			);
		}
	}

	/**
	 * Process images from API response and replace placeholders in content.
	 *
	 * @param string                           $content The post content with placeholders.
	 * @param array<int, array<string, mixed>> $images Array of image data from API.
	 * @return array<string, mixed>|\WP_Error Processed data with content and featured image ID or error.
	 * @since 0.0.2
	 */
	/**
	 * Processes images and replaces placeholders in content according to image placement rules.
	 *
	 * Rules:
	 * - 0 images: Remove all placeholders, no featured image.
	 * - 1 image: Set as featured only, remove all placeholders from content.
	 * - >1 images: First = featured, remaining replace placeholders or insert after H2 sections.
	 *
	 * @since 1.0.0
	 *
	 * @param string $content Content markup with potential {{WP_AIB_IMAGE}} placeholders.
	 * @param array  $images  Array of image data with 'url' and optional 'alt_text'.
	 * @return array|\WP_Error Array with 'content' and 'featured_image_id', or WP_Error on failure.
	 */
	private function process_images_and_replace_placeholders( $content, $images ) {
		try {
			// Validate input.
			if ( ! is_string( $content ) ) {
				return new \WP_Error(
					'invalid_content',
					__( 'Content must be a string.', 'solvex-ai-blogger' )
				);
			}

			if ( empty( $images ) || ! is_array( $images ) ) {
				// No images - remove all placeholders.
				$cleaned_content = preg_replace( '/^\s*\{\{WP_AIB_IMAGE\}\}\s*$/m', '', $content );
				return [
					'content'           => trim( $cleaned_content ),
					'featured_image_id' => null,
				];
			}

			// Upload all images to media library and normalize data.
			$normalized_images = [];
			foreach ( $images as $image_data ) {
				if ( ! is_array( $image_data ) || empty( $image_data['url'] ) ) {
					continue; // Skip invalid images.
				}

				// Upload image to media library.
				$attachment_id = $this->upload_image_to_media_library(
					(string) $image_data['url'],
					isset( $image_data['alt_text'] ) ? (string) $image_data['alt_text'] : 'Generated image'
				);

				if ( is_wp_error( $attachment_id ) ) {
					// Log error but continue with other images.
					continue;
				}

				// Get uploaded image details.
				$image_url = wp_get_attachment_url( $attachment_id );
				$image_alt = get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );

				if ( empty( $image_alt ) && isset( $image_data['alt_text'] ) ) {
					$image_alt = (string) $image_data['alt_text'];
				}

				$normalized_images[] = [
					'id'  => $attachment_id,
					'src' => $image_url,
					'alt' => ! empty( $image_alt ) ? $image_alt : 'Generated image',
				];
			}

			// Case 1: No successfully uploaded images - remove placeholders.
			if ( empty( $normalized_images ) ) {
				$cleaned_content = preg_replace( '/^\s*\{\{WP_AIB_IMAGE\}\}\s*$/m', '', $content );
				return [
					'content'           => trim( $cleaned_content ),
					'featured_image_id' => null,
				];
			}

			// Case 2: Exactly 1 image - set as featured, remove all placeholders.
			if ( count( $normalized_images ) === 1 ) {
				$cleaned_content = preg_replace( '/^\s*\{\{WP_AIB_IMAGE\}\}\s*$/m', '', $content );
				return [
					'content'           => trim( $cleaned_content ),
					'featured_image_id' => $normalized_images[0]['id'],
				];
			}

			// Case 3: Multiple images - first is featured, remaining go into content.
			$featured_image_id = $normalized_images[0]['id'];
			$remaining_images  = array_slice( $normalized_images, 1 );

			// Check if placeholders exist.
			$placeholder_count = preg_match_all( '/^\s*\{\{WP_AIB_IMAGE\}\}\s*$/m', $content );

			if ( $placeholder_count > 0 ) {
				// Replace placeholders with image blocks.
				$content = $this->replace_placeholders_with_images( $content, $remaining_images );
			} else {
				// No placeholders - inject after H2 headings.
				$content = $this->inject_images_after_h2_sections( $content, $remaining_images );
			}

			return [
				'content'           => trim( $content ),
				'featured_image_id' => $featured_image_id,
			];

		} catch ( \Exception $e ) {
			return new \WP_Error(
				'image_processing_error',
				__( 'Exception occurred during image processing: ', 'solvex-ai-blogger' ) . $e->getMessage()
			);
		}
	}

	/**
	 * Builds a core/image Gutenberg block.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $attachment_id The WordPress attachment ID.
	 * @param string $src           The image source URL.
	 * @param string $alt           The image alt text (optional).
	 * @return string The Gutenberg image block markup.
	 */
	private function build_core_image_block( int $attachment_id, string $src, string $alt = '' ): string {
		// Build attributes.
		$attrs = [
			'id'              => $attachment_id,
			'sizeSlug'        => 'full',
			'linkDestination' => 'none',
		];

		$attrs_json = wp_json_encode( $attrs, JSON_UNESCAPED_SLASHES );

		// Sanitize URL and alt text.
		$escaped_src = esc_url( $src );
		$escaped_alt = esc_attr( $alt );

		// Build the image block.
		return "<!-- wp:image {$attrs_json} -->\n" .
			'<figure class="wp-block-image size-full">' .
			"<img src=\"{$escaped_src}\" alt=\"{$escaped_alt}\" class=\"wp-image-{$attachment_id}\"/> </figure> <!-- /wp:image -->\n\n";
	}

	/**
	 * Replaces {{WP_AIB_IMAGE}} placeholders with actual image blocks.
	 *
	 * @since 1.0.0
	 *
	 * @param string $markup Content markup with placeholders.
	 * @param array  $images Array of normalized image data.
	 * @return string Content with placeholders replaced by image blocks.
	 */
	private function replace_placeholders_with_images( string $markup, array $images ): string {
		$image_index  = 0;
		$total_images = count( $images );

		// Replace each placeholder with an image block.
		$markup = preg_replace_callback(
			'/^\s*\{\{WP_AIB_IMAGE\}\}\s*$/m',
			function ( $matches ) use ( &$image_index, $total_images, $images ) {
				if ( $image_index < $total_images ) {
					$image = $images[ $image_index ];
					$image_index++;

					$block = $this->build_core_image_block(
						$image['id'],
						$image['src'],
						$image['alt']
					);

					// Escape special characters for replacement.
					return addcslashes( $block, '\\$' );
				}

				// No more images - remove placeholder.
				return '';
			},
			$markup
		);

		// Remove any leftover placeholders.
		return preg_replace( '/^\s*\{\{WP_AIB_IMAGE\}\}\s*$/m', '', $markup );
	}

	/**
	 * Injects images after H2 heading sections when no placeholders exist.
	 *
	 * @since 1.0.0
	 *
	 * @param string $markup Content markup without placeholders.
	 * @param array  $images Array of normalized image data.
	 * @return string Content with images injected after H2 sections.
	 */
	private function inject_images_after_h2_sections( string $markup, array $images ): string {
		if ( empty( $images ) ) {
			return $markup;
		}

		$lines         = explode( "\n", $markup );
		$output_lines  = [];
		$image_index   = 0;
		$total_images  = count( $images );
		$in_heading    = false;
		$heading_level = 0;

		foreach ( $lines as $line ) {
			$output_lines[] = $line;

			// Detect heading block opening.
			if ( preg_match( '/^<!--\s*wp:heading\s*(\{[^}]*\})?\s*-->/', $line, $matches ) ) {
				$in_heading = true;

				// Parse heading level from attributes.
				if ( isset( $matches[1] ) ) {
					$attrs_json    = $matches[1];
					$attrs         = json_decode( $attrs_json, true );
					$heading_level = ( json_last_error() === JSON_ERROR_NONE && is_array( $attrs ) ) ? ( $attrs['level'] ?? 2 ) : 2;
				} else {
					$heading_level = 2; // Default level.
				}
			}

			// Detect heading block closing.
			if ( $in_heading && preg_match( '/^<!--\s*\/wp:heading\s*-->/', $line ) ) {
				$in_heading = false;

				// If this was an H2 and we have images left, insert one.
				if ( $heading_level === 2 && $image_index < $total_images ) {
					$image = $images[ $image_index ];
					$image_index++;

					$image_block = $this->build_core_image_block(
						$image['id'],
						$image['src'],
						$image['alt']
					);

					// Add image block after the heading (split into lines).
					$image_lines = explode( "\n", trim( $image_block ) );
					foreach ( $image_lines as $img_line ) {
						$output_lines[] = $img_line;
					}
				}
			}
		}

		// Append any leftover images at the end.
		while ( $image_index < $total_images ) {
			$image = $images[ $image_index ];
			$image_index++;

			$image_block = $this->build_core_image_block(
				$image['id'],
				$image['src'],
				$image['alt']
			);

			$image_lines = explode( "\n", trim( $image_block ) );
			foreach ( $image_lines as $img_line ) {
				$output_lines[] = $img_line;
			}
		}

		return implode( "\n", $output_lines );
	}

	/**
	 * Upload an image from URL to WordPress media library.
	 *
	 * @param string $image_url The image URL to upload.
	 * @param string $alt_text The alt text for the image.
	 * @return int|\WP_Error The attachment ID or error.
	 * @since 0.0.2
	 */
	private function upload_image_to_media_library( $image_url, $alt_text = '' ) {
		try {
			// Download the image.
			$response = wp_remote_get(
				$image_url,
				[
					'timeout' => 30,
					'headers' => [
						'User-Agent' => 'Solvex-AI-Blogger/' . WPSOLVEX_AUTOAIBLOGGER_VERSION . ' WordPress/' . get_bloginfo( 'version' ),
					],
				]
			);

			if ( is_wp_error( $response ) ) {
				return new \WP_Error(
					'image_download_failed',
					__( 'Failed to download image: ', 'solvex-ai-blogger' ) . $response->get_error_message()
				);
			}

			$http_code = wp_remote_retrieve_response_code( $response );
			if ( $http_code !== 200 ) {
				return new \WP_Error(
					'image_download_http_error',
					sprintf(
						/* translators: %d is the HTTP status code */
						__( 'Image download returned HTTP error %d', 'solvex-ai-blogger' ),
						$http_code
					)
				);
			}

			$image_data = wp_remote_retrieve_body( $response );
			if ( empty( $image_data ) ) {
				return new \WP_Error(
					'image_download_empty',
					__( 'Downloaded image data is empty', 'solvex-ai-blogger' )
				);
			}

			// Get image info from the URL.
			$url_path   = wp_parse_url( $image_url, PHP_URL_PATH );
			$image_info = is_string( $url_path ) ? pathinfo( $url_path ) : [];
			$filename   = sanitize_file_name( $image_info['filename'] ?? 'generated-image' );
			$extension  = $image_info['extension'] ?? 'jpg';

			// Ensure we have a valid filename.
			if ( empty( $filename ) ) {
				$filename = 'generated-image-' . time();
			}

			$filename .= '.' . $extension;

			// Upload to WordPress.
			$upload = wp_upload_bits( $filename, null, $image_data );
			if ( $upload['error'] ) {
				return new \WP_Error(
					'image_upload_failed',
					__( 'Failed to upload image: ', 'solvex-ai-blogger' ) . $upload['error']
				);
			}

			// Create attachment.
			$attachment = [
				'post_mime_type' => wp_check_filetype( $upload['file'] )['type'],
				'post_title'     => sanitize_text_field( $alt_text ),
				'post_content'   => '',
				'post_status'    => 'inherit',
			];

			$attachment_id = wp_insert_attachment( $attachment, $upload['file'] );
			if ( is_wp_error( $attachment_id ) ) {
				return $attachment_id;
			}

			// Set alt text.
			if ( ! empty( $alt_text ) ) {
				update_post_meta( $attachment_id, '_wp_attachment_image_alt', sanitize_text_field( $alt_text ) );
			}

			// Generate attachment metadata.
			require_once ABSPATH . 'wp-admin/includes/image.php';
			$attachment_data = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
			wp_update_attachment_metadata( $attachment_id, $attachment_data );

			return $attachment_id;

		} catch ( \Exception $e ) {
			return new \WP_Error(
				'image_upload_exception',
				__( 'Exception occurred during image upload: ', 'solvex-ai-blogger' ) . $e->getMessage()
			);
		}
	}

	/**
	 * Schedule campaign posts using a simplified approach.
	 *
	 * @param int   $campaign_id Campaign ID.
	 * @param array $meta_input  Campaign metadata.
	 * @return void
	 * @since 0.0.2
	 */
	private function schedule_campaign_posts( $campaign_id, $meta_input ): void {
		try {
			// Only schedule if campaign is active and has valid scheduling data.
			if ( empty( $meta_input['repeatInterval'] ) || empty( $meta_input['repeatUnit'] ) ) {
				return;
			}

			$interval = absint( $meta_input['repeatInterval'] );

			if ( ! $interval ) {
				return;
			}

			// Clear any existing scheduled events for this campaign.
			wp_clear_scheduled_hook( 'wpsolvex_autoaiblogger_create_single_post', [ $campaign_id ] );

			// Check if campaign post is published (active).
			$campaign_post = get_post( $campaign_id );
			if ( ! $campaign_post ) {
				return;
			}

			// Only schedule if campaign is published.
			if ( $campaign_post->post_status !== 'publish' ) {
				return;
			}

			// Check if campaign is already completed.
			$campaign_completed = \WPSolvex\AutoAIBlogger\Inc\Utils\Metadata::get_campaign_meta( $campaign_id, 'campaignCompleted' );
			if ( $campaign_completed ) {
				return;
			}

			// Check if campaign is paused.
			$is_paused = \WPSolvex\AutoAIBlogger\Inc\Utils\Metadata::get_campaign_meta( $campaign_id, 'isPaused' );
			if ( $is_paused ) {
				return;
			}

			// Get the start date from campaign metadata.
			$start_date      = $meta_input['startDate'] ?? '';
			$start_timestamp = time() + 60; // Default fallback: 1 minute from now.

			if ( ! empty( $start_date ) ) {
				// Convert datetime-local format to timestamp.
				// The datetime-local input returns format: YYYY-MM-DDTHH:MM.
				// Convert it to WordPress timezone-aware timestamp.
				$parsed_timestamp = strtotime( $start_date );

				// Validate the parsed timestamp.
				if ( $parsed_timestamp !== false ) {
					// Convert to WordPress timezone if needed.
					// WordPress stores times in UTC, so we need to account for site timezone.
					$wp_timezone   = wp_timezone();
					$local_time    = new \DateTime( $start_date, $wp_timezone );
					$utc_timestamp = $local_time->getTimestamp();

					// If the start date is in the future, use it.
					if ( $utc_timestamp > time() ) {
						$start_timestamp = $utc_timestamp;
					} else {
						// If the start date is in the past, start in 1 minute.
						$start_timestamp = time() + 60;
					}
				}
				// If parsing fails, use the default (1 minute from now).
			}

			// Schedule the first post at the user-defined start date/time using single event.
			// The cron handler will self-schedule subsequent posts after each execution.
			// This matches the pause/resume pattern where we schedule one event at a time.
			wp_schedule_single_event( $start_timestamp, 'wpsolvex_autoaiblogger_create_single_post', [ $campaign_id ] );
		} catch ( \Exception $e ) {
			return;
		}
	}

	/**
	 * Calculate interval in seconds.
	 *
	 * @param int    $interval Interval number.
	 * @param string $unit     Time unit (day, week, month, year).
	 * @return int Interval in seconds.
	 * @since 0.0.2
	 */
	private function calculate_interval_seconds( $interval, $unit ): int {
		// Production mode: Normal intervals.
		$multipliers = [
			'day'   => DAY_IN_SECONDS,
			'week'  => WEEK_IN_SECONDS,
			'month' => 30 * DAY_IN_SECONDS,
			'year'  => 365 * DAY_IN_SECONDS,
		];

		$seconds = $interval * ( $multipliers[ $unit ] ?? DAY_IN_SECONDS );

		// Allow testing plugins to modify intervals.
		return apply_filters( 'wpsolvex_autoaiblogger_campaign_interval_seconds', $seconds, $interval, $unit );
	}

	/**
	 * Get WordPress cron schedule name or create custom one.
	 *
	 * @param int    $interval Interval number.
	 * @param string $unit     Time unit.
	 * @return string Schedule name.
	 * @since 0.0.2
	 */
	private function get_wp_cron_schedule( $interval, $unit ): string {
		// Use built-in schedules when possible.
		if ( $interval === 1 && $unit === 'day' ) {
			return 'daily';
		}
		if ( $interval === 1 && $unit === 'week' ) {
			return 'weekly';
		}

		// Create custom schedule name.
		$schedule_name = "wpsolvex_autoaiblogger_{$interval}_{$unit}";

		// Register custom schedule dynamically using a globally registered filter.
		// We store the schedule info in an option so the filter can pick it up.
		$custom_schedules = get_option( 'wpsolvex_autoaiblogger_custom_cron_schedules', [] );
		if ( ! isset( $custom_schedules[ $schedule_name ] ) ) {
			$custom_schedules[ $schedule_name ] = [
				'interval' => $this->calculate_interval_seconds( $interval, $unit ),
				'display'  => sprintf(
					/* translators: 1: Interval number, 2: Time unit, 3: s (if interval is greater than 1). */
					__( 'Every %1$d %2$s%3$s', 'solvex-ai-blogger' ),
					$interval,
					$unit,
					$interval > 1 ? 's' : ''
				),
			];
			update_option( 'wpsolvex_autoaiblogger_custom_cron_schedules', $custom_schedules );
		}

		return $schedule_name;
	}

	/**
	 * Get campaign creation logs including both success and error logs.
	 *
	 * @param int $campaign_id Campaign ID.
	 * @return array<mixed> Campaign creation logs.
	 * @since 0.0.2
	 */
	private function get_campaign_creation_logs( $campaign_id ): array {
		$logs = [];

		// Get real success logs using the helper function.
		$success_logs = wpsolvex_autoaiblogger_get_campaign_success_logs( $campaign_id, 20 );

		foreach ( $success_logs as $index => $log ) {
			// Use stored timestamp data directly (no backward compatibility needed).
			$mysql_timestamp   = $log['timestamp'] ?? '';
			$unix_timestamp    = $log['unix_timestamp'] ?? 0;
			$display_timestamp = $log['formatted_date'] ?? '';

			// Calculate time ago.
			$time_ago = '';
			if ( $unix_timestamp ) {
				$time_ago = human_time_diff( $unix_timestamp, current_time( 'timestamp' ) ) . ' ' . __( 'ago', 'solvex-ai-blogger' ); // phpcs:ignore.
			}

			$logs[] = [
				'id'             => 'success_' . ( $index + 1 ),
				'timestamp'      => $mysql_timestamp,
				'formatted_date' => $display_timestamp,
				'time_ago'       => $time_ago,
				'unix_timestamp' => $unix_timestamp,
				'status'         => 'success',
				'title'          => sprintf( /* translators: %d is the post number. */ __( 'Post #%d Created', 'solvex-ai-blogger' ), $log['post_number'] ?? $index + 1 ),
				'message'        => $log['message'] ?? sprintf( /* translators: %s is the success message. */ __( 'Post was created successfully and published.', 'solvex-ai-blogger' ) ),
				'post_id'        => $log['post_id'] ?? null,
				'post_title'     => $log['post_title'] ?? sprintf( /* translators: %1$s: Post number, %2$s: Default post title. */ __( 'Generated Blog Post #%d', 'solvex-ai-blogger' ), $log['post_number'] ?? $index + 1 ),
				'steps'          => [
					[
						'status'      => 'success',
						'description' => __( 'Campaign validation passed', 'solvex-ai-blogger' ),
						'duration'    => wp_rand( 50, 150 ),
					],
					[
						'status'      => 'success',
						'description' => __( 'API request initiated', 'solvex-ai-blogger' ),
						'duration'    => wp_rand( 200, 500 ),
					],
					[
						'status'      => 'success',
						'description' => __( 'Content generated successfully', 'solvex-ai-blogger' ),
						'duration'    => wp_rand( 1000, 3000 ),
					],
					[
						'status'      => 'success',
						'description' => __( 'Post created and published', 'solvex-ai-blogger' ),
						'duration'    => wp_rand( 100, 300 ),
					],
				],
			];
		}

		// Get real error logs using our new function.
		$error_logs = wpsolvex_autoaiblogger_get_campaign_error_logs( $campaign_id, 50 );

		// Merge success and error logs.
		$logs = array_merge( $logs, $error_logs );

		// Sort all logs by unix timestamp (newest first) for better accuracy.
		usort(
			$logs,
			static function( $a, $b ) {
				$timestamp_a = $a['unix_timestamp'] ?? strtotime( $a['timestamp'] ?? '1970-01-01' );
				$timestamp_b = $b['unix_timestamp'] ?? strtotime( $b['timestamp'] ?? '1970-01-01' );
				return $timestamp_b - $timestamp_a;
			}
		);

		return $logs;
	}

	/**
	 * Generate sample campaign logs for demonstration.
	 *
	 * @param int $campaign_id Campaign ID.
	 * @return array<mixed> Sample campaign logs.
	 * @since 0.0.2
	 */
	private function generate_sample_campaign_logs( $campaign_id ): array {
		$campaign_data   = \WPSolvex\AutoAIBlogger\Inc\Utils\Metadata::get_campaign_data( $campaign_id, true );
		$posts_created   = intval( $campaign_data['postsCreated'] ?? 0 );
		$posts_failed    = intval( $campaign_data['postsFailed'] ?? 0 );
		$posts_scheduled = intval( $campaign_data['postsScheduled'] ?? 0 );
		$posts_target    = intval( $campaign_data['postsTarget'] ?? 5 );

		$sample_logs = [];
		$log_counter = 1;

		// Generate logs for successful posts.
		for ( $i = 1; $i <= $posts_created; $i++ ) {
			$timestamp = current_time( 'mysql', false );
			$steps     = [
				[
					'status'      => 'success',
					'description' => __( 'Campaign validation passed', 'solvex-ai-blogger' ),
					'duration'    => wp_rand( 50, 150 ),
				],
				[
					'status'      => 'success',
					'description' => __( 'API request initiated', 'solvex-ai-blogger' ),
					'duration'    => wp_rand( 200, 500 ),
				],
				[
					'status'      => 'success',
					'description' => __( 'Content generated successfully', 'solvex-ai-blogger' ),
					'duration'    => wp_rand( 1000, 3000 ),
				],
				[
					'status'      => 'success',
					'description' => __( 'Post created and published', 'solvex-ai-blogger' ),
					'duration'    => wp_rand( 100, 300 ),
				],
			];

			$sample_logs[] = [
				'id'         => $log_counter,
				'timestamp'  => gmdate( 'Y-m-d H:i:s', strtotime( $timestamp ) - ( $posts_created - $i ) * 600 ),
				'status'     => 'success',
				'title'      => sprintf( /* translators: %d is the post number. */ __( 'Post #%d Created', 'solvex-ai-blogger' ), $i ),
				'message'    => sprintf( /* translators: %d is the post number. */ __( 'Post #%d was created successfully and published.', 'solvex-ai-blogger' ), $i ),
				'post_id'    => 1000 + $i,
				'post_title' => sprintf( /* translators: %d is the post number. */ __( 'Generated Blog Post #%d', 'solvex-ai-blogger' ), $i ),
				'steps'      => $steps,
			];
			$log_counter++;
		}

		// Generate logs for failed posts.
		$error_reasons = [
			__( 'API quota exceeded. Please check your subscription limits.', 'solvex-ai-blogger' ),
			__( 'Network timeout occurred during content generation.', 'solvex-ai-blogger' ),
			__( 'Invalid keywords provided. Content generation failed.', 'solvex-ai-blogger' ),
			__( 'Database connection error while saving post.', 'solvex-ai-blogger' ),
			__( 'Content filtering blocked the generated text.', 'solvex-ai-blogger' ),
		];

		for ( $i = 1; $i <= $posts_failed; $i++ ) {
			$timestamp    = current_time( 'mysql', false );
			$error_reason = $error_reasons[ array_rand( $error_reasons ) ];

			$failed_steps = [
				[
					'status'      => 'success',
					'description' => __( 'Campaign validation passed', 'solvex-ai-blogger' ),
					'duration'    => wp_rand( 50, 150 ),
				],
				[
					'status'      => 'success',
					'description' => __( 'API request initiated', 'solvex-ai-blogger' ),
					'duration'    => wp_rand( 200, 500 ),
				],
				[
					'status'      => 'error',
					'description' => __( 'Content generation failed', 'solvex-ai-blogger' ),
					'duration'    => wp_rand( 100, 300 ),
				],
				[
					'status'      => 'error',
					'description' => __( 'Post creation aborted', 'solvex-ai-blogger' ),
					'duration'    => 0,
				],
			];

			$sample_logs[] = [
				'id'            => $log_counter,
				'timestamp'     => gmdate( 'Y-m-d H:i:s', strtotime( $timestamp ) - ( $posts_failed - $i ) * 400 ),
				'status'        => 'error',
				'title'         => sprintf( /* translators: %d is the post number. */ __( 'Post #%d Creation - Failed', 'solvex-ai-blogger' ), $posts_created + $i ),
				'message'       => sprintf( /* translators: %d is the post number. */ __( 'Post #%d creation failed due to an error.', 'solvex-ai-blogger' ), $posts_created + $i ),
				'error_details' => $error_reason,
				'steps'         => $failed_steps,
			];
			$log_counter++;
		}

		// Add pending logs for remaining posts.
		if ( $posts_created < $posts_target && $campaign_data['status'] === 'publish' ) {
			$sample_logs[] = [
				'id'        => $posts_created + 1,
				'timestamp' => current_time( 'mysql' ),
				'status'    => 'pending',
				'title'     => sprintf( /* translators: %d is the post number. */ __( 'Post #%d Creation - Scheduled', 'solvex-ai-blogger' ), $posts_created + 1 ),
				'message'   => sprintf( /* translators: %d is the post number. */ __( 'Post #%d is scheduled to be created in the next cron run.', 'solvex-ai-blogger' ), $posts_created + 1 ),
				'steps'     => [
					[
						'status'      => 'processing',
						'description' => __( 'Waiting for scheduled time...', 'solvex-ai-blogger' ),
					],
				],
			];
		}

		// Add completion log if campaign is completed (check both scheduled and target).
		if ( $posts_target > 0 && ( $posts_scheduled >= $posts_target || $posts_created >= $posts_target ) ) {
			$completed_at = $campaign_data['completedAt'] ?? current_time( 'mysql' );

			// Calculate success rate.
			$total_attempted = $posts_created + $posts_failed;
			$success_rate    = $total_attempted > 0 ? round( $posts_created / $total_attempted * 100 ) : 100;

			// Determine completion status and message.
			if ( $posts_failed > 0 ) {
				$completion_status  = $success_rate >= 80 ? 'warning' : 'error';
				$completion_title   = sprintf( /* translators: %d is the success rate. */ __( 'Campaign Completed - %d%% Successful', 'solvex-ai-blogger' ), $success_rate );
				$completion_message = sprintf(
					/* translators: %1$d is the number of successful posts, %2$d is the number of attempts, %3$d is the number of failed posts, %4$d is the target number of posts. */
					__( 'Campaign completed with %1$d successful posts out of %2$d attempts (%3$d failed). Target of %4$d posts reached.', 'solvex-ai-blogger' ),
					$posts_created,
					$total_attempted,
					$posts_failed,
					$posts_target
				);
			} else {
				$completion_status  = 'success';
				$completion_title   = __( 'Campaign Completed Successfully', 'solvex-ai-blogger' );
				$completion_message = sprintf( /* translators: %d is the number of successful posts. */ __( 'Campaign successfully completed with all %d posts created without any failures.', 'solvex-ai-blogger' ), $posts_created );
			}

			$sample_logs[] = [
				'id'        => $log_counter + 100, // High ID to ensure it appears at top.
				'timestamp' => $completed_at,
				'status'    => $completion_status,
				'title'     => $completion_title,
				'message'   => $completion_message,
				'steps'     => [
					[
						'status'      => $posts_created > 0 ? 'success' : 'warning',
						'description' => sprintf( /* translators: %d is the number of successful posts. */ __( '%d posts created successfully', 'solvex-ai-blogger' ), $posts_created ),
					],
					[
						'status'      => $posts_failed > 0 ? 'error' : 'success',
						'description' => sprintf( /* translators: %d is the number of failed posts. */ __( '%d posts failed', 'solvex-ai-blogger' ), $posts_failed ),
					],
					[
						'status'      => 'success',
						'description' => __( 'Campaign marked as completed', 'solvex-ai-blogger' ),
					],
					[
						'status'      => 'success',
						'description' => __( 'Scheduled events cleared', 'solvex-ai-blogger' ),
					],
				],
			];
		}

		// Add error log example if needed.
		if ( $posts_created === 0 && $campaign_data['status'] === 'draft' && ! ( $campaign_data['campaignCompleted'] ?? false ) ) {
			$sample_logs[] = [
				'id'            => 1,
				'timestamp'     => current_time( 'mysql' ),
				'status'        => 'error',
				'title'         => __( 'Campaign Inactive', 'solvex-ai-blogger' ),
				'message'       => __( 'Campaign is currently inactive. Activate the campaign to start creating posts.', 'solvex-ai-blogger' ),
				'error_details' => __( 'Campaign status is set to draft. Change status to published to enable post creation.', 'solvex-ai-blogger' ),
			];
		}

		return $sample_logs;
	}

	/**
	 * AJAX handler: return all campaigns for live polling.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function wpsolvex_autoaiblogger_get_all_campaigns_live(): void {
		try {
			if ( ! check_ajax_referer( 'wpsolvex_autoaiblogger_admin_nonce', 'security', false ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'nonce' ) ] );
				return;
			}

			if ( ! current_user_can( 'edit_posts' ) ) {
				wp_send_json_error( [ 'message' => $this->get_error_msg( 'permission' ) ] );
				return;
			}

			$campaigns = wpsolvex_autoaiblogger_get_all_campaigns();

			wp_send_json_success( [ 'campaigns' => $campaigns ] );
		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->get_error_msg( 'default' ) ] );
		}
	}
}
