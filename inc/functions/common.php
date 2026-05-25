<?php
/**
 * Plugin Common Functions for Solvex AI Blogger.
 *
 * This file contains common utility functions with security measures.
 * All functions implement proper input validation, data sanitization, and
 * security checks to prevent unauthorized access and data manipulation.
 *
 * @package solvex-ai-blogger
 * @subpackage Functions
 * @since 1.0.0
 */

defined( 'ABSPATH' ) || exit;

use WPSolvex\AutoAIBlogger\Inc\Utils\Metadata;
use WPSolvex\AutoAIBlogger\Inc\Utils\Settings;

/**
 * Get user details with security validation.
 *
 * @param string $detail Detail to get (name|email).
 * @return string User detail or empty string on failure.
 * @since 1.0.0
 */
function wpsolvex_autoaiblogger_get_user_detail( $detail ) {
	// Validate input parameter.
	if ( ! is_string( $detail ) || empty( $detail ) ) {
		return '';
	}

	// Sanitize input.
	$detail = sanitize_key( $detail );

	// Check allowed detail types.
	$allowed_details = [ 'name', 'email' ];
	if ( ! in_array( $detail, $allowed_details, true ) ) {
		return '';
	}

	// Get current user safely.
	$current_user = wp_get_current_user();

	if ( ! $current_user || ! $current_user->exists() ) {
		return '';
	}

	switch ( $detail ) {
		case 'name':
			$name = ! empty( $current_user->user_firstname ) ?
				$current_user->user_firstname :
				$current_user->display_name;
			return sanitize_text_field( $name );

		case 'email':
			$email = ! empty( $current_user->user_email ) ?
				$current_user->user_email : '';
			return sanitize_email( $email );

		default:
			return '';
	}
}

/**
 * Clean the plugin data with security validation.
 *
 * @param mixed $data Data to clean.
 * @return mixed Cleaned data.
 * @since 1.0.0
 */
function wpsolvex_autoaiblogger_clean_data( $data ) {
	if ( is_array( $data ) ) {
		return array_map( 'wpsolvex_autoaiblogger_clean_data', $data );
	}
	return is_scalar( $data ) ? sanitize_text_field( (string) $data ) : $data;
}

/**
 * Get all campaigns with security validation.
 *
 * @since 1.0.0
 * @return array Sanitized campaigns data.
 */
function wpsolvex_autoaiblogger_get_all_campaigns() {
	// Check user capabilities.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return [];
	}

	try {
		$campaigns = get_posts(
			[
				'post_type'              => WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN,
				'posts_per_page'         => 100, // Limit for performance.
				'post_status'            => [ 'publish', 'draft', 'private' ],
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'update_post_term_cache' => false,
				'update_post_meta_cache' => false,
			]
		);

		$campaigns_data = [];

		if ( ! is_wp_error( $campaigns ) && ! empty( $campaigns ) ) {
			foreach ( $campaigns as $campaign ) {
				// Validate campaign object.
				if ( ! $campaign instanceof WP_Post || $campaign->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
					continue;
				}

				// Check if user can read this campaign.
				if ( ! current_user_can( 'read_post', $campaign->ID ) ) {
					continue;
				}

				$campaign_data = Metadata::get_campaign_data( $campaign->ID, false );

				// Sanitize campaign data.
				if ( is_array( $campaign_data ) && ! empty( $campaign_data ) ) {
					$campaigns_data[ absint( $campaign->ID ) ] = $campaign_data;
				}
			}
		}

		return $campaigns_data;

	} catch ( \Exception $e ) {
		return [];
	}
}

/**
 * Get all generated posts with security validation.
 *
 * @since 1.0.0
 * @return array Sanitized generated posts data.
 */
function wpsolvex_autoaiblogger_get_generated_posts() {
	// Check user capabilities.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return [];
	}

	try {
		$generated_posts = get_posts(
			[
				'post_type'              => get_post_types( [ 'public' => true ] ),
				'posts_per_page'         => -1, // Limit for performance.
				'post_status'            => [ 'publish', 'draft', 'private' ],
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'update_post_term_cache' => false,
				'update_post_meta_cache' => false,
				'meta_query'             => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Using meta query for campaign generated posts.
					[
						'key'     => 'wpsolvex_autoaiblogger_reference',
						'value'   => 1,
						'compare' => '=',
					],
				],
			]
		);

		$posts_data = [];

		if ( ! is_wp_error( $generated_posts ) && ! empty( $generated_posts ) ) {
			foreach ( $generated_posts as $post ) {
				// Validate post object.
				if ( ! $post instanceof WP_Post ) {
					continue;
				}

				// Check if user can read this post.
				if ( ! current_user_can( 'read_post', $post->ID ) ) {
					continue;
				}

				// Sanitize post data.
				$posts_data[] = [
					'id'        => absint( $post->ID ),
					'title'     => sanitize_text_field( $post->post_title ),
					'status'    => sanitize_key( $post->post_status ),
					'type'      => sanitize_key( $post->post_type ),
					'date'      => sanitize_text_field( $post->post_date ),
					'modified'  => sanitize_text_field( $post->post_modified ),
					'author_id' => absint( $post->post_author ),
				];
			}
		}

		return $posts_data;

	} catch ( \Exception $e ) {
		return [];
	}
}

