<?php
/**
 * Frontend.
 *
 * @package solvex-ai-blogger
 * @since 0.0.2
 */

namespace WPSolvex\AutoAIBlogger\Core;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;

defined( 'ABSPATH' ) || exit;

/**
 * This class handles admin filters for posts
 *
 * @class Frontend
 */
class Frontend {
	use Get_Instance;

	/**
	 * Constructor
	 *
	 * @since 0.0.2
	 */
	public function __construct() {
		// Hook into the_content to track views when posts are displayed.
		add_action( 'wp_head', [ $this, 'track_post_views' ] );
	}

	/**
	 * Track post views.
	 *
	 * @return void
	 * @since 0.0.2
	 */
	public function track_post_views(): void {
		if ( is_singular() ) {
			global $post;
			if ( $post ) {
				wpsolvex_autoaiblogger_track_post_view( $post->ID );
			}
		}
	}
}
