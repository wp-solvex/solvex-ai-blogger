<?php
/**
 * Metadata.
 *
 * @package solvex-ai-blogger
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * This class will holds the code related to the managing of settings of the plugin.
 *
 * @class Metadata
 */
class Metadata {
	/**
	 * Cache the DB options
	 *
	 * @since 1.0.0
	 * @access public
	 * @var array
	 */
	public static $dashboard_options = [];

	/**
	 * Returns all default post settings.
	 *
	 * @return array
	 * @since 1.0.0
	 */
	public static function get_settings_dataset() {
		return apply_filters(
			'wpsolvex_autoaiblogger_postmeta_dataset',
			[
				'type'                    => [
					'default' => 'new',
					'type'    => 'string',
				],
				'title'                   => [
					'default' => '',
					'type'    => 'string',
				],
				'status'                  => [
					'default' => 'publish',
					'type'    => 'string',
				],
				'keywords'                => [
					'default' => '',
					'type'    => 'string',
				],
				'postsTarget'             => [
					'default' => 1,
					'type'    => 'number',
				],
				'repeatInterval'          => [
					'default' => 1,
					'type'    => 'number',
				],
				'repeatUnit'              => [
					'default' => 'day',
					'type'    => 'string',
				],
				'repeatWeeklyOn'          => [
					'default' => [],
					'type'    => 'array',
				],
				'startDate'               => [
					'default' => '',
					'type'    => 'string',
				],
				'postType'                => [
					'default' => 'post',
					'type'    => 'string',
				],
				'postStatus'              => [
					'default' => 'draft',
					'type'    => 'string',
				],
				'summaryAsExcerpt'        => [
					'default' => true,
					'type'    => 'bool',
				],
				'author'                  => [
					'default' => get_current_user_id(),
					'type'    => 'string',
				],
				'category'                => [
					'default' => '',
					'type'    => 'string',
				],
				'tag'                     => [
					'default' => '',
					'type'    => 'string',
				],
				'lastRun'                 => [
					'default' => '',
					'type'    => 'string',
				],
				'lastPostID'              => [
					'default' => '',
					'type'    => 'number',
				],
				'postsCreated'            => [
					'default' => 0,
					'type'    => 'number',
				],
				'postsScheduled'          => [
					'default' => 0,
					'type'    => 'number',
				],
				'postsFailed'             => [
					'default' => 0,
					'type'    => 'number',
				],
				'maxFailures'             => [
					'default' => 20,
					'type'    => 'number',
				],
				'retryTracking'           => [
					'default' => [],
					'type'    => 'array',
				],
				'errorLogs'               => [
					'default' => [],
					'type'    => 'array',
				],
				'successLogs'             => [
					'default' => [],
					'type'    => 'array',
				],
				'lastError'               => [
					'default' => '',
					'type'    => 'string',
				],
				'lastErrorType'           => [
					'default' => '',
					'type'    => 'string',
				],
				'lastErrorTime'           => [
					'default' => '',
					'type'    => 'string',
				],
				'completionReason'        => [
					'default' => '',
					'type'    => 'string',
				],
				'campaignCompleted'       => [
					'default' => false,
					'type'    => 'boolean',
				],
				'isPaused'                => [
					'default' => false,
					'type'    => 'boolean',
				],
				'pausedAt'                => [
					'default' => '',
					'type'    => 'string',
				],
				'maxWords'                => [
					'default' => 1000,
					'type'    => 'number',
				],
				'numberOfImages'          => [
					'default' => 1,
					'type'    => 'number',
				],
				'postsVisit'              => [
					'default' => 0,
					'type'    => 'number',
				],
				'overrideSitePersona'     => [
					'default' => false,
					'type'    => 'bool',
				],
				'overrideSiteTitle'       => [
					'default' => get_bloginfo( 'name' ),
					'type'    => 'string',
				],
				'overrideSiteDescription' => [
					'default' => get_bloginfo( 'description' ),
					'type'    => 'string',
				],
				'overrideSiteFor'         => [
					'default' => '',
					'type'    => 'string',
				],

				// Phase 2: Campaign format and content modifiers.
				'campaignFormat'          => [
					'default' => 'standard',
					'type'    => 'string',
				],
				'targetDemographic'       => [
					'default' => 'General Public',
					'type'    => 'string',
				],
				'contentTone'             => [
					'default' => 'Professional',
					'type'    => 'string',
				],

				// Phase 2: Series campaign state.
				'seriesTotalParts'        => [
					'default' => 5,
					'type'    => 'number',
				],
				'seriesSyllabus'          => [
					'default' => '[]',
					'type'    => 'json',
				],
				'seriesCurrentIndex'      => [
					'default' => 0,
					'type'    => 'number',
				],
				'seriesHubPostId'         => [
					'default' => 0,
					'type'    => 'number',
				],
				'seriesPreviousPostId'    => [
					'default' => 0,
					'type'    => 'number',
				],
				'seriesTaxonomyTermId'    => [
					'default' => 0,
					'type'    => 'number',
				],

				// Phase 2: Listicle campaign.
				'listicleItemCount'       => [
					'default' => 10,
					'type'    => 'number',
				],

				// Phase 2: Comparison campaign.
				'comparisonEntities'      => [
					'default' => '[]',
					'type'    => 'json',
				],

				// Phase 2.1: Auto-generated blog topics for multi-post campaigns.
				'campaignTopics'          => [
					'default' => '[]',
					'type'    => 'json',
				],
			]
		);
	}