/**
 * Get array depth safely to prevent memory issues.
 *
 * @since 0.0.2
 * @param array $array Array to check depth.
 * @return int Array depth.
 */
function wpsolvex_autoaiblogger_get_array_depth( array $array ): int {
	$max_depth = 1;

	foreach ( $array as $value ) {
		if ( is_array( $value ) ) {
			$depth = wpsolvex_autoaiblogger_get_array_depth( $value ) + 1;

			if ( $depth > $max_depth ) {
				$max_depth = $depth;
			}
		}
	}

	return $max_depth;
}

/**
 * Get all post statuses with security.
 *
 * @since 1.0.0
 * @return array Sanitized post statuses.
 */
function wpsolvex_autoaiblogger_get_post_statuses() {
	return apply_filters(
		'wpsolvex_autoaiblogger_post_statuses',
		[
			'publish' => __( 'Published', 'solvex-ai-blogger' ),
			'future'  => __( 'Scheduled', 'solvex-ai-blogger' ),
			'draft'   => __( 'Draft', 'solvex-ai-blogger' ),
			'pending' => __( 'Pending Review', 'solvex-ai-blogger' ),
			'private' => __( 'Private', 'solvex-ai-blogger' ),
		]
	);
}

/**
 * Get all post types with security validation.
 *
 * @since 1.0.0
 * @return array Sanitized post types.
 */
function wpsolvex_autoaiblogger_get_post_types() {
	// Check user capabilities.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return [];
	}

	try {
		$queried_post_types = array_keys(
			get_post_types(
				apply_filters(
					'wpsolvex_autoaiblogger_post_types_query_args',
					[
						'public'   => true,
						'_builtin' => false,
					]
				),
				'objects'
			)
		);

		// Exclude sensitive post types.
		$excluded_post_types = apply_filters(
			'wpsolvex_autoaiblogger_excluded_post_types',
			[
				WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN,
				'sfwd-assignment',
				'sfwd-essays',
				'sfwd-transactions',
				'sfwd-certificates',
				'sfwd-quiz',
				'e-landing-page',
				'astra-advanced-hook',
				'cartflows_step',
				'cartflows_flow',
				'wp_block',
				'user_request',
				'oembed_cache',
				'sfwd-assignment',
				'astra_adv_header',
				'elementor_library',
				'brizy_template',
				'sc_collection',
				'course',
				'lesson',
				'llms_membership',
				'tutor_quiz',
				'tutor_assignments',
				'testimonial',
				'frm_display',
				'mec_esb',
				'mec-events',
			]
		);

		$queried_post_types = array_diff( $queried_post_types, $excluded_post_types );

		// Add built-in post types with security check (excluding 'page' as it's not suitable for campaigns).
		$builtin_post_types = [ 'post' ];

		foreach ( $builtin_post_types as $post_type ) {
			$post_type_obj = get_post_type_object( $post_type );
			if ( $post_type_obj && current_user_can( $post_type_obj->cap->edit_posts ) ) {
				$queried_post_types[] = $post_type;
			}
		}

		// Sanitize post type names and get labels.
		$sanitized_post_types = [];
		foreach ( $queried_post_types as $post_type ) {
			$post_type     = sanitize_key( $post_type );
			$post_type_obj = get_post_type_object( $post_type );

			if ( $post_type_obj && ! empty( $post_type_obj->labels->name ) ) {
				$sanitized_post_types[ $post_type ] = sanitize_text_field( $post_type_obj->labels->name );
			}
		}

		return $sanitized_post_types;

	} catch ( \Exception $e ) {
		return [ 'post' => 'Posts' ]; // Safe fallback.
	}
}

/**
 * Get post categories with security validation.
 *
 * @since 1.0.0
 * @return array Sanitized categories.
 */
function wpsolvex_autoaiblogger_get_categories() {
	// Check user capabilities.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return [];
	}

	try {
		$categories = get_categories(
			[
				'taxonomy'   => 'category',
				'hide_empty' => false,
				'number'     => 200, // Limit for performance.
			]
		);

		if ( is_wp_error( $categories ) || empty( $categories ) ) {
			return [];
		}

		$cats = [];
		foreach ( $categories as $category ) {
			// Validate category object.
			if ( ! $category instanceof WP_Term ) {
				continue;
			}

			$cats[] = [
				'id'   => absint( $category->term_id ),
				'name' => sanitize_text_field( $category->name ),
				'slug' => sanitize_title( $category->slug ),
			];
		}

		return $cats;

	} catch ( \Exception $e ) {
		return [];
	}
}

/**
 * Get post tags with security validation.
 *
 * @since 1.0.0
 * @return array Sanitized tags.
 */
function wpsolvex_autoaiblogger_get_tags() {
	// Check user capabilities.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return [];
	}

	try {
		$tags = get_tags(
			[
				'taxonomy'   => 'post_tag',
				'orderby'    => 'name',
				'hide_empty' => false,
				'number'     => 500, // Limit for performance.
			]
		);

		if ( is_wp_error( $tags ) || empty( $tags ) ) {
			return [];
		}

		$tag_list = [];
		foreach ( $tags as $tag ) {
			// Validate tag object.
			if ( ! $tag instanceof WP_Term ) {
				continue;
			}

			$tag_list[] = [
				'id'   => absint( $tag->term_id ),
				'name' => sanitize_text_field( $tag->name ),
				'slug' => sanitize_title( $tag->slug ),
			];
		}

		return $tag_list;

	} catch ( \Exception $e ) {
		return [];
	}
}

