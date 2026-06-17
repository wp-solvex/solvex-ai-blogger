<?php
/**
 * Cron Handler class for Solvex AI Blogger.
 *
 * This class handles cron-related functionality including
 * post creation hooks and scheduling operations.
 * It's loaded on all requests to ensure cron hooks work properly.
 *
 * @package solvex-ai-blogger
 * @subpackage Inc\Cron
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;
use WPSolvex\AutoAIBlogger\Inc\Utils\Metadata;

defined( 'ABSPATH' ) || exit;

/**
 * Cron Handler class for Solvex AI Blogger.
 *
 * @package solvex-ai-blogger
 * @subpackage Inc\Cron
 * @since 1.0.0
 */
class Cron_Handler {
	use Get_Instance;

	/**
	 * Initialize cron hooks.
	 */
	protected function __construct() {
		$this->init_hooks();
	}

	/**
	 * Create a single post from campaign (cron callback).
	 *
	 * @param int $campaign_id The ID of the campaign.
	 * @since 0.0.2
	 */
	public function create_single_post_from_campaign( $campaign_id ): void {
		try {
			$campaign_id = absint( $campaign_id );
			if ( $campaign_id <= 0 ) {
				return;
			}

			$campaign = get_post( $campaign_id );
			if ( ! $campaign || $campaign->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
				return;
			}

			$wp_status = $campaign->post_status;
			$is_active = ( $wp_status === 'publish' );

			if ( ! $is_active ) {
				return;
			}

			// Check if campaign is paused.
			$is_paused = Metadata::get_campaign_meta( $campaign_id, 'isPaused' );
			if ( $is_paused ) {
				return;
			}

			// Pre-check: Auto-pause if local token balance is below campaign threshold.
			$local_token_remaining = absint( \WPSolvex\AutoAIBlogger\Inc\Utils\Helper::get_option( 'tokenRemaining', 0 ) );
			if ( $local_token_remaining < 3000 ) {
				Metadata::update_campaign_meta( $campaign_id, 'isPaused', true );
				Metadata::update_campaign_meta( $campaign_id, 'pauseReason', 'token_exhaustion' );
				Metadata::update_campaign_meta( $campaign_id, 'pausedAt', current_time( 'mysql' ) );

				$posts_created_precheck = intval( Metadata::get_campaign_meta( $campaign_id, 'postsCreated' ) );
				wpsolvex_autoaiblogger_log_campaign_error(
					$campaign_id,
					'quota_error',
					sprintf(
						'Campaign auto-paused: Token balance (%d) below minimum threshold (3000). Please upgrade your plan or wait for your monthly refresh.',
						$local_token_remaining
					),
					[
						'token_remaining' => $local_token_remaining,
						'posts_created'   => $posts_created_precheck,
						'auto_paused'     => true,
					]
				);

				$cron_hook = 'wpsolvex_autoaiblogger_create_single_post';
				wp_clear_scheduled_hook( $cron_hook, [ $campaign_id ] );

				return;
			}

			// Get current campaign statistics.
			$posts_created   = intval( Metadata::get_campaign_meta( $campaign_id, 'postsCreated' ) );
			$posts_scheduled = intval( Metadata::get_campaign_meta( $campaign_id, 'postsScheduled' ) );
			$posts_failed    = intval( Metadata::get_campaign_meta( $campaign_id, 'postsFailed' ) );
			$max_failures    = intval( Metadata::get_campaign_meta( $campaign_id, 'maxFailures' ) ?? 20 );

			// Trigger "Campaign Started" notification only once on the first post attempt.
			$started_notification_sent = Metadata::get_campaign_meta( $campaign_id, 'startedNotificationSent' );
			if ( ! $started_notification_sent && $posts_created === 0 && $posts_scheduled === 0 ) {
				do_action(
					'wpsolvex_autoaiblogger_campaign_started',
					$campaign_id,
					[
						'postsTarget'    => Metadata::get_campaign_meta( $campaign_id, 'postsTarget' ),
						'repeatInterval' => Metadata::get_campaign_meta( $campaign_id, 'repeatInterval' ),
						'repeatUnit'     => Metadata::get_campaign_meta( $campaign_id, 'repeatUnit' ),
						'keywords'       => Metadata::get_campaign_meta( $campaign_id, 'keywords' ),
					]
				);

				// Mark that we've sent the started notification.
				Metadata::update_campaign_meta( $campaign_id, 'startedNotificationSent', true );
			}

			// Calculate which post number we're trying to create.
			$target_post_number = $posts_created + 1;

			// Get or initialize retry tracking for current post.
			$tracking_meta   = Metadata::get_campaign_meta( $campaign_id, 'retryTracking' );
			$retry_tracking  = ! empty( $tracking_meta ) ? $tracking_meta : [];
			$post_key        = 'post_' . $target_post_number;
			$current_attempt = isset( $retry_tracking[ $post_key ] ) ? intval( $retry_tracking[ $post_key ] ) + 1 : 1;

			// Update scheduled count and retry tracking.
			Metadata::update_campaign_meta( $campaign_id, 'postsScheduled', $posts_scheduled + 1 );
			Metadata::update_campaign_meta( $campaign_id, 'lastRun', current_time( 'mysql' ) );

			$retry_tracking[ $post_key ] = $current_attempt;
			Metadata::update_campaign_meta( $campaign_id, 'retryTracking', $retry_tracking );

			$result = $this->generate_post_from_campaign( $campaign_id, $target_post_number, $current_attempt );

			if ( $result['success'] ) {
				// Clear retry tracking for this post on success.
				unset( $retry_tracking[ $post_key ] );
				Metadata::update_campaign_meta( $campaign_id, 'retryTracking', $retry_tracking );

				// Log success with post and attempt information.
				wpsolvex_autoaiblogger_log_campaign_success(
					$campaign_id,
					$result['post_id'],
					[
						'post_title'     => $result['post_title'],
						'post_number'    => $target_post_number,
						'attempt_number' => $current_attempt,
						'message'        => sprintf(
							'Post #%d created successfully on attempt #%d',
							$target_post_number,
							$current_attempt
						),
					]
				);

				// Trigger notification: Post Created Successfully.
				do_action(
					'wpsolvex_autoaiblogger_post_created_successfully',
					$campaign_id,
					$result['post_id'],
					[
						'post_number'   => $target_post_number,
						'posts_created' => $posts_created + 1,
						'posts_target'  => Metadata::get_campaign_meta( $campaign_id, 'postsTarget' ),
					]
				);

				// Schedule next post with normal frequency after success.
				$this->schedule_next_post( $campaign_id, false );
			} else {
				// Log detailed error information with post and attempt numbers.
				$error_type = $result['error_type'] ?? $this->determine_error_type( $result['message'] ?? '' );

				// Smart Pause: Auto-pause campaign on token exhaustion or auth errors.
				if ( $error_type === 'quota_error' || $error_type === 'auth_error' ) {
					Metadata::update_campaign_meta( $campaign_id, 'isPaused', true );
					Metadata::update_campaign_meta( $campaign_id, 'pauseReason', 'token_exhaustion' );
					Metadata::update_campaign_meta( $campaign_id, 'pausedAt', current_time( 'mysql' ) );

					wpsolvex_autoaiblogger_log_campaign_error(
						$campaign_id,
						$error_type,
						sprintf(
							'Campaign auto-paused: Insufficient tokens. Post #%d creation failed. Please upgrade your plan or wait for your monthly refresh.',
							$target_post_number
						),
						[
							'post_number'   => $target_post_number,
							'posts_created' => $posts_created,
							'auto_paused'   => true,
						]
					);

					// Clear any scheduled cron for this campaign.
					$cron_hook = 'wpsolvex_autoaiblogger_create_single_post';
					wp_clear_scheduled_hook( $cron_hook, [ $campaign_id ] );

					return;
				}

				$context = [
					'post_number'     => $target_post_number,
					'attempt_number'  => $current_attempt,
					'max_retries'     => $max_failures,
					'error_type'      => $error_type,
					'posts_created'   => $posts_created,
					'posts_scheduled' => $posts_scheduled + 1,
					'posts_failed'    => $posts_failed,
				];

				$error_message = sprintf(
					'Post #%d creation failed on attempt #%d/%d: %s',
					$target_post_number,
					$current_attempt,
					$max_failures,
					$result['message'] ?? 'Unknown error'
				);

				wpsolvex_autoaiblogger_log_campaign_error(
					$campaign_id,
					$error_type,
					$error_message,
					$context
				);

				// Check if we've exhausted all retries for this post.
				if ( $current_attempt >= $max_failures ) {
					// All retries exhausted - mark this post as failed.
					$new_posts_failed = $posts_failed + 1;
					Metadata::update_campaign_meta( $campaign_id, 'postsFailed', $new_posts_failed );

					// Clear retry tracking for this post.
					unset( $retry_tracking[ $post_key ] );
					Metadata::update_campaign_meta( $campaign_id, 'retryTracking', $retry_tracking );

					// Log that we're giving up on this post.
					wpsolvex_autoaiblogger_log_campaign_error(
						$campaign_id,
						'post_abandoned',
						sprintf(
							'Post #%d abandoned after %d failed attempts. Moving to next post.',
							$target_post_number,
							$max_failures
						),
						[
							'post_number'    => $target_post_number,
							'total_attempts' => $max_failures,
							'posts_failed'   => $new_posts_failed,
						]
					);

					// Schedule next post (moving on to the next post number).
					$this->schedule_next_post( $campaign_id, false );
				} else {
					// Still have retries left - schedule retry with short interval.
					$this->schedule_next_post( $campaign_id, true );
				}
			}
		} catch ( \Exception $e ) {
			return;
		}
	}

