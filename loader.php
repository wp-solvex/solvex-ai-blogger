<?php
/**
 * Loader.
 *
 * @package solvex-ai-blogger
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger;

use WPSolvex\AutoAIBlogger\Admin\Ajax;
use WPSolvex\AutoAIBlogger\Admin\API;
use WPSolvex\AutoAIBlogger\Admin\Filters;
use WPSolvex\AutoAIBlogger\Admin\Licensing;
use WPSolvex\AutoAIBlogger\Admin\Menu;
use WPSolvex\AutoAIBlogger\Core\CPT;
use WPSolvex\AutoAIBlogger\Core\Editor;
use WPSolvex\AutoAIBlogger\Core\Frontend;
use WPSolvex\AutoAIBlogger\Core\Maintenance;
use WPSolvex\AutoAIBlogger\Inc\Cron_Handler;
use WPSolvex\AutoAIBlogger\Inc\Cron_GSC_Sync;
use WPSolvex\AutoAIBlogger\Inc\Integrations\Google_Search_Console;
use WPSolvex\AutoAIBlogger\Inc\Notifications\Notification_Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Plugin_Loader
 *
 * @since 1.0.0
 */
class Loader {
	/**
	 * Instance
	 *
	 * @access private
	 * @var object Class Instance.
	 * @since 1.0.0
	 */
	private static $instance;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		spl_autoload_register( [ $this, 'autoload' ] );

		// Activation hook.
		register_activation_hook( WPSOLVEX_AUTOAIBLOGGER_FILE, [ $this, 'activation_actions' ] );

		// Deactivation hook.
		register_deactivation_hook( WPSOLVEX_AUTOAIBLOGGER_FILE, [ $this, 'deactivation_actions' ] );

		add_action( 'plugins_loaded', [ $this, 'setup' ], 1 );

		// Remove this after the translation error is fixed.
		add_filter( 'doing_it_wrong_trigger_error', [ $this, 'suppress_translation_error' ], 10, 4 );