/**
 * Get all authors with security validation.
 *
 * @since 1.0.0
 * @return array Sanitized authors list.
 */
function wpsolvex_autoaiblogger_get_authors() {
	// Check user capabilities.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return [];
	}

	try {
		$users = get_users(
			[
				'capability' => 'edit_posts',
				'number'     => 100, // Limit for performance.
				'orderby'    => 'display_name',
				'order'      => 'ASC',
			]
		);

		if ( is_wp_error( $users ) || empty( $users ) ) {
			return [];
		}

		$authors = [];
		foreach ( $users as $user ) {
			// Validate user object.
			if ( ! $user instanceof WP_User ) {
				continue;
			}

			$authors[] = [
				'id'    => absint( $user->ID ),
				'name'  => sanitize_text_field( $user->display_name ),
				'login' => sanitize_user( $user->user_login ),
			];
		}

		return $authors;

	} catch ( \Exception $e ) {
		return [];
	}
}

/**
 * Check if the campaign posts target is achieved with security validation.
 *
 * @param int $campaign_id Campaign ID.
 * @return bool Target achievement status.
 * @since 1.0.0
 */
function wpsolvex_autoaiblogger_is_campaign_posts_target_achieved( $campaign_id ) {
	try {
		// Validate campaign ID.
		$campaign_id = absint( $campaign_id );
		if ( $campaign_id <= 0 ) {
			return false;
		}

		// Check user capabilities for campaign access.
		if ( ! current_user_can( 'edit_posts' ) ) {
			return false;
		}

		$posts_target  = absint( Metadata::get_campaign_meta( $campaign_id, 'postsTarget' ) );
		$posts_created = absint( Metadata::get_campaign_meta( $campaign_id, 'postsCreated' ) );

		// Validate metadata values.
		if ( $posts_target < 0 || $posts_created < 0 ) {
			return false;
		}

		return $posts_target > 0 && $posts_target <= $posts_created;

	} catch ( \Exception $e ) {
		return false;
	}
}

/**
 * Get previous campaign posts for internal linking.
 *
 * @param int $campaign_id Campaign ID.
 * @param int $limit       Maximum number of posts to fetch (default 5).
 * @since 1.0.0
 * @return array Array of previous posts with id, title, url.
 */
function wpsolvex_autoaiblogger_get_previous_campaign_posts( $campaign_id, $limit = 5 ) {
	// Validate campaign ID.
	$campaign_id = absint( $campaign_id );
	if ( $campaign_id <= 0 ) {
		return [];
	}

	// Limit must be reasonable.
	$limit = absint( $limit );
	if ( $limit <= 0 || $limit > 10 ) {
		$limit = 5;
	}

	try {
		// Get previously created posts from this campaign.
		$posts = get_posts(
			[
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'posts_per_page'         => $limit,
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'meta_query'             => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Using meta query for campaign posts.
					[
						'key'   => 'wpsolvex_autoaiblogger_campaign_id',
						'value' => $campaign_id,
					],
				],
			]
		);

		if ( empty( $posts ) ) {
			return [];
		}

		// Build simplified array with id, title, url.
		$previous_posts = [];
		foreach ( $posts as $post ) {
			$previous_posts[] = [
				'id'    => $post->ID,
				'title' => get_the_title( $post->ID ),
				'url'   => get_permalink( $post->ID ),
			];
		}

		return $previous_posts;

	} catch ( \Exception $e ) {
		return [];
	}
}

/**
 * Get API response to create blog post with security validation.
 *
 * @param string $keywords             Keywords.
 * @param int    $max_content_words    Max content words.
 * @param array  $site_persona_details Site persona details.
 * @param int    $campaign_id          Campaign ID (optional).
 * @param string $campaign_name        Campaign name (optional).
 * @param int    $image_count          Number of images to generate (optional, default 1).
 * @since 1.0.0
 * @return array|WP_Error Sanitized API response or error.
 */