	/**
	 * Returns the campaign meta value with security validation.
	 *
	 * @param int    $campaign_id The campaign ID.
	 * @param string $key         The meta key.
	 * @return mixed
	 *
	 * @since 1.0.0
	 */
	public static function get_campaign_meta( $campaign_id, $key ) {
		// Validate campaign ID.
		$campaign_id = absint( $campaign_id );
		if ( $campaign_id <= 0 ) {
			return self::get_default_option( $key );
		}

		// Validate key.
		if ( ! is_string( $key ) || empty( $key ) ) {
			return self::get_default_option( $key );
		}

		// Validate key format (allow alphanumeric and camelCase).
		if ( ! preg_match( '/^[a-zA-Z][a-zA-Z0-9]*$/', $key ) ) {
			return self::get_default_option( $key );
		}

		// Check if key exists in allowed settings.
		$settings_dataset = self::get_settings_dataset();
		if ( ! array_key_exists( $key, $settings_dataset ) ) {
			return self::get_default_option( $key );
		}

		// Verify post exists and is a campaign.
		$post = get_post( $campaign_id );
		if ( ! $post || $post->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
			return self::get_default_option( $key );
		}

		// Check user permissions (skip during cron execution).
		if ( ! wp_doing_cron() && ! current_user_can( 'read_post', $campaign_id ) ) {
			return self::get_default_option( $key );
		}

		$meta_value = get_post_meta( $campaign_id, $key, true );

		if ( ! empty( $meta_value ) ) {
			// Sanitize output based on data type.
			$data_type = $settings_dataset[ $key ]['type'] ?? 'string';
			return self::sanitize_output( $meta_value, $data_type );
		}

		return self::get_default_option( $key );
	}

	/**
	 * Update the campaign meta value with security validation.
	 *
	 * @param int    $campaign_id The campaign ID.
	 * @param string $key         The meta key.
	 * @param mixed  $value       The meta value.
	 * @return bool
	 *
	 * @since 1.0.0
	 */
	public static function update_campaign_meta( $campaign_id, $key, $value ) {
		// Validate campaign ID.
		$campaign_id = absint( $campaign_id );
		if ( $campaign_id <= 0 ) {
			return false;
		}

		// Validate key.
		if ( ! is_string( $key ) || empty( $key ) ) {
			return false;
		}

		// Validate key format (allow alphanumeric and camelCase).
		if ( ! preg_match( '/^[a-zA-Z][a-zA-Z0-9]*$/', $key ) ) {
			return false;
		}

		// Check if key exists in allowed settings.
		$settings_dataset = self::get_settings_dataset();
		if ( ! array_key_exists( $key, $settings_dataset ) ) {
			return false;
		}

		// Verify post exists and is a campaign.
		$post = get_post( $campaign_id );
		if ( ! $post || $post->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
			return false;
		}

		// Check user permissions (skip during cron execution).
		if ( ! wp_doing_cron() && ! current_user_can( 'edit_post', $campaign_id ) ) {
			return false;
		}

		$data_type = $settings_dataset[ $key ]['type'] ?? 'string';
		$value     = self::sanitize_data( $value, $data_type );

		if ( $value === false ) {
			return false;
		}

		return update_post_meta( $campaign_id, $key, $value );
	}

	/**
	 * Returns an option from the default options.
	 *
	 * @param  string $key     The option key.
	 * @param  mixed  $default Option default value if option is not available.
	 * @return mixed   Returns the option value
	 *
	 * @since 1.0.0
	 */
	public static function get_default_option( $key, $default = false ) {
		$default_settings = self::get_default_settings();

		if ( ! is_array( $default_settings ) || ! array_key_exists( $key, $default_settings ) || empty( $default_settings ) ) {
			return $default;
		}

		return $default_settings[ $key ];
	}

