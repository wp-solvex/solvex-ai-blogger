<?php
/**
 * Licensing Class for Solvex AI Blogger.
 *
 * This class handles all licensing related operations with security measures.
 * Implements comprehensive input validation, data sanitization, rate limiting,
 * and secure license management.
 *
 * @package solvex-ai-blogger
 * @subpackage Admin
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Admin;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;
use WPSolvex\AutoAIBlogger\Inc\Utils\Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Licensing handler class with security.
 *
 * This class provides license management including activation, deactivation,
 * validation, and status checking with security measures.
 *
 * @package solvex-ai-blogger
 * @subpackage Admin
 * @since 1.0.0
 */
class Licensing {
	use Get_Instance;

	/**
	 * Rate limit for license operations (per hour).
	 */
	private const RATE_LIMIT_LICENSE_OPS = 10;

	/**
	 * Rate limiting time window in seconds (1 hour).
	 */
	private const RATE_LIMIT_WINDOW = 3600;

	/**
	 * Maximum license key length.
	 */
	private const MAX_LICENSE_KEY_LENGTH = 100;

	/**
	 * Error messages.
	 *
	 * @var array
	 */
	public $error_messages = [];

	/**
	 * Class constructor with security setup.
	 *
	 * Initializes licensing functionality with proper WordPress hooks
	 * and security measures. Only loads in admin context.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		// Only initialize in admin context for security.
		if ( ! is_admin() ) {
			return;
		}

		// Initialize licensing after WordPress is fully loaded.
		add_action( 'init', [ $this, 'initialize_licensing' ], 1 );
	}

	/**
	 * Initialize licensing functionality.
	 *
	 * Sets up error messages, licensing client, and AJAX handlers
	 * with proper security validation.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function initialize_licensing(): void {
		// Only proceed if user has appropriate capabilities.
		if ( ! current_user_can( 'manage_options' ) && ! wp_doing_ajax() ) {
			return;
		}

		// Check if licensing client class exists.
		if ( ! class_exists( 'SureCart\Licensing\Client' ) ) {
			$client_path = SOLVEX_AIB_DIR . '/inc/licensing/Client.php';
			if ( ! file_exists( $client_path ) || ! is_readable( $client_path ) ) {
				return;
			}
			require_once $client_path;
		}

		// Initialize error messages.
		$this->set_error_messages();

		// Initialize licensing client.
		add_action( 'init', [ self::class, 'init_licensing' ] );

		// Add admin notices.
		add_action( 'admin_notices', [ $this, 'license_activation_notice' ] );

		// AJAX handlers with security validation (only for admin users).
		add_action( 'wp_ajax_solvex_aib_activate_license', [ $this, 'activate_license' ] );
		add_action( 'wp_ajax_solvex_aib_deactivate_license', [ $this, 'deactivate_license' ] );

		// Add hooks for periodic license validation.
		add_action( 'wp_loaded', [ $this, 'validate_license_periodically' ] );
	}

	/**
	 * Creates and configures SureCart licensing client.
	 *
	 * Initializes the licensing client with proper error handling
	 * and validation of required constants.
	 *
	 * @since 1.0.0
	 * @return \SureCart\Licensing\Client|null Client instance or null on failure.
	 */
	public static function licensing_setup() {
		// Validate required constants.
		if ( ! defined( 'SOLVEX_AIB_PRODUCT_NAME' ) ||
			! defined( 'SOLVEX_AIB_PUBLIC_TOKEN' ) ||
			! defined( 'SOLVEX_AIB_PRODUCT_FILE' ) ) {
			return null;
		}

		try {
			$client = new \SureCart\Licensing\Client(
				SOLVEX_AIB_PRODUCT_NAME,
				SOLVEX_AIB_PUBLIC_TOKEN,
				SOLVEX_AIB_PRODUCT_FILE
			);

			$client->set_textdomain( 'solvex-ai-blogger' );

			return $client;
		} catch ( \Exception $e ) {
			return null;
		}
	}