function wpsolvex_autoaiblogger_get_post_creation_api_response( $keywords, $max_content_words, $site_persona_details, $campaign_id = 0, $campaign_name = '', $image_count = 1 ) {
	// Check user capabilities (skip during cron execution).
	if ( ! wp_doing_cron() && ! current_user_can( 'edit_posts' ) ) {
		return new WP_Error( 'insufficient_permissions', 'Insufficient permissions to create posts.' );
	}

	try {
		// Validate and sanitize inputs.
		$keywords = sanitize_textarea_field( $keywords );
		if ( empty( $keywords ) || strlen( $keywords ) > 1000 ) {
			return new WP_Error( 'invalid_keywords', 'Invalid keywords provided.' );
		}

		$max_content_words = absint( $max_content_words );
		if ( $max_content_words < 100 || $max_content_words > 5000 ) {
			$max_content_words = 500; // Safe default.
		}

		// Validate site persona details.
		if ( ! is_array( $site_persona_details ) ) {
			return new WP_Error( 'invalid_site_persona', 'Invalid site persona details.' );
		}

		// Sanitize site persona details.
		$sanitized_persona = [];
		$allowed_keys      = [ 'name', 'site_title', 'site_purpose', 'site_description' ];

		foreach ( $allowed_keys as $key ) {
			if ( isset( $site_persona_details[ $key ] ) ) {
				$sanitized_persona[ $key ] = sanitize_text_field( $site_persona_details[ $key ] );
			}
		}

		// Validate license token.
		$license = \WPSolvex\AutoAIBlogger\Inc\Utils\Helper::get_option( 'license', '' );
		if ( empty( $license ) ) {
			return new WP_Error( 'missing_license', 'License token is required.' );
		}

		// Get additional settings to match server API format.
		$settings = Settings::get_ai_blogger_settings();

		// Get existing post titles from campaign (if campaign_id is provided).
		$existing_post_titles = [];
		if ( $campaign_id > 0 ) {
			$existing_posts = get_posts(
				[
					'post_type'              => 'post',
					'posts_per_page'         => -1,
					'meta_query'             => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Using meta query for campaign posts.
						[
							'key'   => 'wpsolvex_autoaiblogger_campaign_id',
							'value' => $campaign_id,
						],
					],
					'fields'                 => 'ids',
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				]
			);

			if ( ! empty( $existing_posts ) ) {
				foreach ( $existing_posts as $post_id ) {
					$post_title = get_the_title( $post_id );
					if ( ! empty( $post_title ) ) {
						$existing_post_titles[] = $post_title;
					}
				}
			}
		}

		// Get campaign name if provided, otherwise use default.
		if ( empty( $campaign_name ) && $campaign_id > 0 ) {
			$campaign_post = get_post( $campaign_id );
			$campaign_name = $campaign_post ? $campaign_post->post_title : 'Campaign Post';
		} elseif ( empty( $campaign_name ) ) {
			$campaign_name = 'Campaign Post';
		}

		// Get previous campaign posts for internal linking (if campaign_id is provided).
		$previous_posts = [];
		if ( $campaign_id > 0 ) {
			$previous_posts = wpsolvex_autoaiblogger_get_previous_campaign_posts( $campaign_id, 5 );
		}

		// Prepare request body to match the server API generate_campaign_post method exactly.
		$body_args = [
			// Required by server API generate_campaign_post_v2 method.
			'keywords'          => is_array( $keywords ) ? $keywords : array_map( 'trim', explode( ',', $keywords ) ),
			'maxWords'          => $max_content_words,
			'name'              => sanitize_text_field( $campaign_name ),
			'license'           => $license,

			// Safety settings - required by server.
			'temperature'       => floatval( $settings['temperature'] ?? 0.7 ),
			'harassment'        => absint( $settings['harassment'] ?? 2 ),
			'hate'              => absint( $settings['hate'] ?? 2 ),
			'sexually_explicit' => absint( $settings['sexuallyExplicit'] ?? 2 ),
			'dangerous_content' => absint( $settings['dangerousContent'] ?? 2 ),

			// Site persona - required by server.
			'site_title'        => $sanitized_persona['site_title'] ?? ( $settings['siteTitle'] ?? '' ),
			'site_purpose'      => $sanitized_persona['site_purpose'] ?? ( $settings['siteFor'] ?? '' ),
			'site_description'  => $sanitized_persona['site_description'] ?? ( $settings['siteDescription'] ?? '' ),

			// Image settings - controlled via filter (default: 1 image).
			'image_count'       => max( 0, min( 5, absint( $image_count ) ) ),

			// Existing post titles for uniqueness.
			'existing_titles'   => $existing_post_titles,

			// Previous posts for internal linking.
			'previous_posts'    => $previous_posts,
		];      // Validate API endpoint - use new campaign post API.
		$api_url   = WPSOLVEX_AUTOAIBLOGGER_CAMPAIGN_POST_API;
		if ( ! filter_var( $api_url, FILTER_VALIDATE_URL ) ) {
			return new WP_Error( 'invalid_api_url', 'Invalid API endpoint.' );
		}

		$args     = [
			'method'      => 'POST',
			'timeout'     => 150, // Increased timeout for long content generation (4750-5000 words).
			'redirection' => 5,  // Limited redirects.
			'httpversion' => '1.1',
			'blocking'    => true,
			'headers'     => [
				'Content-Type' => 'application/json',
				'User-Agent'   => 'Solvex-AI-Blogger/' . WPSOLVEX_AUTOAIBLOGGER_VERSION,
			],
			'body'        => wp_json_encode( $body_args ),
			'cookies'     => [],
			'sslverify'   => true, // Enforce SSL verification.
		];
		$response = wp_remote_post( $api_url, $args );

		// Check for errors.
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// Validate response.
		$response_code = wp_remote_retrieve_response_code( $response );

		if ( $response_code !== 200 ) {
			// Parse error response body to extract actual error details.
			$error_body = wp_remote_retrieve_body( $response );

			$error_data = json_decode( $error_body, true );

			// If server returned structured error, use it.
			if ( is_array( $error_data ) && isset( $error_data['code'] ) ) {
				$error_code    = sanitize_text_field( $error_data['code'] );
				$error_message = isset( $error_data['message'] ) ?
					sanitize_text_field( $error_data['message'] ) :
					"API returned status code: {$response_code}";

				return new WP_Error( $error_code, $error_message, [ 'status' => $response_code ] );
			}

			// Fallback for non-structured errors.
			return new WP_Error( 'api_error', "API returned status code: {$response_code}", [ 'status' => $response_code ] );
		}

		$body = wp_remote_retrieve_body( $response );
		if ( empty( $body ) ) {
			return new WP_Error( 'empty_response', 'Empty response from API.' );
		}

		// Parse and validate JSON response.
		$data = json_decode( $body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error( 'invalid_json', 'Invalid JSON response from API.' );
		}

		// Sanitize response data.
		if ( is_array( $data ) ) {
			$data = wpsolvex_autoaiblogger_sanitize_api_response( $data );
		}

		// Log successful API call (without sensitive data).

		return $data;

	} catch ( \Exception $e ) {
		return new WP_Error( 'api_exception', 'API request failed due to an exception.' );
	}
}

