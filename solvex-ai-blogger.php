<?php
/**
 * Plugin Name: Solvex AI Blogger
 * Plugin URI: https://wpaiblogger.com/
 * Author: WP Solvex
 * Author URI: https://wpsolvex.com/
 * Version: 0.0.5
 * License: GPLv2 or later
 * Requires at least: 6.0
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
define( 'SOLVEX_AIB_FILE', __FILE__ );
define( 'SOLVEX_AIB_VERSION', '0.0.5' );
define( 'SOLVEX_AIB_DIR', plugin_dir_path( SOLVEX_AIB_FILE ) );
define( 'SOLVEX_AIB_BASE_PATH', plugin_basename( SOLVEX_AIB_FILE ) );
define( 'SOLVEX_AIB_BASE_URL', plugins_url( '/', SOLVEX_AIB_FILE ) );

// Define Plugin Option.
define( 'SOLVEX_AIB_SLUG', 'solvex-ai-blogger' );
define( 'SOLVEX_AIB_DB_OPTION', 'solvex_aib_settings' );
define( 'SOLVEX_AIB_CAPABILITY', 'manage_options' );

// Store Linking.
define( 'SOLVEX_AIB_PUBLIC_TOKEN', 'pt_YA4aSFMwU9stG91RYGGfV7aq' );
define( 'SOLVEX_AIB_CAMPAIGN_POST_API', 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-campaign-post' );
define( 'SOLVEX_AIB_CONTENT_FROM_TITLE_POST_API', 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-content-from-title' );
define( 'SOLVEX_AIB_TOKEN_USAGE_API', 'https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data' );

// CPT Constants.
define( 'SOLVEX_AIB_CPT_CAMPAIGN', 'campaign' );

// Define Upgrade Link.
define( 'SOLVEX_AIB_UPGRADE_LINK', 'https://wpaiblogger.com/#pricing' );
// Define Registration Link.
define( 'SOLVEX_AIB_REGISTRATION_URL', 'https://wpaiblogger.com/register/' );

// Include required files.
require_once 'inc/functions/common.php';

// Include notice library file.
require_once 'inc/web-notices/class-web-notices.php';

// Plugin loader.
require_once 'loader.php';