	/**
	 * As per the settings dataset, return the default settings.
	 *
	 * @return array
	 * @since 1.0.0
	 */
	public static function get_default_settings() {
		$settings_dataset = self::get_settings_dataset();

		$default_settings = [];

		foreach ( $settings_dataset as $key => $value ) {
			$default_settings[ $key ] = $value['default'];
		}

		return $default_settings;
	}

	/**
	 * Sanitize output values based on data type.
	 *
	 * @since 1.0.0
	 * @param mixed  $value     The value to sanitize.
	 * @param string $data_type The data type for sanitization.
	 * @return mixed Sanitized value.
	 */
	public static function sanitize_output( $value, $data_type = 'string' ) {
		switch ( $data_type ) {
			case 'bool':
				return (bool) $value;

			case 'int':
			case 'number':
				return absint( $value );

			case 'float':
				return (float) $value;

			case 'url':
				return esc_url( $value );

			case 'email':
				return sanitize_email( $value );

			case 'array':
				return is_array( $value ) ? wpsolvex_autoaiblogger_clean_data( $value ) : [];

			case 'json':
				if ( is_string( $value ) ) {
					$decoded = json_decode( $value, true );
					return is_array( $decoded ) ? $decoded : [];
				}
				return is_array( $value ) ? $value : [];

			case 'html':
				return wp_kses_post( $value );

			case 'text':
			case 'string':
			case 'default':
			default:
				return sanitize_text_field( $value );
		}
	}

	/**
	 * Data cleaner
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param mixed  $value     data from AJAX.
	 * @param string $data_type datatype to sanitize further.
	 *
	 * @return mixed Sanitized data.
	 */
	public static function sanitize_data( $value, $data_type = 'default' ) {
		$output = '';
		switch ( $data_type ) {
			case 'bool':
				$output = isset( $value ) && sanitize_text_field( $value ) === 'true' ? true : false;
				break;

			case 'int':
			case 'number':
				$output = isset( $value ) && is_numeric( $value ) ? absint( $value ) : 0;
				break;

			case 'url':
				$output = ! empty( $value ) ? esc_url( $value ) : '';
				break;

			case 'array':
				$output = ! empty( $value ) ? wpsolvex_autoaiblogger_clean_data( $value ) : '';
				break;

			case 'json':
				if ( is_string( $value ) ) {
					$decoded = json_decode( $value, true );
					$output  = is_array( $decoded ) ? wp_json_encode( $decoded ) : '[]';
				} elseif ( is_array( $value ) ) {
					$output = wp_json_encode( $value );
				} else {
					$output = '[]';
				}
				break;

			case 'html':
				$output = ! empty( $value ) ? wp_unslash( $value ) : '';
				break;

			case 'string':
			case 'default':
			default:
				$output = isset( $value ) ? sanitize_text_field( wp_unslash( $value ) ) : '';
				break;
		}

		return $output;
	}

	/**
	 * Format post metadata in a way that it can be saved in the database via wp_insert_post.
	 *
	 * @param array $postdata The metadata to format.
	 * @since 1.0.0
	 * @return array The formatted metadata.
	 */
	public static function format_data( $postdata ) {
		$defaults = self::get_default_settings();

		$meta_data      = [];
		$skippable_keys = [ 'title', 'status', 'post_content', 'type', 'isNew' ]; // These keys are not metadata..
		foreach ( $postdata as $key => $value ) {
			if ( in_array( $key, $skippable_keys, true ) ) {
				continue;
			}
			$meta_data[ $key ] = $value;
		}

		return [
			'title'      => $postdata['title'] ?? $defaults['title'],
			'content'    => $postdata['post_content'] ?? '',
			'status'     => $postdata['status'] ?? $defaults['status'],
			'meta_input' => $meta_data,
		];
	}

	/**
	 * Get all campaign metadata as per the settings dataset.
	 *
	 * @param int $post_id The post ID.
	 * @return array<mixed> The metadata.
	 * @since 1.0.0
	 */
	public static function get_metadata( $post_id ) {
		$settings_dataset = self::get_settings_dataset();
		$metadata         = [];

		foreach ( $settings_dataset as $key => $value ) {
			$meta_value      = get_post_meta( $post_id, $key, true );
			$sanitized_value = self::sanitize_output( $meta_value, $value['type'] ?? 'string' );

			if ( ! empty( $meta_value ) ) {
				$metadata[ $key ] = $sanitized_value;
			} else {
				$metadata[ $key ] = $value['default'];
			}
		}

		return $metadata;
	}