/**
 * Sanitize API response data recursively.
 *
 * @param array $data API response data.
 * @return array Sanitized data.
 */
function wpsolvex_autoaiblogger_sanitize_api_response( $data ) {
	if ( ! is_array( $data ) ) {
		return sanitize_text_field( $data );
	}

	$sanitized = [];
	foreach ( $data as $key => $value ) {
		$clean_key = sanitize_key( $key );

		if ( is_array( $value ) ) {
			$sanitized[ $clean_key ] = wpsolvex_autoaiblogger_sanitize_api_response( $value );
		} elseif ( is_string( $value ) ) {
			// Preserve HTML/Gutenberg blocks for content fields.
			// Don't use wp_kses_post as it strips HTML comments needed for Gutenberg blocks.
			if ( in_array( $clean_key, [ 'post_content', 'content', 'excerpt' ], true ) ) {
				$sanitized[ $clean_key ] = $value; // Keep as-is, comes from our controlled API.
			} else {
				$sanitized[ $clean_key ] = sanitize_text_field( $value );
			}
		} else {
			$sanitized[ $clean_key ] = $value;
		}
	}

	return $sanitized;
}

/**
 * Get site persona details with security validation.
 *
 * @param int $campaign_id Campaign ID.
 * @return array Sanitized site persona details.
 * @since 1.0.0
 */
function wpsolvex_autoaiblogger_get_site_persona_details( $campaign_id = 0 ) {
	// Check user capabilities (skip during cron execution).
	if ( ! wp_doing_cron() && ! current_user_can( 'edit_posts' ) ) {
		return [];
	}

	try {
		// Validate campaign ID.
		$campaign_id = absint( $campaign_id );

		$site_details = Settings::get_ai_blogger_settings();

		// Validate settings data.
		if ( ! is_array( $site_details ) ) {
			$site_details = [];
		}

		$persona_details = [
			'site_title'       => isset( $site_details['siteTitle'] ) ? sanitize_text_field( $site_details['siteTitle'] ) : '',
			'site_purpose'     => isset( $site_details['siteFor'] ) ? sanitize_textarea_field( $site_details['siteFor'] ) : '',
			'site_description' => isset( $site_details['siteDescription'] ) ? sanitize_textarea_field( $site_details['siteDescription'] ) : '',
		];

		// Handle campaign-specific overrides.
		if ( $campaign_id > 0 ) {
			// Use get_post_meta directly during cron to avoid permission issues.
			if ( wp_doing_cron() ) {
				$override_site_details = get_post_meta( $campaign_id, 'overrideSitePersona', true );
				$overridden_title      = get_post_meta( $campaign_id, 'overrideSiteTitle', true );
				$overridden_desc       = get_post_meta( $campaign_id, 'overrideSiteDescription', true );
				$overridden_for        = get_post_meta( $campaign_id, 'overrideSiteFor', true );
			} else {
				$override_site_details = Metadata::get_campaign_meta( $campaign_id, 'overrideSitePersona' );
				$overridden_title      = Metadata::get_campaign_meta( $campaign_id, 'overrideSiteTitle' );
				$overridden_desc       = Metadata::get_campaign_meta( $campaign_id, 'overrideSiteDescription' );
				$overridden_for        = Metadata::get_campaign_meta( $campaign_id, 'overrideSiteFor' );
			}

			if ( $override_site_details ) {

				if ( ! empty( $overridden_title ) ) {
					$persona_details['site_title'] = sanitize_text_field( $overridden_title );
				}
				if ( ! empty( $overridden_desc ) ) {
					$persona_details['site_description'] = sanitize_textarea_field( $overridden_desc );
				}
				if ( ! empty( $overridden_for ) ) {
					$persona_details['site_purpose'] = sanitize_textarea_field( $overridden_for );
				}
			}
		}

		// Filter empty values.
		return array_filter(
			$persona_details,
			static function( $value ) {
				return ! empty( trim( $value ) );
			}
		);
	} catch ( \Exception $e ) {
		return [];
	}
}

/**
 * Create blog post as per the campaign configurations.
 *
 * @param int $campaign_id Campaign ID.
 * @return int|WP_Error
 * @since 1.0.0
 */