	/**
	 * Generate a post from campaign data.
	 *
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $target_post_number The post number being attempted.
	 * @param int $current_attempt The attempt number for this post.
	 * @return array An array containing the success status and message.
	 * @since 0.0.2
	 */
	public function generate_post_from_campaign( $campaign_id, $target_post_number = 0, $current_attempt = 0 ): array {
		try {
			$keywords  = Metadata::get_campaign_meta( $campaign_id, 'keywords' );
			$max_words = Metadata::get_campaign_meta( $campaign_id, 'maxWords' ) ?? 1000;

			// Apply filter to allow Pro plugin to modify max_words.
			// Free users are limited to 1000 words, Pro users can customize.
			$max_words = apply_filters( 'wpsolvex_autoaiblogger_max_content_words', $max_words, $campaign_id );

			$post_type          = Metadata::get_campaign_meta( $campaign_id, 'postType' );
			$post_status        = Metadata::get_campaign_meta( $campaign_id, 'postStatus' );
			$author_id          = Metadata::get_campaign_meta( $campaign_id, 'author' );
			$category           = Metadata::get_campaign_meta( $campaign_id, 'category' );
			$tag                = Metadata::get_campaign_meta( $campaign_id, 'tag' );
			$summary_as_excerpt = Metadata::get_campaign_meta( $campaign_id, 'summaryAsExcerpt' );

			if ( empty( $keywords ) ) {
				return [
					'success'    => false,
					'message'    => __( 'No keywords found for campaign', 'solvex-ai-blogger' ),
					'error_type' => 'validation_error',
				];
			}

			$api_response = $this->call_post_creation_api( $campaign_id, $keywords, $max_words );

			if ( ! $api_response['success'] ) {
				return [
					'success'    => false,
					'message'    => 'API call failed: ' . $api_response['message'],
					'error_type' => 'api_error',
				];
			}

			$api_data = $api_response['data'];

			// Update token data if present in the API response.
			if ( isset( $api_data['token_data'] ) && is_array( $api_data['token_data'] ) ) {
				wpsolvex_autoaiblogger_update_token_data( $api_data['token_data'] );
			}

			// Process images if they exist in the API response.
			$featured_image_id = null;
			// Don't sanitize - content contains Gutenberg blocks with HTML comments.
			// wp_kses_post() strips these comments. Content comes from our controlled API.
			$post_content = $api_data['post_content'] ?? '';

			if ( ! empty( $api_data['images'] ) && is_array( $api_data['images'] ) ) {
				// Use the same image processing method from Ajax class.
				$processed_result = $this->process_images_and_replace_placeholders( $post_content, $api_data['images'] );
				if ( ! is_wp_error( $processed_result ) && is_array( $processed_result ) ) {
					$post_content      = $processed_result['content'];
					$featured_image_id = $processed_result['featured_image_id'] ?? null;
				}
			}

			// Replace internal link placeholders with actual WordPress URLs.
			$previous_posts = wpsolvex_autoaiblogger_get_previous_campaign_posts( $campaign_id, 5 );
			$post_content   = wpsolvex_autoaiblogger_replace_internal_link_placeholders( $post_content, $previous_posts );

			$post_data = [
				'post_title'   => sanitize_text_field( $api_data['post_title'] ?? 'Generated Post' ),
				'post_content' => $post_content,
				'post_status'  => $post_status ? $post_status : 'draft',
				'post_type'    => $post_type ? $post_type : 'post',
				'post_author'  => $author_id ? $author_id : get_current_user_id(),
			];

			// Set slug from SEO keyphrase for Yoast "Keyphrase in slug" check.
			if ( ! empty( $api_data['seo_keyphrase'] ) ) {
				$post_data['post_name'] = sanitize_title( $api_data['seo_keyphrase'] );
			}

			if ( $summary_as_excerpt && ! empty( $api_data['summary'] ) ) {
				// Limit excerpt to 160 characters for SEO best practices.
				$excerpt = sanitize_text_field( $api_data['summary'] );
				if ( mb_strlen( $excerpt ) > 160 ) {
					$excerpt = mb_substr( $excerpt, 0, 157 ) . '...';
				}
				$post_data['post_excerpt'] = $excerpt;
			}

			$post_id = wp_insert_post( $post_data );            if ( is_wp_error( $post_id ) || ! $post_id ) {
				$wp_error_message = is_wp_error( $post_id ) ? $post_id->get_error_message() : 'Unknown database error';
				return [
					'success'    => false,
					'message'    => 'Failed to create WordPress post: ' . $wp_error_message,
					'error_type' => 'database_error',
				];
			}

			if ( ! empty( $category ) ) {
				wp_set_post_categories( $post_id, [ $category ] );
			}
			if ( ! empty( $tag ) ) {
				wp_set_post_tags( $post_id, $tag );
			}

			// Set featured image if available.
			if ( $featured_image_id && is_numeric( $featured_image_id ) ) {
				set_post_thumbnail( $post_id, $featured_image_id );
			}

			// Add campaign reference meta to the post.
			add_post_meta( $post_id, 'wpsolvex_autoaiblogger_reference', 1 );
			add_post_meta( $post_id, 'wpsolvex_autoaiblogger_campaign_id', $campaign_id );

			// Set SEO meta fields.
			$seo_keyphrase        = sanitize_text_field( $api_data['seo_keyphrase'] ?? '' );
			$seo_title            = sanitize_text_field( $api_data['seo_title'] ?? '' );
			$seo_meta_description = sanitize_text_field( $api_data['seo_meta_description'] ?? '' );

			if ( defined( 'WPSEO_VERSION' ) ) {
				// Yoast SEO is active — set focus keyphrase, SEO title, and meta description.
				if ( ! empty( $seo_keyphrase ) ) {
					update_post_meta( $post_id, '_yoast_wpseo_focuskw', $seo_keyphrase );
				}
				if ( ! empty( $seo_title ) ) {
					update_post_meta( $post_id, '_yoast_wpseo_title', $seo_title );
				}
				if ( ! empty( $seo_meta_description ) ) {
					update_post_meta( $post_id, '_yoast_wpseo_metadesc', $seo_meta_description );
				}
			} elseif ( ! empty( $seo_meta_description ) && empty( $post_data['post_excerpt'] ) ) {
				// No Yoast — use meta description as excerpt for basic SEO.
				wp_update_post( [
					'ID'           => $post_id,
					'post_excerpt' => $seo_meta_description,
				] );
			}

			// Update featured image alt text to include keyphrase for Yoast image alt check.
			if ( $featured_image_id && is_numeric( $featured_image_id ) && ! empty( $seo_keyphrase ) ) {
				$existing_alt = get_post_meta( $featured_image_id, '_wp_attachment_image_alt', true );
				if ( empty( $existing_alt ) || stripos( $existing_alt, $seo_keyphrase ) === false ) {
					$new_alt = ! empty( $existing_alt )
						? $seo_keyphrase . ' - ' . $existing_alt
						: $seo_keyphrase;
					update_post_meta( $featured_image_id, '_wp_attachment_image_alt', sanitize_text_field( $new_alt ) );
				}
			}

			$posts_created     = Metadata::get_campaign_meta( $campaign_id, 'postsCreated' );
			$new_posts_created = intval( $posts_created ) + 1;
			Metadata::update_campaign_meta( $campaign_id, 'postsCreated', $new_posts_created );
			Metadata::update_campaign_meta( $campaign_id, 'lastPostID', $post_id );

			// Success logging is handled in the main method to avoid duplicates.

			// Check if campaign has reached its target and mark as completed.
			$posts_target = Metadata::get_campaign_meta( $campaign_id, 'postsTarget' );
			if ( $posts_target > 0 && $new_posts_created >= intval( $posts_target ) ) {
				$this->mark_campaign_completed( $campaign_id, 'target_reached' );

				// Trigger notification: Campaign Completed.
				do_action(
					'wpsolvex_autoaiblogger_campaign_completed',
					$campaign_id,
					'target_reached',
					[
						'posts_created' => $new_posts_created,
						'posts_target'  => $posts_target,
					]
				);
			}

			return [
				'success'        => true,
				'message'        => sprintf(
					/* translators: 1: Post number, 2: Post ID. */
					__( 'Post #%1$d created successfully with ID: %2$s', 'solvex-ai-blogger' ),
					$target_post_number,
					$post_id
				),
				'post_id'        => $post_id,
				'post_title'     => $post_data['post_title'] ?? '',
				'post_number'    => $target_post_number,
				'attempt_number' => $current_attempt,
			];

		} catch ( \Exception $e ) {
			return [
				'success'    => false,
				'message'    => 'Exception: ' . $e->getMessage(),
				'error_type' => 'unknown_error',
			];
		}
	}

