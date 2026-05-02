<?php
/**
 * Maintenance.
 *
 * @package solvex-ai-blogger
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;

/**
 * Update Compatibility
 *
 * @package solvex-ai-blogger
 */

/**
 * Update initial setup
 *
 * @since 1.0.0
 */
class Maintenance {
	use Get_Instance;

	/**
	 *  Constructor
	 */
	public function __construct() {
		if ( is_admin() ) {
			add_action( 'admin_init', self::class . '::init' );
		} else {
			add_action( 'init', self::class . '::init' );
		}
	}

	/**
	 * Init
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function init(): void {
		do_action( 'wpsolvex_autoaiblogger_update_before' );

		// Get auto saved version number.
		$saved_version = get_option( 'wpsolvex_autoaiblogger_saved_version', false );

		// Update auto saved version number.
		if ( ! $saved_version ) {
			update_option( 'wpsolvex_autoaiblogger_saved_version', WPSOLVEX_AUTOAIBLOGGER_VERSION );
		}

		// If equals then return.
		if ( version_compare( strval( $saved_version ), WPSOLVEX_AUTOAIBLOGGER_VERSION, '=' ) ) {
			return;
		}

		// Update auto saved version number.
		update_option( 'wpsolvex_autoaiblogger_saved_version', WPSOLVEX_AUTOAIBLOGGER_VERSION );

		do_action( 'wpsolvex_autoaiblogger_update_after' );
	}
}
