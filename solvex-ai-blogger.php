<?php
/**
 * Plugin Name: Hero AI Blogger
 * Plugin URI: https://wpaiblogger.com/
 * Author: WP Solvex
 * Author URI: https://wpaiblogger.com/
 * Version: 1.0.2
 * License: GPLv2 or later
 * Requires at least: 6.7
 * Tested up to: 7.0
 * Requires PHP: 7.4
 * Description: AI‑powered auto‑blogging that creates high‑quality, optimized posts automatically, delivering smarter content beyond traditional blogging tools.
 * Text Domain: solvex-ai-blogger
 *
 * @package solvex-ai-blogger
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define Constants.
define( 'WPSOLVEX_AUTOAIBLOGGER_FILE', __FILE__ );
define( 'WPSOLVEX_AUTOAIBLOGGER_VERSION', '1.0.2' );
define( 'WPSOLVEX_AUTOAIBLOGGER_DIR', plugin_dir_path( WPSOLVEX_AUTOAIBLOGGER_FILE ) );
define( 'WPSOLVEX_AUTOAIBLOGGER_BASE_PATH', plugin_basename( WPSOLVEX_AUTOAIBLOGGER_FILE ) );
define( 'WPSOLVEX_AUTOAIBLOGGER_BASE_URL', plugins_url( '/', WPSOLVEX_AUTOAIBLOGGER_FILE ) );

// Define Plugin Option.
define( 'WPSOLVEX_AUTOAIBLOGGER_SLUG', 'solvex-ai-blogger' );
define( 'WPSOLVEX_AUTOAIBLOGGER_DB_OPTION', 'wpsolvex_autoaiblogger_settings' );
define( 'WPSOLVEX_AUTOAIBLOGGER_CAPABILITY', 'manage_options' );

// Store Linking.
define( 'WPSOLVEX_AUTOAIBLOGGER_PUBLIC_TOKEN', 'pt_YA4aSFMwU9stG91RYGGfV7aq' );
define( 'WPSOLVEX_AUTOAIBLOGGER_CAMPAIGN_POST_API', 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-campaign-post' );
define( 'WPSOLVEX_AUTOAIBLOGGER_CONTENT_FROM_TITLE_POST_API', 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-content-from-title' );
define( 'WPSOLVEX_AUTOAIBLOGGER_TOKEN_USAGE_API', 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data' );

// CPT Constants.
define( 'WPSOLVEX_AUTOAIBLOGGER_CPT_CAMPAIGN', 'campaign' );

// Define Upgrade Link.
define( 'WPSOLVEX_AUTOAIBLOGGER_UPGRADE_LINK', 'https://wpaiblogger.com/#pricing' );
// Define Registration Link.
define( 'WPSOLVEX_AUTOAIBLOGGER_REGISTRATION_URL', 'https://wpaiblogger.com/register/' );

// Include required files.
require_once 'inc/functions/common.php';

// Include notice library file.
require_once 'inc/web-notices/class-web-notices.php';

// Plugin loader.
require_once 'loader.php';