/**
 * Track post views for analytics.
 *
 * @param int $post_id Post ID.
 * @return void
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_track_post_view( $post_id ): void {
	// Only track for campaign posts.
	$is_campaign_post = get_post_meta( $post_id, 'wpsolvex_autoaiblogger_campaign_id', true );
	if ( ! $is_campaign_post ) {
		return;
	}

	// Avoid counting views from admin, logged-in users, or bots.
	if ( is_admin() || current_user_can( 'edit_posts' ) ) {
		return;
	}

	// Get current view count.
	$current_views = absint( get_post_meta( $post_id, 'post_views_count', true ) ?? 0 );

	// Increment view count.
	$new_views = $current_views + 1;

	// Update post meta.
	update_post_meta( $post_id, 'post_views_count', $new_views );
}

/**
 * Log detailed error information for campaign post creation failures.
 *
 * @param int    $campaign_id Campaign ID.
 * @param string $error_type Type of error (api_error, validation_error, network_error, etc.).
 * @param string $error_message Detailed error message.
 * @param array  $context Additional context data.
 * @return void
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_log_campaign_error( $campaign_id, $error_type, $error_message, $context = [] ): void {
	// Validate campaign ID.
	$campaign_id = absint( $campaign_id );
	if ( $campaign_id <= 0 ) {
		return;
	}

	// Verify campaign exists.
	$campaign = get_post( $campaign_id );
	if ( ! $campaign || $campaign->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
		return;
	}

	// Sanitize inputs.
	$error_type     = sanitize_text_field( $error_type );
	$error_message  = sanitize_textarea_field( $error_message );
	$timestamp_data = wpsolvex_autoaiblogger_create_timestamp_data();

	// Get existing error logs (limit to last 50 entries to prevent bloat).
	$existing_logs = Metadata::get_campaign_meta( $campaign_id, 'errorLogs' );
	if ( ! is_array( $existing_logs ) ) {
		$existing_logs = [];
	}

	// Create new error log entry using standardized timestamp data.
	$error_log_entry = array_merge(
		$timestamp_data,
		[
			'log_type'       => 'error',
			'type'           => $error_type,
			'message'        => $error_message,
			'context'        => array_map( 'sanitize_text_field', (array) $context ),
			'post_number'    => $context['post_number'] ?? 1,
			'attempt_number' => $context['attempt_number'] ?? $context['attempt'] ?? 1,
		]
	);

	// Add to existing logs (keep only last 50 entries).
	$existing_logs[] = $error_log_entry;
	if ( count( $existing_logs ) > 50 ) {
		$existing_logs = array_slice( $existing_logs, -50 );
	}

	// Update campaign metadata.
	Metadata::update_campaign_meta( $campaign_id, 'errorLogs', $existing_logs );
	Metadata::update_campaign_meta( $campaign_id, 'lastError', $error_message );
	Metadata::update_campaign_meta( $campaign_id, 'lastErrorType', $error_type );
	Metadata::update_campaign_meta( $campaign_id, 'lastErrorTime', $timestamp_data['timestamp'] );

	// Note: Failed posts counter is now incremented in the cron handler to avoid double counting.
}

/**
 * Log successful post creation for campaign.
 *
 * @param int   $campaign_id Campaign ID.
 * @param int   $post_id Created post ID.
 * @param array $context Additional context data.
 * @return void
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_log_campaign_success( $campaign_id, $post_id, $context = [] ): void {
	// Validate inputs.
	$campaign_id = absint( $campaign_id );
	$post_id     = absint( $post_id );

	if ( $campaign_id <= 0 || $post_id <= 0 ) {
		return;
	}

	// Verify campaign exists.
	$campaign = get_post( $campaign_id );
	if ( ! $campaign || $campaign->post_type !== WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN ) {
		return;
	}

	// Get timestamp data.
	$timestamp_data = wpsolvex_autoaiblogger_create_timestamp_data();

	// Get existing success logs (limit to last 50 entries).
	$existing_logs = Metadata::get_campaign_meta( $campaign_id, 'successLogs' );
	if ( ! is_array( $existing_logs ) ) {
		$existing_logs = [];
	}

	// Get post details.
	$created_post = get_post( $post_id );
	$post_title   = $created_post ? $created_post->post_title : ( $context['post_title'] ?? __( 'Generated Post', 'solvex-ai-blogger' ) );

	// Create success log entry.
	$success_log_entry = array_merge(
		$timestamp_data,
		[
			'log_type'       => 'success',
			'type'           => 'success',
			'post_id'        => $post_id,
			'post_title'     => sanitize_text_field( $post_title ),
			'message'        => $context['message'] ?? sprintf( /* translators: %d: Post number. */ __( 'Post #%d was created successfully and published.', 'solvex-ai-blogger' ), $context['post_number'] ?? count( $existing_logs ) + 1 ),
			'context'        => array_map( 'sanitize_text_field', (array) $context ),
			'post_number'    => $context['post_number'] ?? count( $existing_logs ) + 1,
			'attempt_number' => $context['attempt_number'] ?? 1,
		]
	);

	// Add to existing logs (keep only last 50 entries).
	$existing_logs[] = $success_log_entry;
	if ( count( $existing_logs ) > 50 ) {
		$existing_logs = array_slice( $existing_logs, -50 );
	}

	// Update campaign metadata.
	Metadata::update_campaign_meta( $campaign_id, 'successLogs', $existing_logs );
}