		add_filter( 'plugin_action_links_' . WPSOLVEX_AUTOAIBLOGGER_BASE_PATH, [ $this, 'plugin_action_links' ] );
	}

	/**
	 * Enqueue required setup after plugins loaded.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function setup(): void {

		/* Define store constants for both Free and Pro versions */
		$this->define_store_constants();

		/* Maintenance init */
		Maintenance::get_instance();

		/* API init */
		API::get_instance();

		/* CPT init */
		CPT::get_instance();

		/* Load Editor Support */
		Editor::get_instance();

		/* Cron Handler init (always loaded for cron functionality) */
		Cron_Handler::get_instance();

		/* Google Search Console daily sync (always loaded so WP-Cron can run it) */
		Cron_GSC_Sync::get_instance();

		/* Notification Helper init (handles all notification hooks) */
		Notification_Helper::get_instance();

		/* Register custom cron schedules */
		add_filter( 'cron_schedules', [ $this, 'register_custom_cron_schedules' ] );

		/* Enforce free user limits for max content words if Pro is not available */
		if ( ! defined( 'WPSOLVEX_AUTOAIBLOGGER_PRO_VERSION' ) ) {
			add_filter( 'wpsolvex_autoaiblogger_max_content_words', [ $this, 'enforce_free_max_words_limit' ], 10, 2 );
			add_filter( 'wpsolvex_autoaiblogger_campaign_image_count', [ $this, 'enforce_free_image_limit' ], 10, 2 );
		}

		if ( is_admin() ) {
			/* Ajax init */
			Ajax::get_instance();

			/* Filters init */
			Filters::get_instance();

			/* Licensing */
			Licensing::get_instance();

			/* Admin Menu init */
			Menu::get_instance();

			/* Google Search Console integration (OAuth handshake + helpers) */
			Google_Search_Console::get_instance();
		} else {
			// Load Frontend Support.
			Frontend::get_instance();
		}
	}

	/**
	 * Define store constants.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function define_store_constants(): void {
		define( 'WPSOLVEX_AUTOAIBLOGGER_PRODUCT_ID', defined( 'WPSOLVEX_AUTOAIBLOGGER_PRO_PRODUCT_ID' ) ? WPSOLVEX_AUTOAIBLOGGER_PRO_PRODUCT_ID : '2effb53f-1066-40d3-9667-ef9f09f91db1' );
		define( 'WPSOLVEX_AUTOAIBLOGGER_PRODUCT_NAME', defined( 'WPSOLVEX_AUTOAIBLOGGER_PRO_PRODUCT_NAME' ) ? WPSOLVEX_AUTOAIBLOGGER_PRO_PRODUCT_NAME : 'Solvex AI Blogger - Free' );
		define( 'WPSOLVEX_AUTOAIBLOGGER_PRODUCT_FILE', defined( 'WPSOLVEX_AUTOAIBLOGGER_PRO_FILE' ) ? WPSOLVEX_AUTOAIBLOGGER_PRO_FILE : WPSOLVEX_AUTOAIBLOGGER_FILE );
	}

	/**
	 * Suppress translation error.
	 *
	 * @param bool   $status       Status.
	 * @param string $function_name Function name.
	 * @param string $message      Message.
	 * @param string $version      Version.
	 *
	 * @return bool
	 */
	public function suppress_translation_error( $status, $function_name, $message, $version ) {
		if ( $function_name === '_load_textdomain_just_in_time' && strpos( $message, 'solvex-ai-blogger' ) !== false ) {
			return false;
		}
		return $status;
	}

	/**
	 * Register custom cron schedules dynamically.
	 *
	 * @param array $schedules Existing cron schedules.
	 * @return array Modified schedules array.
	 * @since 1.0.0
	 */
	public function register_custom_cron_schedules( $schedules ) {
		$custom_schedules = get_option( 'wpsolvex_autoaiblogger_custom_cron_schedules', [] );

		if ( ! empty( $custom_schedules ) && is_array( $custom_schedules ) ) {
			foreach ( $custom_schedules as $name => $schedule ) {
				if ( ! isset( $schedules[ $name ] ) ) {
					$schedules[ $name ] = $schedule;
				}
			}
		}

		return $schedules;
	}

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

	/**
	 * Autoload classes.
	 *
	 * @param string $class class name.
	 * @return void
	 */
	public function autoload( $class ): void {
		$namespace        = __NAMESPACE__;
		$namespace_prefix = $namespace . '\\';
		if ( stripos( $class, $namespace_prefix ) !== 0 ) {
			return;
		}

		$class_to_load = substr( $class, strlen( $namespace_prefix ) );

		// Bundled SureCart Licensing SDK lives under inc/licensing/ with capitalized
		// filenames and is loaded via explicit require_once in admin/licensing.php.
		// Skip it here so the autoloader doesn't attempt a lowercased path that
		// fails on case-sensitive filesystems.
		if ( strpos( $class_to_load, 'Licensing\\' ) === 0 ) {
			return;
		}

		$filename = preg_replace(
			[ '/([a-z])([A-Z])/', '/_/' ],
			[ '$1-$2', '-' ],
			$class_to_load
		);

		if ( is_string( $filename ) ) {
			$filename = strtolower( str_replace( '\\', DIRECTORY_SEPARATOR, $filename ) );

			$file = WPSOLVEX_AUTOAIBLOGGER_DIR . $filename . '.php';

			// if the file readable, include it.
			if ( is_readable( $file ) ) {
				require_once $file;
			}
		}
	}

	/**
	 * Plugin Activation actions.
	 *
	 * @since 1.0.0
	 */
	public function activation_actions(): void {
		Cron_GSC_Sync::install_table();
	}

	/**
	 * Plugin Deactivation actions.
	 *
	 * @since 1.0.0
	 */
	public function deactivation_actions(): void {
		wp_clear_scheduled_hook( Cron_GSC_Sync::CRON_HOOK );
	}

	/**
	 * Enforce maximum content words limit for free users.
	 *
	 * Free users are limited to 1000 words maximum.
	 * Pro users can customize this value up to 5000 words.
	 *
	 * @param int $max_words   The maximum words from campaign settings.
	 * @param int $campaign_id The campaign ID.
	 * @return int The enforced maximum words value.
	 * @since 0.0.2
	 */
	public function enforce_free_max_words_limit( $max_words, $campaign_id ): int {
		// Free users are limited to 1000 words max.
		$free_limit = 1000;

		// If the requested max_words exceeds free limit, cap it.
		if ( $max_words > $free_limit ) {
			$max_words = $free_limit;
		}

		// Ensure minimum is at least 100 words.
		if ( $max_words < 100 ) {
			$max_words = 100;
		}

		return absint( $max_words );
	}

	/**
	 * Enforce free user limit for number of images per post.
	 *
	 * @param int $image_count The number of images from campaign settings.
	 * @param int $campaign_id The campaign ID.
	 * @return int The enforced image count (always 1 for free users).
	 * @since 0.0.2
	 */
	public function enforce_free_image_limit( $image_count, $campaign_id ): int {
		// Free users are limited to 1 image per post.
		return 1;
	}

	/**
	 * Show action on plugin page.
	 *
	 * @param  array $links links.
	 * @return array
	 * @since 0.0.2
	 */
	public function plugin_action_links( $links ) {
		return array_merge(
			[
				'<a href="' . esc_url( admin_url( 'edit.php?page=solvex-ai-blogger' ) ) . '">' . __( 'Automate Blogging', 'solvex-ai-blogger' ) . '</a>',
			],
			$links
		);
	}
}

/**
 * Kicking this off by calling 'get_instance()' method
 */
Loader::get_instance();