	/**
	 * Initialize licensing client on WordPress init.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function init_licensing(): void {
		self::licensing_setup();
	}

	/**
	 * Activate license with security validation.
	 *
	 * @hooked wp_ajax_solvex_aib_activate_license
	 * @since 1.0.0
	 * @return void
	 */
	public function activate_license(): void {
		// Security validation — context, capability, nonce, and session checks.
		$security_check = $this->validate_license_security();
		if ( is_wp_error( $security_check ) ) {
			wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
		}

		// Rate limiting check.
		$rate_limit_check = $this->check_license_rate_limit( 'activate' );
		if ( is_wp_error( $rate_limit_check ) ) {
			wp_send_json_error( [ 'message' => $this->error_messages['rate_limit'] ] );
		}

		// Input validation and sanitization.
		$license_key = isset( $_POST['license_key'] ) ? sanitize_text_field( wp_unslash( $_POST['license_key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce is verified already in above validate_license_security().

		// Additional Check if license key format is valid.
		if ( ! $this->validate_license_key_format( $license_key ) ) {
			wp_send_json_error( [ 'message' => $this->error_messages['invalid_license_format'] ] );
		}

		try {
			$client = self::licensing_setup();

			if ( ! $client ) {
				wp_send_json_error( [ 'message' => $this->error_messages['client_error'] ] );
			}

			// Validate license before activation.
			$get_license = $client->license()->retrieve( $license_key );

			if ( is_wp_error( $get_license ) ) {
				wp_send_json_error( [ 'message' => $this->error_messages['license_retrieval_failed'] ] );
			}

			// Validate product ID match.
			if ( ! empty( $get_license->product ) && $get_license->product !== SOLVEX_AIB_PRODUCT_ID ) {
				wp_send_json_error( [ 'message' => $this->error_messages['incorrect_product'] ] );
			}

			// Attempt license activation.
			$response = $client->license()->activate( $license_key );

			if ( is_wp_error( $response ) ) {
				wp_send_json_error( [ 'message' => $this->error_messages['activation_failed'] ] );
			}

			// Securely update license status.
			$this->update_license_status( $license_key, 'licensed' );

			// Save license data to admin settings for frontend access.
			Helper::update_option( 'license_status', 'licensed' );

			// Log successful activation.
			$this->log_license_activity( 'activate', $license_key, get_current_user_id() );

			wp_send_json_success(
				[
					'message' => __( 'License activated successfully.', 'solvex-ai-blogger' ),
					'status'  => 'licensed',
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->error_messages['activation_exception'] ] );
		}
	}

	/**
	 * Deactivate license with security validation.
	 *
	 * @hooked wp_ajax_solvex_aib_deactivate_license
	 * @since 1.0.0
	 * @return void
	 */
	public function deactivate_license(): void {
		// security validation.
		$security_check = $this->validate_license_security();
		if ( is_wp_error( $security_check ) ) {
			wp_send_json_error( [ 'message' => $security_check->get_error_message() ] );
		}

		// Rate limiting check.
		$rate_limit_check = $this->check_license_rate_limit( 'deactivate' );
		if ( is_wp_error( $rate_limit_check ) ) {
			wp_send_json_error( [ 'message' => $this->error_messages['rate_limit'] ] );
		}

		try {
			$client = self::licensing_setup();

			if ( ! $client ) {
				wp_send_json_error( [ 'message' => $this->error_messages['client_error'] ] );
			}

			// Get current license key for logging.
			$current_license = Helper::get_option( 'license', '' );

			// Attempt license deactivation.
			$response = $client->license()->deactivate();

			if ( is_wp_error( $response ) ) {
				wp_send_json_error( [ 'message' => $this->error_messages['deactivation_failed'] ] );
			}

			// Securely update license status.
			$this->update_license_status( '', 'unlicensed' );

			// Clear license data from admin settings.
			Helper::update_option( 'license_status', 'unlicensed' );

			// Clear token data using the shared helper function.
			solvex_aib_update_token_data(
				[
					'total'     => 0,
					'remaining' => 0,
				]
			);

			// Log successful deactivation.
			$this->log_license_activity( 'deactivate', $current_license, get_current_user_id() );

			wp_send_json_success(
				[
					'message' => __( 'License deactivated successfully.', 'solvex-ai-blogger' ),
					'status'  => 'unlicensed',
				]
			);

		} catch ( \Exception $e ) {
			wp_send_json_error( [ 'message' => $this->error_messages['deactivation_exception'] ] );
		}
	}

	/**
	 * Checks if license is active with security validation.
	 *
	 * @since 1.0.0
	 * @return bool
	 */
	public static function is_license_active(): bool {
		try {
			$client = self::licensing_setup();

			if ( ! $client ) {
				return false;
			}

			// Getting license key from settings with validation..
			$license_key = $client->settings()->license_key;

			if ( empty( $license_key ) || ! is_string( $license_key ) ) {
				return false;
			}

			// Validate license key format.
			if ( strlen( $license_key ) > self::MAX_LICENSE_KEY_LENGTH ) {
				return false;
			}

			// Retrieve the license from the server with error handling..
			$get_license = $client->license()->retrieve( $license_key );

			if ( is_wp_error( $get_license ) ) {
				return false;
			}

			// Validate product ID match.
			if ( ! empty( $get_license->product ) && $get_license->product !== SOLVEX_AIB_PRODUCT_ID ) {
				return false;
			}

			// Check activation status.
			$activation = $client->settings()->get_activation();
			$is_active  = ! empty( $activation->id );

			// Update cached status for performance.
			if ( $is_active ) {
				self::update_license_cache( $license_key, 'licensed' );
			}

			return $is_active;

		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Display admin notice to activate license with security.
	 *
	 * @since 1.0.0
	 */
	public function license_activation_notice(): void {
		// Only show notice to appropriate users.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$screen    = get_current_screen();
		$screen_id = ! empty( $screen->id ) ? sanitize_key( $screen->id ) : '';

		// Only show on plugins page.
		if ( $screen_id !== 'plugins' ) {
			return;
		}

		// Additional capability checks.
		if ( ! current_user_can( 'activate_plugins' ) || ! current_user_can( 'install_plugins' ) ) {
			return;
		}

		// Get license status with caching.
		$license_status = $this->get_cached_license_status();

		if ( $license_status === 'licensed' ) {
			return;
		}

		// Validate and escape CTA URL.
		$cta_url = esc_url( admin_url( 'edit.php?page=' . SOLVEX_AIB_SLUG ) );

		if ( empty( $cta_url ) ) {
			return;
		}

		// Secure notice message with proper escaping.
		$notice_message = sprintf(
			/* translators: %1$s: opening link tag, %2$s: closing link tag, %3$s: product name, %4$s: opening emphasis tag, %5$s: closing emphasis tag */
			__( 'Please %1$sactivate%2$s your copy to claim tokens %4$s%3$s%5$s to generate blog posts.', 'solvex-ai-blogger' ),
			'<a href="' . $cta_url . '">',
			'</a>',
			esc_html( SOLVEX_AIB_PRODUCT_NAME ),
			'<em>',
			'</em>'
		);

		// Only show notice if Autoaib_Notices class exists.
		if ( class_exists( 'Autoaib_Notices' ) ) {
			\Autoaib_Notices::add_notice(
				[
					'id'                         => 'solvex-ai-blogger-activation-notice',
					'type'                       => 'error',
					'message'                    => sprintf(
						'<div class="notice-content" style="margin: 0;">%s</div>',
						$notice_message
					),
					'repeat-notice-after'        => false,
					'priority'                   => 10,
					'display-with-other-notices' => true,
					'is_dismissible'             => false,
				]
			);
		}
	}

	/**
	 * Validates license periodically for security.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function validate_license_periodically(): void {
		// Only run validation once per day.
		$last_validation = get_transient( 'solvex_aib_license_validation' );
		if ( $last_validation !== false ) {
			return;
		}

		// Set validation timestamp.
		set_transient( 'solvex_aib_license_validation', time(), DAY_IN_SECONDS );

		// Check license status in background.
		if ( function_exists( 'wp_schedule_single_event' ) ) {
			wp_schedule_single_event( time() + 300, 'solvex_aib_validate_license_background' );
		}
	}

	/**
	 * Set comprehensive error messages with security context.
	 *
	 * All messages are translatable and follow WordPress standards.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function set_error_messages(): void {
		$this->error_messages = [
			'nonce'                    => esc_html__( 'Security verification failed. Please refresh the page and try again.', 'solvex-ai-blogger' ),
			'permission'               => esc_html__( 'Sorry, you are not allowed to manage licenses.', 'solvex-ai-blogger' ),
			'invalid_license'          => esc_html__( 'Please enter a valid license key.', 'solvex-ai-blogger' ),
			'invalid_license_format'   => esc_html__( 'The license key format is invalid. Please check and try again.', 'solvex-ai-blogger' ),
			'license_too_long'         => esc_html__( 'License key is too long. Please check and try again.', 'solvex-ai-blogger' ),
			'rate_limit'               => esc_html__( 'Too many license requests. Please wait a moment and try again.', 'solvex-ai-blogger' ),
			'client_error'             => esc_html__( 'License service is temporarily unavailable. Please try again later.', 'solvex-ai-blogger' ),
			'license_retrieval_failed' => esc_html__( 'Unable to verify license. Please check your internet connection and try again.', 'solvex-ai-blogger' ),
			'incorrect_product'        => esc_html__( 'This license key is not valid for this plugin.', 'solvex-ai-blogger' ),
			'activation_failed'        => esc_html__( 'License activation failed. Please verify your license key and try again.', 'solvex-ai-blogger' ),
			'deactivation_failed'      => esc_html__( 'License deactivation failed. Please try again or contact support.', 'solvex-ai-blogger' ),
			'activation_exception'     => esc_html__( 'An unexpected error occurred during license activation. Please try again.', 'solvex-ai-blogger' ),
			'deactivation_exception'   => esc_html__( 'An unexpected error occurred during license deactivation. Please try again.', 'solvex-ai-blogger' ),
		];
	}

	/**
	 * Validates security for license operations.
	 *
	 * Performs comprehensive security checks including nonce validation,
	 * capability checks, and context validation.
	 *
	 * @since 0.0.2
	 * @return bool|\WP_Error True if valid, WP_Error on failure.
	 */
	private function validate_license_security() {
		// Check if we're in the correct context.
		if ( ! wp_doing_ajax() || ! is_admin() ) {
			return new \WP_Error(
				'invalid_context',
				esc_html__( 'License operations are only allowed in admin AJAX context.', 'solvex-ai-blogger' )
			);
		}

		// Verify user capabilities.
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error( 'insufficient_permissions', $this->error_messages['permission'] );
		}

		// CSRF protection - check nonce.
		$nonce_field = 'solvex_aib_licensing_nonce';
		$nonce_value = sanitize_text_field( wp_unslash( $_POST[ $nonce_field ] ?? '' ) );

		if ( empty( $nonce_value ) || ! wp_verify_nonce( $nonce_value, $nonce_field ) ) {
			return new \WP_Error( 'invalid_nonce', $this->error_messages['nonce'] );
		}

		// Check if user session is valid.
		if ( ! is_user_logged_in() ) {
			return new \WP_Error(
				'not_logged_in',
				esc_html__( 'You must be logged in to perform this action.', 'solvex-ai-blogger' )
			);
		}

		return true;
	}

	/**
	 * Check rate limiting for license operations.
	 *
	 * @since 0.0.2
	 * @param string $operation The operation type (activate/deactivate).
	 * @return bool|\WP_Error True if allowed, WP_Error if rate limited.
	 */
	private function check_license_rate_limit( string $operation ): \WP_Error|bool {
		$user_id   = get_current_user_id();
		$cache_key = 'solvex_aib_license_rate_limit_' . $user_id . '_' . $operation;

		// Get cached data.
		$cached_data = get_transient( $cache_key );

		if ( $cached_data === false ) {
			// First request - set counter.
			set_transient(
				$cache_key,
				[
					'count'      => 1,
					'start_time' => time(),
				],
				self::RATE_LIMIT_WINDOW
			);
			return true;
		}

		// Check if limit exceeded.
		if ( $cached_data['count'] >= self::RATE_LIMIT_LICENSE_OPS ) {
			return new \WP_Error( 'rate_limit_exceeded', $this->error_messages['rate_limit'] );
		}

		// Increment counter.
		$cached_data['count']++;
		set_transient( $cache_key, $cached_data, self::RATE_LIMIT_WINDOW );

		return true;
	}

	/**
	 * Sanitizes and validates license key input.
	 *
	 * Performs comprehensive sanitization and validation of license key input
	 * following WordPress security standards.
	 *
	 * @since 0.0.2
	 * @param mixed $license_key Raw license key input from user.
	 * @return string|\WP_Error Sanitized license key or WP_Error on failure.
	 */
	private function sanitize_license_key( $license_key ) {
		// Ensure we have a string.
		if ( ! is_string( $license_key ) ) {
			return new \WP_Error( 'invalid_type', $this->error_messages['invalid_license'] );
		}

		// Remove slashes and sanitize.
		$license_key = sanitize_text_field( wp_unslash( $license_key ) );

		// Trim whitespace.
		$license_key = trim( $license_key );

		// Check if empty after sanitization.
		if ( empty( $license_key ) ) {
			return new \WP_Error( 'empty_license', $this->error_messages['invalid_license'] );
		}

		// Validate length limits.
		if ( strlen( $license_key ) > self::MAX_LICENSE_KEY_LENGTH ) {
			return new \WP_Error( 'license_too_long', $this->error_messages['license_too_long'] );
		}

		// Validate minimum length.
		if ( strlen( $license_key ) < 10 ) {
			return new \WP_Error( 'license_too_short', $this->error_messages['invalid_license_format'] );
		}

		// Only allow alphanumeric, hyphens, and underscores.
		if ( ! preg_match( '/^[a-zA-Z0-9\-_]+$/', $license_key ) ) {
			return new \WP_Error( 'invalid_characters', $this->error_messages['invalid_license_format'] );
		}

		return $license_key;
	}

	/**
	 * Validates license key format against expected patterns.
	 *
	 * Additional format validation for license keys to ensure they match
	 * expected patterns for the licensing system.
	 *
	 * @since 0.0.2
	 * @param string $license_key License key to validate.
	 * @return bool True if format is valid, false otherwise.
	 */
	private function validate_license_key_format( $license_key ) {
		// Ensure we have a string.
		if ( ! is_string( $license_key ) || empty( $license_key ) ) {
			return false;
		}

		// Basic length validation.
		$key_length = strlen( $license_key );
		if ( $key_length < 10 || $key_length > self::MAX_LICENSE_KEY_LENGTH ) {
			return false;
		}

		// Character validation - only alphanumeric, hyphens, and underscores.
		if ( ! preg_match( '/^[a-zA-Z0-9\-_]+$/', $license_key ) ) {
			return false;
		}

		// Prevent obviously invalid patterns.
		if ( preg_match( '/^[\-_]+$/', $license_key ) || // Only separators.
			preg_match( '/[\-_]{3,}/', $license_key ) || // Too many consecutive separators.
			preg_match( '/^[\-_]|[\-_]$/', $license_key ) ) { // Starts/ends with separator.
			return false;
		}

		return true;
	}

	/**
	 * Securely updates license status in database.
	 *
	 * @since 0.0.2
	 * @param string $license_key License key to store.
	 * @param string $status License status.
	 * @return void
	 */
	private function update_license_status( string $license_key, string $status ): void {
		// Sanitize inputs.
		$license_key = sanitize_text_field( $license_key );
		$status      = sanitize_key( $status );

		// Validate status.
		$allowed_statuses = [ 'licensed', 'unlicensed', 'expired', 'invalid' ];
		if ( ! in_array( $status, $allowed_statuses, true ) ) {
			$status = 'unlicensed';
		}

		// Update options securely.
		Helper::update_option( 'license', $license_key );
		Helper::update_option( 'license_status', $status );

		// Also update admin settings for frontend access.
		Helper::update_option( 'licenseStatus', $status );      // Update cache.
		self::update_license_cache( $license_key, $status );
	}

	/**
	 * Logs license activity for security auditing.
	 *
	 * @since 0.0.2
	 * @param string $action The action performed.
	 * @param string $license_key License key (masked).
	 * @param int    $user_id User ID who performed action.
	 * @return void
	 */
	private function log_license_activity( string $action, string $license_key, int $user_id ): void {
		// Store basic activity information in transient for security tracking.
		$activity_key  = 'solvex_aib_license_activity_' . $user_id;
		$activity_data = [
			'action'    => sanitize_key( $action ),
			'user_id'   => absint( $user_id ),
			'timestamp' => current_time( 'mysql' ),
			'ip'        => $this->get_client_ip(),
		];

		set_transient( $activity_key, $activity_data, HOUR_IN_SECONDS );
	}

	/**
	 * Masks license key for logging.
	 *
	 * @param string $license_key License key to mask.
	 * @return string Masked license key.
	 * @since 0.0.2
	 */
	private function mask_license_key( string $license_key ): string {
		if ( strlen( $license_key ) <= 8 ) {
			return '****';
		}

		$start  = substr( $license_key, 0, 4 );
		$end    = substr( $license_key, -4 );
		$middle = str_repeat( '*', strlen( $license_key ) - 8 );

		return $start . $middle . $end;
	}

	/**
	 * Gets client IP address securely.
	 *
	 * @since 0.0.2
	 * @return string Client IP address.
	 */
	private function get_client_ip(): string {
		$ip_keys = [ 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR' ];

		foreach ( $ip_keys as $key ) {
			if ( ! empty( $_SERVER[ $key ] ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) );
				// Take first IP if comma-separated.
				$ip = explode( ',', $ip )[0];
				$ip = trim( $ip );

				if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
					return $ip;
				}
			}
		}

		return 'unknown';
	}

	/**
	 * Updates license cache for performance.
	 *
	 * @since 0.0.2
	 * @param string $license_key License key.
	 * @param string $status License status.
	 * @return void
	 */
	private static function update_license_cache( string $license_key, string $status ): void {
		$cache_key  = 'solvex_aib_license_cache';
		$cache_data = [
			'license_key' => sanitize_text_field( $license_key ),
			'status'      => sanitize_key( $status ),
			'updated'     => time(),
		];

		set_transient( $cache_key, $cache_data, HOUR_IN_SECONDS );
	}

	/**
	 * Gets cached license status.
	 *
	 * @since 0.0.2
	 * @return string License status.
	 */
	private function get_cached_license_status(): string {
		$license_status = Helper::get_option( 'license_status', '' );

		// If status is not set, check license and update.
		if ( empty( $license_status ) ) {
			$license_status = self::is_license_active() ? 'licensed' : 'unlicensed';
			Helper::update_option( 'license_status', $license_status );
		}

		return sanitize_key( $license_status );
	}

	/**
	 * Fetch and save token data from external API.
	 *
	 * Retrieves token information from the licensing server using wp_remote_get
	 * with proper error handling and data validation.
	 *
	 * @param string $license_key The sanitized license key.
	 * @since 0.0.2
	 * @return bool True on success, false on failure.
	 */
	private function fetch_and_save_token_data( $license_key ) {
		// Validate license key parameter.
		if ( empty( $license_key ) || ! is_string( $license_key ) ) {
			return false;
		}

		// Sanitize license key for URL.
		$sanitized_key = sanitize_text_field( $license_key );

		// Build API URL with proper encoding.
		$token_url = esc_url_raw(
			add_query_arg(
				'license',
				urlencode( $sanitized_key ),
				SOLVEX_AIB_TOKEN_USAGE_API
			)
		);

		// Configure request arguments following WordPress standards.
		$request_args = [
			'timeout'     => 15, // Reduced timeout for better UX.
			'redirection' => 5,
			'httpversion' => '1.1',
			'user-agent'  => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
			'headers'     => [
				'Accept'       => 'application/json',
				'Content-Type' => 'application/json',
			],
			'cookies'     => [],
			'body'        => null,
			'compress'    => false,
			'decompress'  => true,
			'sslverify'   => true, // Always verify SSL for security.
		];

		// Make HTTP request using WordPress HTTP API.
		$response = wp_remote_get( $token_url, $request_args );

		// Check for HTTP errors.
		if ( is_wp_error( $response ) ) {
			return false;
		}

		// Validate HTTP response code.
		$response_code = wp_remote_retrieve_response_code( $response );
		if ( $response_code !== 200 ) {
			return false;
		}

		// Retrieve and validate response body.
		$body = wp_remote_retrieve_body( $response );
		if ( empty( $body ) ) {
			return false;
		}

		// Parse JSON response with error handling.
		$data = json_decode( $body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return false;
		}

		// Validate response structure.
		if ( ! isset( $data['success'] ) || ! $data['success'] || ! isset( $data['data'] ) || ! is_array( $data['data'] ) ) {
			return false;
		}

		// Update token data using the shared helper function.
		return solvex_aib_update_token_data( $data['data'] );
	}
}