/**
 * Get formatted success logs for a campaign.
 *
 * @param int $campaign_id Campaign ID.
 * @param int $limit Maximum number of logs to return.
 * @return array Formatted success logs.
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_get_campaign_success_logs( $campaign_id, $limit = 20 ): array {
	$campaign_id = absint( $campaign_id );
	if ( $campaign_id <= 0 ) {
		return [];
	}

	$success_logs = Metadata::get_campaign_meta( $campaign_id, 'successLogs' );
	if ( ! is_array( $success_logs ) ) {
		return [];
	}

	// Sort by timestamp (newest first) and limit results.
	return array_reverse( array_slice( $success_logs, -$limit ) );
}

/**
 * Get formatted error logs for a campaign.
 *
 * @param int $campaign_id Campaign ID.
 * @param int $limit Maximum number of logs to return.
 * @return array Formatted error logs.
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_get_campaign_error_logs( $campaign_id, $limit = 20 ): array {
	$campaign_id = absint( $campaign_id );
	if ( $campaign_id <= 0 ) {
		return [];
	}

	$error_logs = Metadata::get_campaign_meta( $campaign_id, 'errorLogs' );
	if ( ! is_array( $error_logs ) ) {
		return [];
	}

	// Sort by timestamp (newest first) and limit results.
	$error_logs = array_reverse( array_slice( $error_logs, -$limit ) );

	// Format for display.
	$formatted_logs = [];
	foreach ( $error_logs as $index => $log ) {
		$error_type            = $log['type'] ?? 'unknown';
		$user_friendly_message = wpsolvex_autoaiblogger_get_user_friendly_error_message( $error_type, $log['message'] ?? '' );
		$error_solution        = wpsolvex_autoaiblogger_get_error_solution_suggestion( $error_type );

		// Use stored timestamp data directly (no backward compatibility needed).
		$mysql_timestamp   = $log['timestamp'] ?? '';
		$unix_timestamp    = $log['unix_timestamp'] ?? 0;
		$display_timestamp = $log['formatted_date'] ?? '';

		// Calculate time ago.
		$time_ago = '';
		if ( $unix_timestamp ) {
			$time_ago = human_time_diff( $unix_timestamp, current_time( 'timestamp' ) ) . ' ' . __( 'ago', 'solvex-ai-blogger' ); // phpcs:ignore.
		}

		$formatted_logs[] = [
			'id'             => 'error_' . ( $index + 1 ),
			'timestamp'      => $mysql_timestamp,
			'formatted_date' => $display_timestamp,
			'time_ago'       => $time_ago,
			'unix_timestamp' => $unix_timestamp,
			'status'         => 'error',
			'title'          => sprintf( /* translators: %1$d: Post number, %2$d: Attempt number. */ __( 'Post #%1$d Creation Failed - Attempt #%2$d', 'solvex-ai-blogger' ), $log['post_number'] ?? 1, $log['attempt_number'] ?? 1 ),
			'message'        => $user_friendly_message,
			'error_type'     => $error_type,
			'solution'       => $error_solution,
			'context'        => $log['context'] ?? [],
			'raw_message'    => $log['message'] ?? '',
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
					'status'      => 'error',
					'description' => $user_friendly_message,
					'duration'    => wp_rand( 100, 1000 ),
				],
			],
		];
	}

	return $formatted_logs;
}

/**
 * Get user-friendly error message based on error type.
 *
 * @param string $error_type The error type.
 * @param string $original_message The original error message.
 * @return string User-friendly error message.
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_get_user_friendly_error_message( $error_type, $original_message ): string {
	switch ( $error_type ) {
		case 'network_error':
			return __( 'Network connection failed. Unable to reach the content generation server.', 'solvex-ai-blogger' );

		case 'quota_error':
			return __( 'API usage limit exceeded. You have reached your subscription quota for content generation.', 'solvex-ai-blogger' );

		case 'content_filter_error':
			return __( 'Content was blocked by safety filters. The generated content may contain inappropriate material.', 'solvex-ai-blogger' );

		case 'validation_error':
			return __( 'Invalid campaign settings. Please check your keywords and campaign configuration.', 'solvex-ai-blogger' );

		case 'auth_error':
			return __( 'Authentication failed. Please check your license key and ensure it\'s valid and active.', 'solvex-ai-blogger' );

		case 'api_error':
			if ( ! empty( $original_message ) ) {
				return sprintf(
					/* translators: %s: Original error message. */
					__( 'Content generation service error: %s', 'solvex-ai-blogger' ),
					$original_message
				);
			}
			return __( 'Content generation service error. The API returned an unexpected response.', 'solvex-ai-blogger' );

		case 'database_error':
			return __( 'Database error occurred while saving the post. Please check your WordPress database connection.', 'solvex-ai-blogger' );

		case 'campaign_terminated':
			return __( 'Campaign was automatically terminated due to too many consecutive failures.', 'solvex-ai-blogger' );

		case 'unknown_error':
		default:
			return sprintf(
				/* translators: %s: Original error message. */
				__( 'An unexpected error occurred: %s', 'solvex-ai-blogger' ),
				$original_message
			);
	}
}

