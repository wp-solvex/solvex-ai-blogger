<?php
/**
 * Trait.
 *
 * @package solvex-ai-blogger
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc\Traits;

/**
 * Trait Get_Instance.
 *
 * @since 1.0.0
 */
trait Get_Instance {
	/**
	 * Instance object.
	 *
	 * @var object Class Instance.
	 */
	private static $instance = null;

	/**
	 * Initiator
	 *
	 * @since 1.0.0
	 * @return object initialized object of class.
	 */
	public static function get_instance() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}
}
