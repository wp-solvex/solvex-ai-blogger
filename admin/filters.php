<?php
/**
 * Admin Filters.
 *
 * @package solvex-ai-blogger
 * @since 0.0.2
 */

namespace WPSolvex\AutoAIBlogger\Admin;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;
use WPSolvex\AutoAIBlogger\Inc\Utils\Sanitizer;

defined( 'ABSPATH' ) || exit;

/**
 * This class handles admin filters for posts
 *
 * @class Filters
 */
class Filters {
	use Get_Instance;

	/**
	 * Constructor
	 *
	 * @since 0.0.2
	 */
	public function __construct() {
		add_action( 'restrict_manage_posts', [ $this, 'add_campaign_filter' ] );
		add_filter( 'parse_query', [ $this, 'filter_posts_by_campaign' ] );

		// Add column hooks dynamically for supported post types.
		$this->add_column_hooks();
	}

	/**
	 * Add campaign filter dropdown to posts admin page.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function add_campaign_filter(): void {
		global $typenow;

		// Check if we're on a supported post type page.
		$current_post_type = $typenow;

		if ( empty( $current_post_type ) && isset( $_GET['post_type'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not required as it's in admin.
			$current_post_type = sanitize_text_field( wp_unslash( $_GET['post_type'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not required as it's in admin.
		}
		if ( empty( $current_post_type ) ) {
			$current_post_type = 'post'; // Default to post if no post_type is specified.
		}

		// Check if current post type is supported by the plugin.
		$supported_post_types = Sanitizer::get_sanitized_post_types();

		if ( ! isset( $supported_post_types[ $current_post_type ] ) ) {
			return;
		}

		$campaigns         = wpsolvex_autoaiblogger_get_all_campaigns();
		$selected_campaign = isset( $_GET['wpsolvex_autoaiblogger_campaign_id'] ) ? absint( $_GET['wpsolvex_autoaiblogger_campaign_id'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not required as handled by absint().

		if ( ! empty( $campaigns ) ) {
			echo '<select name="wpsolvex_autoaiblogger_campaign_id">';
			echo '<option value="">' . esc_html__( 'All Campaigns', 'solvex-ai-blogger' ) . '</option>';

			foreach ( $campaigns as $campaign_id => $campaign_data ) {
				$selected = selected( $selected_campaign, $campaign_id, false );
				echo '<option value="' . esc_attr( $campaign_id ) . '"' . esc_attr( $selected ) . '>' . esc_html( $campaign_data['name'] ) . '</option>';
			}

			echo '</select>';
		}
	}

	/**
	 * Filter posts by campaign when campaign filter is applied.
	 *
	 * @param \WP_Query $query The WP_Query instance.
	 * @since 0.0.2
	 * @return \WP_Query $query The WP_Query instance.
	 */
	public function filter_posts_by_campaign( $query ) {
		global $pagenow, $typenow;

		if ( ! is_admin() || $pagenow !== 'edit.php' || ! $query->is_main_query() ) {
			return $query;
		}

		// Check if we're filtering a supported post type.
		$current_post_type = $typenow;
		if ( empty( $current_post_type ) && ! empty( $_GET['post_type'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not required as it's in admin.
			$current_post_type = sanitize_text_field( wp_unslash( $_GET['post_type'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not required as it's in admin.
		}
		if ( empty( $current_post_type ) ) {
			$current_post_type = 'post'; // Default to post if no post_type is specified.
		}

		// Check if current post type is supported by the plugin.
		$supported_post_types = Sanitizer::get_sanitized_post_types();
		if ( ! isset( $supported_post_types[ $current_post_type ] ) ) {
			return $query;
		}

		if ( ! isset( $_GET['wpsolvex_autoaiblogger_campaign_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not required as handled by absint().
			return $query;
		}

		$campaign_id = absint( $_GET['wpsolvex_autoaiblogger_campaign_id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not required as handled by absint().

		if ( $campaign_id ) {
			$meta_query = $query->get( 'meta_query' );
			if ( ! is_array( $meta_query ) ) {
				$meta_query = [];
			}

			$meta_query[] = [
				'key'     => 'wpsolvex_autoaiblogger_campaign_id',
				'value'   => $campaign_id,
				'compare' => '=',
			];

			$query->set( 'meta_query', $meta_query );
		}

		return $query;
	}

	/**
	 * Add campaign column to posts admin page.
	 *
	 * @param array<string, string> $columns Existing columns.
	 * @since 0.0.2
	 * @return array<string, string> Modified columns.
	 */
	public function add_campaign_column( $columns ) {
		// Since we're already filtering by post type in the hook registration,.
		// we can directly add the column.
		$columns['wpsolvex_autoaiblogger_campaign'] = __( 'Campaign', 'solvex-ai-blogger' );
		return $columns;
	}

	/**
	 * Show campaign column content.
	 *
	 * @param string $column  Column name.
	 * @param int    $post_id Post ID.
	 * @since 0.0.2
	 * @return void
	 */
	public function show_campaign_column_content( $column, $post_id ): void {
		if ( $column === 'wpsolvex_autoaiblogger_campaign' ) {
			$campaign_id = absint( get_post_meta( $post_id, 'wpsolvex_autoaiblogger_campaign_id', true ) ?? 0 );

			if ( $campaign_id ) {
				$campaign_title = get_the_title( $campaign_id );
				if ( $campaign_title ) {
					// Get the post type of the current post to create the correct filter URL.
					$post_type  = get_post_type( $post_id );
					$filter_url = admin_url( 'edit.php' );

					// Add post_type parameter if it's not 'post'.
					if ( $post_type !== 'post' ) {
						$filter_url = add_query_arg( 'post_type', $post_type, $filter_url );
					}

					// Add the campaign filter.
					$filter_url = add_query_arg( 'wpsolvex_autoaiblogger_campaign_id', $campaign_id, $filter_url );

					echo '<a href="' . esc_url( $filter_url ) . '">' . esc_html( $campaign_title ) . '</a>';
				} else {
					echo '<span class="na">—</span>';
				}
			} else {
				echo '<span class="na">—</span>';
			}
		}
	}

	/**
	 * Add column hooks for supported post types.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	private function add_column_hooks(): void {
		$supported_post_types = Sanitizer::get_sanitized_post_types();

		foreach ( $supported_post_types as $post_type ) {
			// Add column to each supported post type.
			add_filter( "manage_{$post_type}_posts_columns", [ $this, 'add_campaign_column' ] );
			add_action( "manage_{$post_type}_posts_custom_column", [ $this, 'show_campaign_column_content' ], 10, 2 );
		}
	}
}