	/**
	 * Register cron actions.
	 */
	private function init_hooks(): void {
		add_action( 'wpsolvex_autoaiblogger_create_single_post', [ $this, 'create_single_post_from_campaign' ] );
	}

	/**
	 * Call the post creation API with retry logic.
	 *
	 * @param int    $campaign_id The ID of the campaign.
	 * @param string $keywords The keywords for the post.
	 * @param int    $max_words The maximum number of words for the post.
	 * @return array An array containing the API response data.
	 * @since 0.0.2
	 */
	private function call_post_creation_api( $campaign_id, $keywords, $max_words ): array {
		try {
			$max_words = $max_words ? $max_words : 1000;

			$site_persona_details = wpsolvex_autoaiblogger_get_site_persona_details( $campaign_id );
			$settings             = \WPSolvex\AutoAIBlogger\Inc\Utils\Settings::get_ai_blogger_settings();
			$license              = \WPSolvex\AutoAIBlogger\Inc\Utils\Helper::get_option( 'license', '' );

			if ( empty( $license ) ) {
				return [
					'success' => false,
					'message' => __( 'License token is required.', 'solvex-ai-blogger' ),
				];
			}

			// Get number of images from campaign metadata (content images only, 1-4).
			$image_count = Metadata::get_campaign_meta( $campaign_id, 'numberOfImages' ) ?? 1;
			$image_count = apply_filters( 'wpsolvex_autoaiblogger_campaign_image_count', $image_count, $campaign_id );
			$image_count = max( 1, min( 4, absint( $image_count ) ) );

			// Tone and demographic from campaign meta, fallback to global settings.
			$content_tone       = Metadata::get_campaign_meta( $campaign_id, 'contentTone' );
			$target_demographic = Metadata::get_campaign_meta( $campaign_id, 'targetDemographic' );
			if ( empty( $content_tone ) ) {
				$content_tone = $settings['contentTone'] ?? 'Professional';
			}
			if ( empty( $target_demographic ) ) {
				$target_demographic = $settings['targetDemographic'] ?? 'General Public';
			}

			// Collect existing post titles from this campaign for deduplication.
			$existing_titles = [];
			$existing_posts  = get_posts(
				[
					'post_type'              => 'post',
					'posts_per_page'         => -1,
					'fields'                 => 'ids',
					'post_status'            => [ 'publish', 'draft', 'pending', 'future' ],
					'meta_key'               => 'wpsolvex_autoaiblogger_campaign_id', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
					'meta_value'             => $campaign_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				]
			);
			if ( ! empty( $existing_posts ) ) {
				foreach ( $existing_posts as $existing_post_id ) {
					$existing_title = get_the_title( $existing_post_id );
					if ( ! empty( $existing_title ) ) {
						$existing_titles[] = $existing_title;
					}
				}
			}

			// Build the standard-format payload for the /generate-post endpoint.
			// Note: Phase 2 content formats (listicle, comparison, series, etc.) are
			// intentionally not exposed in this release — every post uses 'standard'.
			$body_args = [
				'license_key'       => $license,
				'site_url'          => home_url(),
				'generation_params' => [
					'format'            => 'standard',
					'keywords'          => $keywords,
					'tone'              => $content_tone,
					'demographic'       => $target_demographic,
					'max_words'         => $max_words,
					'images_per_post'   => $image_count,
					'temperature'       => floatval( $settings['temperature'] ?? 1 ),
					'harassment'        => absint( $settings['harassment'] ?? 2 ),
					'hate'              => absint( $settings['hate'] ?? 2 ),
					'sexually_explicit' => absint( $settings['sexuallyExplicit'] ?? 2 ),
					'dangerous_content' => absint( $settings['dangerousContent'] ?? 2 ),
					'format_data'       => [],
					'existing_titles'   => $existing_titles,
					'topic'             => '',
				],
				'state_data'        => [],
				'site_persona'      => [
					'site_title'       => $site_persona_details['site_title'] ?? '',
					'site_description' => $site_persona_details['site_description'] ?? '',
					'site_for'         => $site_persona_details['site_purpose'] ?? '',
				],
			];

			$api_url = WPSOLVEX_AUTOAIBLOGGER_V2_POST_API;
			if ( ! filter_var( $api_url, FILTER_VALIDATE_URL ) ) {
				return [
					'success' => false,
					'message' => __( 'Invalid API endpoint.', 'solvex-ai-blogger' ),
				];
			}

			$max_retries = 2;
			$retry_delay = 3;
			$response    = null;

			for ( $attempt = 1; $attempt <= $max_retries; $attempt++ ) {
				$response = wp_remote_post(
					$api_url,
					[
						'headers'   => [
							'Content-Type' => 'application/json',
							'User-Agent'   => 'Solvex-AI-Blogger/' . WPSOLVEX_AUTOAIBLOGGER_VERSION,
						],
						'body'      => wp_json_encode( $body_args ),
						'timeout'   => 150,
						'sslverify' => true,
					]
				);

				if ( ! is_wp_error( $response ) ) {
					$response_code = wp_remote_retrieve_response_code( $response );
					if ( $response_code === 200 ) {
						break;
					}

					// Retry on transient server errors.
					if ( in_array( $response_code, [ 502, 503, 504 ], true ) && $attempt < $max_retries ) {
						sleep( $retry_delay );
						$retry_delay *= 2;
						continue;
					}

					// Non-retryable error — extract server message.
					$error_body = wp_remote_retrieve_body( $response );
					$error_data = json_decode( $error_body, true );
					$error_msg  = isset( $error_data['message'] ) ? $error_data['message'] : "API returned status code: {$response_code}";

					return [
						'success'  => false,
						'message'  => $error_msg,
						'attempts' => $attempt,
					];
				}

				// WP_Error — retry on timeout/connection failure.
				if ( $attempt < $max_retries ) {
					sleep( $retry_delay );
					$retry_delay *= 2;
				}
			}

			if ( is_wp_error( $response ) ) {
				return [
					'success'  => false,
					'message'  => 'API Error: ' . $response->get_error_message(),
					'attempts' => $attempt,
				];
			}

			$body = wp_remote_retrieve_body( $response );
			$data = json_decode( $body, true );

			if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $data ) ) {
				return [
					'success' => false,
					'message' => __( 'Invalid JSON response from API.', 'solvex-ai-blogger' ),
				];
			}