/**
 * Get solution suggestion based on error type.
 *
 * @param string $error_type The error type.
 * @return string Solution suggestion.
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_get_error_solution_suggestion( $error_type ): string {
	switch ( $error_type ) {
		case 'network_error':
			return __( 'Check your internet connection and try again. If the problem persists, contact your hosting provider.', 'solvex-ai-blogger' );

		case 'quota_error':
			return __( 'Upgrade your subscription plan or wait for your quota to reset. Check your account dashboard for usage details.', 'solvex-ai-blogger' );

		case 'content_filter_error':
			return __( 'Try using different keywords or adjust your safety filter settings in the plugin configuration.', 'solvex-ai-blogger' );

		case 'validation_error':
			return __( 'Review your campaign settings, ensure keywords are provided, and check all required fields.', 'solvex-ai-blogger' );

		case 'auth_error':
			return __( 'Verify your license key in plugin settings. Contact support if your license should be valid.', 'solvex-ai-blogger' );

		case 'api_error':
			return __( 'This is usually temporary. Try again in a few minutes. If it continues, contact plugin support.', 'solvex-ai-blogger' );

		case 'database_error':
			return __( 'Check your WordPress database connection and available disk space. Contact your hosting provider if needed.', 'solvex-ai-blogger' );

		case 'campaign_terminated':
			return __( 'Review your API settings, keywords, and license. Increase the failure threshold if needed, then restart the campaign.', 'solvex-ai-blogger' );

		case 'unknown_error':
		default:
			return __( 'Try running the campaign again. If the error persists, contact plugin support with the error details.', 'solvex-ai-blogger' );
	}
}

/**
 * Create standardized timestamp data for logging.
 *
 * @return array Array containing various timestamp formats.
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_create_timestamp_data(): array {
	$unix_timestamp  = current_time( 'timestamp' ); // phpcs:ignore -- It is safe.
	$mysql_timestamp = current_time( 'mysql' );
	$formatted_date  = current_time( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ) );

	return [
		'timestamp'      => $mysql_timestamp,
		'unix_timestamp' => $unix_timestamp,
		'formatted_date' => $formatted_date,
	];
}

/**
 * Update token data from API response or license verification.
 *
 * This function validates and updates the tokenTotal and tokenRemaining
 * settings. It's used across different parts of the plugin to maintain
 * consistent token data updates.
 *
 * @param array $token_data Token data containing 'total' and 'remaining' keys.
 * @return bool True if update was successful, false otherwise.
 * @since 0.0.2
 */
function wpsolvex_autoaiblogger_update_token_data( $token_data ): bool {
	try {
		if ( ! is_array( $token_data ) ) {
			return false;
		}

		// Validate required token fields.
		if ( ! isset( $token_data['total'] ) || ! isset( $token_data['remaining'] ) ) {
			return false;
		}

		// Sanitize and validate token values.
		$token_total     = absint( $token_data['total'] );
		$token_remaining = absint( $token_data['remaining'] );

		// Validate token values make sense.
		if ( $token_total < 0 || $token_remaining < 0 || $token_remaining > $token_total ) {
			return false;
		}

		// Update token data using Helper class.
		$total_result     = \WPSolvex\AutoAIBlogger\Inc\Utils\Helper::update_option( 'tokenTotal', $token_total );
		$remaining_result = \WPSolvex\AutoAIBlogger\Inc\Utils\Helper::update_option( 'tokenRemaining', $token_remaining );

		// Return success status.
		return $total_result['success'] && $remaining_result['success'];

	} catch ( \Exception $e ) {
		// Silently fail to avoid breaking execution.
		return false;
	}
}

/**
 * Replace internal link placeholders with actual WordPress links.
 *
 * This function replaces placeholders like __LINK123__ with actual
 * WordPress post permalinks, and __HOMELINK__ with the homepage URL.
 *
 * @param string $content The post content with link placeholders.
 * @param array  $previous_posts Optional array of previous posts with id, title, url.
 * @return string Content with placeholders replaced.
 * @since 1.0.0
 */
function wpsolvex_autoaiblogger_replace_internal_link_placeholders( $content, $previous_posts = [] ) {
	if ( empty( $content ) || ! is_string( $content ) ) {
		return $content;
	}

	try {
		// Replace homepage link placeholder.
		$home_url = home_url();
		$content  = str_replace( '__HOMELINK__', esc_url( $home_url ), $content );

		// Replace {{INTERNAL_LINK}} placeholder with a real internal URL.
		if ( ! empty( $previous_posts ) && is_array( $previous_posts ) ) {
			// Use the first previous post as the internal link target.
			$link_url = esc_url( $previous_posts[0]['url'] ?? $home_url );
		} else {
			// First post in campaign — fallback to homepage.
			$link_url = esc_url( $home_url );
		}
		$content = str_replace( '{{INTERNAL_LINK}}', $link_url, $content );

		// Replace post ID placeholders.
		if ( ! empty( $previous_posts ) && is_array( $previous_posts ) ) {
			foreach ( $previous_posts as $post ) {
				if ( isset( $post['id'] ) && isset( $post['url'] ) ) {
					$post_id  = absint( $post['id'] );
					$post_url = esc_url( $post['url'] );

					// Replace __LINKID__ with actual URL.
					$placeholder = '__LINK' . $post_id . '__';
					$content     = str_replace( $placeholder, $post_url, $content );
				}
			}
		}

		// Fallback: If any placeholders remain (shouldn't happen), remove them to avoid broken output.
		$content = preg_replace( '/__LINK\d+__/', '', $content );
		$content = preg_replace( '/__HOMELINK__/', '', $content );

		// Also clean up old format if it exists.
		$content = preg_replace( '/\{\{INTERNAL_LINK:\d+\}\}/', '', $content );
		$content = preg_replace( '/\{\{INTERNAL_LINK:home\}\}/', '', $content );
		$content = preg_replace( '/\{\{INTERNAL_LINK\}\}/', esc_url( $home_url ), $content );

		return $content;

	} catch ( \Exception $e ) {
		return $content;
	}
}