	/**
	 * Calculate total visits for all posts in a campaign.
	 *
	 * @param int $campaign_id The campaign ID.
	 * @return int Total visits across all posts in the campaign.
	 * @since 1.0.0
	 */
	public static function calculate_campaign_total_visits( $campaign_id ) {
		// Validate campaign ID.
		$campaign_id = absint( $campaign_id );
		if ( $campaign_id <= 0 ) {
			return 0;
		}

		// Get all posts for this campaign.
		$campaign_posts = get_posts(
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
				'update_post_meta_cache' => true,
				'update_post_term_cache' => false,
			]
		);

		// Calculate total visits.
		$total_visits = 0;
		if ( ! empty( $campaign_posts ) ) {
			foreach ( $campaign_posts as $post_id ) {
				$views         = absint( get_post_meta( $post_id, 'post_views_count', true ) );
				$total_visits += $views;
			}
		}

		return $total_visits;
	}

	/**
	 * Get passed campaign post data.
	 *
	 * @param int  $post_id The post ID.
	 * @param bool $plain_metadata Whether to return plain metadata.
	 * @since 0.0.1
	 * @return array|bool The campaign data or false if not found.
	 */
	public static function get_campaign_data( $post_id, $plain_metadata = false ) {
		$campaign = get_post( $post_id );
		$metadata = self::get_metadata( $post_id );

		if ( ! $campaign ) {
			return false;
		}

		if ( ! $campaign->post_type || $campaign->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
			return false;
		}

		$meta_posts_created   = absint( $metadata['postsCreated'] ?? 0 );
		$meta_posts_scheduled = absint( $metadata['postsScheduled'] ?? 0 );
		$meta_posts_failed    = absint( $metadata['postsFailed'] ?? 0 );
		$meta_posts_target    = absint( $metadata['postsTarget'] ?? 0 );
		$meta_frequency       = absint( $metadata['repeatInterval'] ?? 0 );
		$repeat_unit          = $metadata['repeatUnit'] ?? 'day';

		// Calculate total visits from all posts in this campaign.
		$total_visits = self::calculate_campaign_total_visits( $post_id );

		// Always use raw numeric values for the frontend.
		$metadata['postsCreated']   = $meta_posts_created;
		$metadata['postsScheduled'] = $meta_posts_scheduled;
		$metadata['postsFailed']    = $meta_posts_failed;
		$metadata['postsTarget']    = $meta_posts_target;
		$metadata['postsVisit']     = $total_visits;

		// Format frequency for display.
		if ( ! $plain_metadata ) {
			$meta_frequency = __( 'Every', 'solvex-ai-blogger' ) . ' ' . $meta_frequency . ' ' . $repeat_unit;

			// Add weekday selection info if it's a weekly campaign with specific days.
			if ( $repeat_unit === 'week' && ! empty( $metadata['repeatWeeklyOn'] ) && is_array( $metadata['repeatWeeklyOn'] ) ) {
				$day_names = [
					'mon' => __( 'Mon', 'solvex-ai-blogger' ),
					'tue' => __( 'Tue', 'solvex-ai-blogger' ),
					'wed' => __( 'Wed', 'solvex-ai-blogger' ),
					'thu' => __( 'Thu', 'solvex-ai-blogger' ),
					'fri' => __( 'Fri', 'solvex-ai-blogger' ),
					'sat' => __( 'Sat', 'solvex-ai-blogger' ),
					'sun' => __( 'Sun', 'solvex-ai-blogger' ),
				];

				$selected_day_names = [];
				foreach ( $metadata['repeatWeeklyOn'] as $day ) {
					$day = strtolower( trim( $day ) );
					if ( isset( $day_names[ $day ] ) ) {
						$selected_day_names[] = $day_names[ $day ];
					}
				}

				if ( ! empty( $selected_day_names ) ) {
					$meta_frequency .= ' (' . implode( ', ', $selected_day_names ) . ')';
				}
			}

			$metadata['frequency'] = $meta_frequency;
		}

		if ( ! empty( $metadata['lastRun'] ) ) {
			$metadata['lastRun'] = date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $metadata['lastRun'] ) );
		} else {
			$metadata['lastRun'] = __( 'Not Started Yet.', 'solvex-ai-blogger' );
		}

		return array_merge(
			$metadata,
			[
				'id'              => $campaign->ID,
				'name'            => $campaign->post_title,
				'title'           => $campaign->post_title,
				'status'          => $campaign->post_status,
				'created_at'      => $campaign->post_date,
				'updated_at'      => $campaign->post_modified,
				'last_post_title' => get_the_title( $metadata['lastPostID'] ?? 0 ),
			]
		);
	}
}