			if ( empty( $data['success'] ) || empty( $data['data'] ) ) {
				return [
					'success' => false,
					'message' => $data['message'] ?? __( 'API returned unsuccessful response.', 'solvex-ai-blogger' ),
				];
			}

			$api_data = $data['data'];

			// Convert the /generate-post response (Gutenberg blocks) into the flat
			// shape expected by generate_post_from_campaign().
			$blocks       = $api_data['blocks'] ?? [];
			$post_content = is_array( $blocks ) ? implode( "\n\n", $blocks ) : '';

			return [
				'success' => true,
				'data'    => [
					'post_title'           => $api_data['title'] ?? 'Generated Post',
					'post_content'         => $post_content,
					'summary'              => $api_data['summary'] ?? '',
					'images'               => $api_data['images'] ?? [],
					'token_data'           => $api_data['meta_updates']['tokens_used'] ?? null,
					'seo_keyphrase'        => $api_data['seo_keyphrase'] ?? '',
					'seo_title'            => $api_data['seo_title'] ?? '',
					'seo_meta_description' => $api_data['seo_meta_description'] ?? '',
				],
			];
		} catch ( \Exception $e ) {
			return [
				'success' => false,
				'message' => 'API Exception: ' . $e->getMessage(),
			];
		}
	}

	/**
	 * Schedule the next post for this campaign.
	 *
	 * @param int  $campaign_id Campaign ID.
	 * @param bool $is_retry Whether this is a retry after failure.
	 * @return void
	 * @since 0.0.2
	 */
	private function schedule_next_post( $campaign_id, $is_retry = false ): void {
		try {
			// Check if campaign is already completed.
			$campaign_completed = Metadata::get_campaign_meta( $campaign_id, 'campaignCompleted' );
			if ( $campaign_completed ) {
				return;
			}

			$repeat_interval = Metadata::get_campaign_meta( $campaign_id, 'repeatInterval' );
			$repeat_unit     = Metadata::get_campaign_meta( $campaign_id, 'repeatUnit' );
			$posts_target    = Metadata::get_campaign_meta( $campaign_id, 'postsTarget' );
			$posts_created   = Metadata::get_campaign_meta( $campaign_id, 'postsCreated' );
			$posts_failed    = Metadata::get_campaign_meta( $campaign_id, 'postsFailed' );
			$max_failures    = Metadata::get_campaign_meta( $campaign_id, 'maxFailures' );

			// Check if target reached by created count only (not scheduled attempts).
			if ( $posts_target > 0 && $posts_created >= $posts_target ) {
				$this->mark_campaign_completed( $campaign_id, 'target_reached' );
				return;
			}

			// Check if failure threshold exceeded.
			if ( $max_failures > 0 && $posts_failed >= $max_failures ) {
				$this->mark_campaign_completed( $campaign_id, 'max_failures_exceeded' );
				return;
			}

			// Determine scheduling interval.
			if ( $is_retry ) {
				// For retries after failures, use a short interval (2 minutes).
				$interval_seconds = apply_filters( 'wpsolvex_autoaiblogger_retry_interval_seconds', 120 ); // 2 minutes default.
				$next_run         = time() + $interval_seconds;
			} else {
				// Check if this is a weekly campaign with specific days selected.
				if ( $repeat_unit === 'week' ) {
					$repeat_weekly_on = Metadata::get_campaign_meta( $campaign_id, 'repeatWeeklyOn' );

					// If specific weekdays are selected, use weekday scheduling.
					if ( ! empty( $repeat_weekly_on ) && is_array( $repeat_weekly_on ) ) {
						$next_run = $this->calculate_next_weekday( $repeat_weekly_on, $campaign_id );
					} else {
						// No specific days selected, use normal weekly interval.
						$interval_seconds = $this->get_interval_seconds( $repeat_interval, $repeat_unit );
						$next_run         = time() + $interval_seconds;
					}
				} else {
					// For non-weekly campaigns, use normal interval.
					$interval_seconds = $this->get_interval_seconds( $repeat_interval, $repeat_unit );
					$next_run         = time() + $interval_seconds;
				}
			}

			wp_schedule_single_event( $next_run, 'wpsolvex_autoaiblogger_create_single_post', [ $campaign_id ] );

		} catch ( \Exception $e ) {
			return;
		}
	}

	/**
	 * Convert repeat interval and unit to seconds.
	 *
	 * @param int    $interval Repeat interval.
	 * @param string $unit Repeat unit.
	 * @return int Interval in seconds.
	 * @since 0.0.2
	 */
	private function get_interval_seconds( $interval, $unit ): int {
		$interval = max( 1, intval( $interval ) );

		// Production mode: Normal intervals.
		switch ( $unit ) {
			case 'hour':
				$seconds = $interval * HOUR_IN_SECONDS;
				break;
			case 'day':
				$seconds = $interval * DAY_IN_SECONDS;
				break;
			case 'week':
				$seconds = $interval * WEEK_IN_SECONDS;
				break;
			case 'month':
				$seconds = $interval * MONTH_IN_SECONDS;
				break;
			default:
				$seconds = $interval * DAY_IN_SECONDS;
		}

		// Allow testing plugins to modify intervals.
		return apply_filters( 'wpsolvex_autoaiblogger_cron_interval_seconds', $seconds, $interval, $unit );
	}

	/**
	 * Calculate the next occurrence of selected weekdays.
	 *
	 * @param array $selected_days Array of selected weekday abbreviations (e.g., ['mon', 'wed', 'fri']).
	 * @param int   $campaign_id Campaign ID for filter context.
	 * @return int Timestamp of next occurrence.
	 * @since 0.0.2
	 */
	private function calculate_next_weekday( $selected_days, $campaign_id ): int {
		if ( empty( $selected_days ) || ! is_array( $selected_days ) ) {
			// Fallback to 1 week if no days selected.
			return time() + WEEK_IN_SECONDS;
		}

		// Map weekday abbreviations to PHP day numbers (1 = Monday, 7 = Sunday).
		$day_map = [
			'mon' => 1,
			'tue' => 2,
			'wed' => 3,
			'thu' => 4,
			'fri' => 5,
			'sat' => 6,
			'sun' => 7,
		];

		// Get current day number (1-7).
		$current_day  = (int) gmdate( 'N' );
		$current_time = time();

		// Convert selected days to numeric format and sort.
		$selected_day_numbers = [];
		foreach ( $selected_days as $day ) {
			$day = strtolower( trim( $day ) );
			if ( isset( $day_map[ $day ] ) ) {
				$selected_day_numbers[] = $day_map[ $day ];
			}
		}

		if ( empty( $selected_day_numbers ) ) {
			// Fallback if no valid days.
			return time() + WEEK_IN_SECONDS;
		}

		sort( $selected_day_numbers );

		// Find the next occurrence.
		$next_day    = null;
		$days_to_add = 0;

		// Check for next occurrence in current week.
		foreach ( $selected_day_numbers as $day_number ) {
			if ( $day_number > $current_day ) {
				$next_day    = $day_number;
				$days_to_add = $next_day - $current_day;
				break;
			}
		}

		// If no day found in current week, use the first day of next week.
		if ( $next_day === null ) {
			$next_day    = $selected_day_numbers[0];
			$days_to_add = 7 - $current_day + $next_day;
		}

		// Calculate next timestamp.
		$next_timestamp = $current_time + ( $days_to_add * DAY_IN_SECONDS );

		// Allow testing plugins to modify the weekday interval.
		// Pass the days_to_add for context (testing plugins can use this).
		return apply_filters(
			'wpsolvex_autoaiblogger_weekday_next_occurrence',
			$next_timestamp,
			$selected_days,
			$days_to_add,
			$campaign_id
		);
	}

	/**
	 * Determine error type based on error message for better categorization.
	 *
	 * @param string $error_message The error message.
	 * @return string The error type.
	 * @since 0.0.2
	 */
	private function determine_error_type( $error_message ): string {
		$error_message = strtolower( $error_message );

		// Network/connectivity errors.
		if ( strpos( $error_message, 'timeout' ) !== false ||
			strpos( $error_message, 'network' ) !== false ||
			strpos( $error_message, 'connection' ) !== false ||
			strpos( $error_message, 'failed to connect' ) !== false ) {
			return 'network_error';
		}

		// API quota/subscription errors.
		if ( strpos( $error_message, 'quota' ) !== false ||
			strpos( $error_message, 'subscription' ) !== false ||
			strpos( $error_message, 'limit' ) !== false ||
			strpos( $error_message, 'exceeded' ) !== false ) {
			return 'quota_error';
		}

		// Content filtering errors.
		if ( strpos( $error_message, 'content filtering' ) !== false ||
			strpos( $error_message, 'blocked' ) !== false ||
			strpos( $error_message, 'safety' ) !== false ) {
			return 'content_filter_error';
		}

		// Validation errors.
		if ( strpos( $error_message, 'invalid' ) !== false ||
			strpos( $error_message, 'keywords' ) !== false ||
			strpos( $error_message, 'validation' ) !== false ) {
			return 'validation_error';
		}

		// License/authentication errors.
		if ( strpos( $error_message, 'license' ) !== false ||
			strpos( $error_message, 'token' ) !== false ||
			strpos( $error_message, 'authentication' ) !== false ||
			strpos( $error_message, 'unauthorized' ) !== false ) {
			return 'auth_error';
		}

		// API response errors.
		if ( strpos( $error_message, 'api' ) !== false ||
			strpos( $error_message, 'status code' ) !== false ||
			strpos( $error_message, 'response' ) !== false ) {
			return 'api_error';
		}

		// Database errors.
		if ( strpos( $error_message, 'database' ) !== false ||
			strpos( $error_message, 'insert' ) !== false ||
			strpos( $error_message, 'wp_error' ) !== false ) {
			return 'database_error';
		}

		return 'unknown_error';
	}

	/**
	 * Mark campaign as completed and log the reason.
	 *
	 * @param int    $campaign_id Campaign ID.
	 * @param string $reason Completion reason.
	 * @return void
	 * @since 0.0.2
	 */
	private function mark_campaign_completed( $campaign_id, $reason ): void {
		// Mark campaign as completed.
		wp_update_post(
			[
				'ID'          => $campaign_id,
				'post_status' => 'draft', // Set to draft to indicate completion/inactivity.
			]
		);

		// Add completion meta flags.
		Metadata::update_campaign_meta( $campaign_id, 'campaignCompleted', true );
		Metadata::update_campaign_meta( $campaign_id, 'completedAt', current_time( 'mysql' ) );
		Metadata::update_campaign_meta( $campaign_id, 'completionReason', $reason );

		// Log completion.
		if ( $reason === 'max_failures_exceeded' ) {
			$posts_failed = Metadata::get_campaign_meta( $campaign_id, 'postsFailed' );
			$max_failures = Metadata::get_campaign_meta( $campaign_id, 'maxFailures' );

			wpsolvex_autoaiblogger_log_campaign_error(
				$campaign_id,
				'campaign_terminated',
				sprintf(
					/* translators: %1$d is the number of posts failed, %2$d is the maximum number of failures. */
					__( 'Campaign terminated: Maximum failures reached (%1$d/%2$d). Please check your settings and try again.', 'solvex-ai-blogger' ),
					$posts_failed,
					$max_failures
				),
				[
					'termination_reason' => $reason,
					'posts_failed'       => $posts_failed,
					'max_failures'       => $max_failures,
				]
			);

			// Trigger notification: Campaign Failed/Terminated.
			do_action(
				'wpsolvex_autoaiblogger_campaign_failed',
				$campaign_id,
				sprintf(
					/* translators: %1$d is the number of posts failed, %2$d is the maximum number of failures. */
					__( 'Maximum failures reached (%1$d/%2$d)', 'solvex-ai-blogger' ),
					$posts_failed,
					$max_failures
				),
				[
					'posts_created' => Metadata::get_campaign_meta( $campaign_id, 'postsCreated' ),
					'posts_target'  => Metadata::get_campaign_meta( $campaign_id, 'postsTarget' ),
					'posts_failed'  => $posts_failed,
				]
			);
		}

		// Clear any scheduled events since campaign is now complete.
		wp_clear_scheduled_hook( 'wpsolvex_autoaiblogger_create_single_post', [ $campaign_id ] );
	}

	/**
	 * Process images from API response and replace placeholders with actual images.
	 *
	 * @param string $content HTML content with image placeholders.
	 * @param array  $images  Array of image data from API.
	 * @return array|WP_Error Array with 'content' and 'featured_image_id' or WP_Error on failure.
	 * @since 0.0.2
	 */
	private function process_images_and_replace_placeholders( $content, $images ) {
		if ( empty( $images ) || ! is_array( $images ) ) {
			return [
				'content'           => $content,
				'featured_image_id' => null,
			];
		}

		$featured_image_id = null;
		$uploaded_images   = [];

		// Upload all images first.
		foreach ( $images as $image ) {
			if ( empty( $image['url'] ) ) {
				continue;
			}

			$alt_text      = $image['alt'] ?? '';
			$attachment_id = $this->upload_image_to_media_library( $image['url'], $alt_text );

			if ( is_wp_error( $attachment_id ) ) {
				continue;
			}

			// Store first successful upload as featured image.
			if ( $featured_image_id === null ) {
				$featured_image_id = $attachment_id;
			}

			$uploaded_images[] = [
				'attachment_id' => $attachment_id,
				'alt_text'      => $alt_text,
			];
		}

		// Replace placeholders with actual image blocks.
		// Skip the first image since it's used as featured image.
		if ( ! empty( $uploaded_images ) ) {
			$processed_content = $content;

			// Start from index 1 to skip the featured image (index 0).
			$uploaded_images_count = count( $uploaded_images );
			for ( $i = 1; $i < $uploaded_images_count; $i++ ) {
				$uploaded_image = $uploaded_images[ $i ];
				$attachment_id  = $uploaded_image['attachment_id'];
				$alt_text       = $uploaded_image['alt_text'];

				// Create Gutenberg image block with the attachment ID.
				$image_block = sprintf(
					'<!-- wp:image {"id":%d,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="%s" alt="%s" class="wp-image-%d"/></figure>
<!-- /wp:image -->',
					$attachment_id,
					wp_get_attachment_url( $attachment_id ),
					esc_attr( $alt_text ),
					$attachment_id
				);

				// Replace the first occurrence of the placeholder.
				$placeholder_pos = strpos( $processed_content, '{{WP_AIB_IMAGE}}' );
				if ( $placeholder_pos !== false ) {
					$processed_content = substr_replace(
						$processed_content,
						$image_block,
						$placeholder_pos,
						strlen( '{{WP_AIB_IMAGE}}' )
					);
				}
			}

			// Remove any remaining placeholders that weren't replaced.
			$processed_content = str_replace( '{{WP_AIB_IMAGE}}', '', $processed_content );

			return [
				'content'           => $processed_content,
				'featured_image_id' => $featured_image_id,
			];
		}

		return [
			'content'           => $content,
			'featured_image_id' => null,
		];
	}

	/**
	 * Upload image to WordPress media library.
	 *
	 * @param string $image_url Image URL to download and upload.
	 * @param string $alt_text  Alt text for the image.
	 * @return int|WP_Error Attachment ID on success, WP_Error on failure.
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
}
