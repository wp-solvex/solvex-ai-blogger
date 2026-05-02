<?php
/**
 * Sanitizer.
 *
 * @package solvex-ai-blogger
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * This class will holds the code to sanitize data.
 *
 * @class Sanitizer
 */
class Sanitizer {
	/**
	 * Gets sanitized post statuses
	 *
	 * @since 1.0.0
	 * @return array Sanitized post statuses
	 */
	public static function get_sanitized_post_statuses(): array {
		$statuses = wpsolvex_autoaiblogger_get_post_statuses();
		if ( ! is_array( $statuses ) ) {
			return [];
		}

		$sanitized = [];
		foreach ( $statuses as $key => $label ) {
			$sanitized[ sanitize_key( $key ) ] = sanitize_text_field( $label );
		}

		return $sanitized;
	}

	/**
	 * Gets sanitized categories
	 *
	 * @since 1.0.0
	 * @return array Sanitized categories
	 */
	public static function get_sanitized_categories(): array {
		$categories = wpsolvex_autoaiblogger_get_categories();
		if ( ! is_array( $categories ) ) {
			return [];
		}

		$sanitized = [];
		foreach ( $categories as $category ) {
			if ( isset( $category['id'], $category['name'] ) ) {
				$sanitized[] = [
					'id'   => absint( $category['id'] ),
					'name' => sanitize_text_field( $category['name'] ),
				];
			}
		}

		return $sanitized;
	}

	/**
	 * Gets sanitized tags
	 *
	 * @since 1.0.0
	 * @return array Sanitized tags
	 */
	public static function get_sanitized_tags(): array {
		$tags = wpsolvex_autoaiblogger_get_tags();
		if ( ! is_array( $tags ) ) {
			return [];
		}

		$sanitized = [];
		foreach ( $tags as $tag ) {
			if ( isset( $tag['id'], $tag['name'] ) ) {
				$sanitized[] = [
					'id'   => absint( $tag['id'] ),
					'name' => sanitize_text_field( $tag['name'] ),
				];
			}
		}

		return $sanitized;
	}

	/**
	 * Gets sanitized authors
	 *
	 * @since 1.0.0
	 * @return array Sanitized authors
	 */
	public static function get_sanitized_authors(): array {
		$authors = wpsolvex_autoaiblogger_get_authors();
		if ( ! is_array( $authors ) ) {
			return [];
		}

		$sanitized = [];
		foreach ( $authors as $author ) {
			if ( isset( $author['id'], $author['name'] ) ) {
				$sanitized[] = [
					'id'   => absint( $author['id'] ),
					'name' => sanitize_text_field( $author['name'] ),
				];
			}
		}

		return $sanitized;
	}

	/**
	 * Gets sanitized post types
	 *
	 * @since 1.0.0
	 * @return array Sanitized post types
	 */
	public static function get_sanitized_post_types(): array {
		$post_types = wpsolvex_autoaiblogger_get_post_types();
		if ( ! is_array( $post_types ) ) {
			return [];
		}

		$sanitized = [];
		foreach ( $post_types as $key => $label ) {
			$sanitized[ sanitize_key( $key ) ] = sanitize_text_field( $label );
		}

		return $sanitized;
	}
}
