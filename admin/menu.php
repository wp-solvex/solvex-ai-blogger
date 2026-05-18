<?php
/**
 * Admin Menu class for Solvex AI Blogger.
 *
 * This class handles secure admin menu setup, script loading, and data localization.
 * Implements comprehensive security measures including input validation,
 * data sanitization, and secure script loading.
 *
 * @package solvex-ai-blogger
 * @subpackage Admin
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Admin;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;
use WPSolvex\AutoAIBlogger\Inc\Utils\Helper;
use WPSolvex\AutoAIBlogger\Inc\Utils\Metadata;
use WPSolvex\AutoAIBlogger\Inc\Utils\Sanitizer;

defined( 'ABSPATH' ) || exit;

/**
 * Admin Menu class for Solvex AI Blogger.
 *
 * This class handles secure admin menu setup, script loading, and data localization.
 * Implements comprehensive security measures including input validation,
 * data sanitization, and secure script loading.
 *
 * @package solvex-ai-blogger
 * @subpackage Admin
 * @since 1.0.0
 */
class Menu {
	use Get_Instance;

	/**
	 * Settings page ID for Plugin settings.
	 */
	public const PAGE_ID = WPSOLVEX_AUTOAIBLOGGER_SLUG;

	/**
	 * Constructor with security setup.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->initialize_hooks();

		add_action( 'admin_init', [ $this, 'settings_admin_scripts' ] );

		// Add security headers for admin pages.
		add_action( 'admin_head', [ $this, 'add_admin_security_headers' ] );
	}

	/**
	 * Add security headers for admin pages.
	 *
	 * @since 0.0.2
	 */
	public function add_admin_security_headers(): void {
		// Only add headers on our plugin pages.
		if ( ! $this->is_plugin_admin_page() ) {
			return;
		}

		// Add Content Security Policy.
		// Allow Google Fonts (stylesheet on fonts.googleapis.com, font files
		// on fonts.gstatic.com) and YouTube embeds in the welcome video
		// popup. Also keep the upstream API endpoint reachable.
		if ( ! headers_sent() ) {
			header(
				"Content-Security-Policy: default-src 'self'; "
				. "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
				. "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
				. "img-src 'self' data: https:; "
				. "font-src 'self' data: https://fonts.gstatic.com; "
				. "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; "
				. "connect-src 'self' https://wpaiblogger.com;"
			);
			header( 'X-Content-Type-Options: nosniff' );
			header( 'X-Frame-Options: SAMEORIGIN' );
			header( 'X-XSS-Protection: 1; mode=block' );
			header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		}
	}

	/**
	 * Initialize Admin Setup with security.
	 *
	 * @since 1.0.0
	 */
	public function settings_admin_scripts(): void {
		$page = ! empty( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce verification is not required here as this is a static check.

		// input validation and sanitization.
		if ( empty( $page ) ) {
			return;
		}

		// Validate page parameter against expected values.
		if ( $page !== self::PAGE_ID && strpos( $page, self::PAGE_ID . '_' ) !== 0 ) {
			return;
		}

		// Check user capabilities.
		if ( ! current_user_can( WPSOLVEX_AUTOAIBLOGGER_CAPABILITY ) ) {
			return;
		}

		add_action( 'admin_enqueue_scripts', [ $this, 'app_build_scripts' ] );

		// Remove WordPress footer text securely.
		add_filter(
			'admin_footer_text',
			function() {
				// Only modify footer on our pages for security.
				if ( $this->is_plugin_admin_page() ) {
					return '';
				}
				return null; // Return null to preserve original behavior on other pages.
			}
		);

		add_filter(
			'update_footer',
			function() {
				// Only modify footer on our pages for security.
				if ( $this->is_plugin_admin_page() ) {
					return '';
				}
				return null; // Return null to preserve original behavior on other pages.
			}
		);
	}

	/**
	 * Renders the hub screen canvas with security validation.
	 *
	 * @since 1.0.0
	 */
	public function render_settings_page(): void {
		// Security validation before rendering.
		if ( ! current_user_can( WPSOLVEX_AUTOAIBLOGGER_CAPABILITY ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'solvex-ai-blogger' ) );
		}

		// Additional CSRF protection.
		$nonce = wp_create_nonce( 'wpsolvex_autoaiblogger_admin_page' );

		echo '<div id="solvex-ai-blogger-main-page--wrapper" data-nonce="' . esc_attr( $nonce ) . '"></div>';
	}

	/**
	 * Enqueue the Admin's build files for plugin to work with security.
	 *
	 * @since 1.0.0
	 */
	public function app_build_scripts(): void {
		// Security checks.
		if ( is_customize_preview() ) {
			return;
		}

		if ( ! current_user_can( WPSOLVEX_AUTOAIBLOGGER_CAPABILITY ) ) {
			return;
		}

		if ( ! $this->is_plugin_admin_page() ) {
			return;
		}

		// Sanitized data collection.
		$blog_name                = sanitize_text_field( Helper::get_option( 'blogName', get_bloginfo( 'name' ) ) );
		$admin_site_email_address = sanitize_email( Helper::get_option( 'adminEmail', get_option( 'admin_email' ) ) );

		// Get settings with proper defaults - no need for redundant variables.
		$site_title         = sanitize_text_field( Helper::get_option( 'siteTitle', $blog_name ) );
		$site_description   = sanitize_textarea_field( Helper::get_option( 'siteDescription', '' ) );
		$site_for           = sanitize_text_field( Helper::get_option( 'siteFor', '' ) );
		$license            = sanitize_text_field( Helper::get_option( 'license', '' ) );
		$temperature        = (float) Helper::get_option( 'temperature', 1.0 );
		$harassment         = absint( Helper::get_option( 'harassment', 2 ) );
		$hate               = absint( Helper::get_option( 'hate', 2 ) );
		$sexually_explicit  = absint( Helper::get_option( 'sexuallyExplicit', 2 ) );
		$dangerous_content  = absint( Helper::get_option( 'dangerousContent', 2 ) );
		$post_ideas         = sanitize_textarea_field( Helper::get_option( 'postIdeas', '' ) );
		$created_post_ideas = sanitize_textarea_field( Helper::get_option( 'createdPostIdeas', '' ) );
		$token_total        = absint( Helper::get_option( 'tokenTotal', 0 ) );
		$token_remaining    = absint( Helper::get_option( 'tokenRemaining', 0 ) );
		$license_status     = sanitize_key( Helper::get_option( 'license_status', 'unlicensed' ) );

		// Notification settings - default to disabled.
		$email_notification_enabled = (bool) Helper::get_option( 'emailNotificationEnabled', false );
		$email_notification_value   = sanitize_text_field( Helper::get_option( 'emailNotificationValue', $admin_site_email_address ) );

		// Get data with proper error handling in the methods themselves.
		$post_statuses     = Sanitizer::get_sanitized_post_statuses();
		$categories        = Sanitizer::get_sanitized_categories();
		$tags              = Sanitizer::get_sanitized_tags();
		$authors           = Sanitizer::get_sanitized_authors();
		$post_types        = Sanitizer::get_sanitized_post_types();
		$postmeta_defaults = Metadata::get_default_settings();
		// Campaigns are fetched via REST (GET /solvex-ai-blogger/v1/campaigns) on demand.
		$generated_posts   = wpsolvex_autoaiblogger_get_generated_posts();

		$localized_data = apply_filters(
			'wpsolvex_autoaiblogger_localized_admin_data',
			[
				// Core WordPress URLs and nonces.
				'ajax_url'                   => admin_url( 'admin-ajax.php' ),
				'rest_url'                   => rest_url( WPSOLVEX_AUTOAIBLOGGER_SLUG . '/v1/' ),
				'admin_nonce'                => wp_create_nonce( 'wpsolvex_autoaiblogger_admin_nonce' ),
				'rest_nonce'                 => wp_create_nonce( 'wp_rest' ),
				'admin_page_nonce'           => wp_create_nonce( 'wpsolvex_autoaiblogger_admin_page' ),
				'licensing_nonce'            => wp_create_nonce( 'wpsolvex_autoaiblogger_licensing_nonce' ),

				// Static configuration that doesn't change during app lifecycle.
				'version'                    => WPSOLVEX_AUTOAIBLOGGER_VERSION,
				'home_slug'                  => sanitize_key( self::PAGE_ID ),
				'admin_base_url'             => esc_url( admin_url( 'edit.php' ) ),
				'admin_app_url'              => esc_url( admin_url( 'edit.php?page=' . self::PAGE_ID ) ),
				'upgrade_link'               => defined( 'WPSOLVEX_AUTOAIBLOGGER_UPGRADE_LINK' ) ? esc_url( WPSOLVEX_AUTOAIBLOGGER_UPGRADE_LINK ) : '#',
				'registration_url'           => defined( 'WPSOLVEX_AUTOAIBLOGGER_REGISTRATION_URL' ) ? esc_url( WPSOLVEX_AUTOAIBLOGGER_REGISTRATION_URL ) : '#',
				'pro_purchase_url'           => esc_url( WPSOLVEX_AUTOAIBLOGGER_UPGRADE_LINK ),
				'pro_available'              => defined( 'WPSOLVEX_AUTOAIBLOGGER_PRO_VERSION' ),
				'pro_version'                => defined( 'WPSOLVEX_AUTOAIBLOGGER_PRO_VERSION' ) ? WPSOLVEX_AUTOAIBLOGGER_PRO_VERSION : '',
				'pro_plugin_name'            => defined( 'WPSOLVEX_AUTOAIBLOGGER_PRO_PRODUCT_NAME' ) ? str_replace( 'Solvex AI Blogger - ', '', WPSOLVEX_AUTOAIBLOGGER_PRO_PRODUCT_NAME ) : '',
				'edit_post_link'             => esc_url(
					add_query_arg(
						[
							'post'   => '{{POST_ID}}',
							'action' => 'edit',
						],
						admin_url( 'post.php' )
					)
				),

				// User and site information.
				'current_user_name'          => sanitize_text_field( wpsolvex_autoaiblogger_get_user_detail( 'name' ) ),
				'current_user_email'         => sanitize_email( wpsolvex_autoaiblogger_get_user_detail( 'email' ) ),
				'current_user_id'            => get_current_user_id(),
				'admin_email'                => $admin_site_email_address,
				'site_title'                 => $site_title,
				'site_description'           => $site_description,
				'site_for'                   => $site_for,

				// User settings and preferences.
				'userOnboarded'              => (bool) Helper::get_option( 'userOnboarded', false ),
				'license'                    => $license,
				'license_status'             => $license_status,
				'postIdeas'                  => $post_ideas,
				'createdPostIdeas'           => $created_post_ideas,
				'temperature'                => $temperature,
				'harassment'                 => $harassment,
				'hate'                       => $hate,
				'sexually_explicit'          => $sexually_explicit,
				'dangerous_content'          => $dangerous_content,

				// Notification settings.
				'email_notification_enabled' => $email_notification_enabled,
				'email_notification_value'   => $email_notification_value,

				// Token and licensing information.
				'token_total'                => $token_total,
				'token_remaining'            => $token_remaining,

				// WordPress data collections.
				'post_statuses'              => $post_statuses,
				'categories'                 => $categories,
				'tags'                       => $tags,
				'authors'                    => $authors,
				'post_types'                 => $post_types,
				'postmeta_defaults'          => $postmeta_defaults,
				'generated_posts'            => $generated_posts,

				// System configuration.
				'blog_name'                  => $blog_name,
				'security_level'             => 'enhanced',
				'campaign_testing_mode'      => false, // Will be overridden by testing plugin if active.
			]
		);

		$handle            = 'wpsolvex_autoaiblogger_admin_scripts';
		$build_path        = WPSOLVEX_AUTOAIBLOGGER_BASE_URL . 'assets/build/';
		$script_asset_path = WPSOLVEX_AUTOAIBLOGGER_DIR . 'assets/build/blog-app.asset.php';

		// Validate script file exists.
		if ( ! file_exists( $script_asset_path ) ) {
			return;
		}

		$script_info = include $script_asset_path;

		// Validate script info structure.
		if ( ! is_array( $script_info ) || ! isset( $script_info['dependencies'] ) ) {
			return;
		}

		$script_dep = array_merge( $script_info['dependencies'], [] );

		// Validate script file exists.
		$script_file = $build_path . 'blog-app.js';
		if ( ! $this->validate_script_file( WPSOLVEX_AUTOAIBLOGGER_DIR . 'assets/build/blog-app.js' ) ) {
			return;
		}

		wp_enqueue_script(
			$handle,
			$script_file,
			$script_dep,
			WPSOLVEX_AUTOAIBLOGGER_VERSION,
			true
		);

		wp_localize_script( $handle, 'wpsolvex_autoaiblogger_localized_data', $localized_data );

		wp_set_script_translations( $handle, 'solvex-ai-blogger', WPSOLVEX_AUTOAIBLOGGER_DIR . 'languages' );

		// Enqueue Google Fonts (Inter + JetBrains Mono) used by the dashboard.
		// Done from PHP rather than via CSS `@import url(...)` so that the
		// browser fetches font CSS in parallel with our app CSS (no waterfall),
		// and to avoid the CSS-spec rule that `@import` must precede every
		// other rule — which is impossible to satisfy in our SCSS pipeline
		// where `@use` inlines content before any `@import` can appear.
		wp_enqueue_style(
			'wpsolvex-autoaiblogger-fonts',
			'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
			[],
			null
		);

		// Validate and enqueue styles.
		$style_file = is_rtl() ? $build_path . 'blog-app-rtl.css' : $build_path . 'blog-app.css';
		$style_path = is_rtl() ? WPSOLVEX_AUTOAIBLOGGER_DIR . 'assets/build/blog-app-rtl.css' : WPSOLVEX_AUTOAIBLOGGER_DIR . 'assets/build/blog-app.css';

		if ( $this->validate_style_file( $style_path ) ) {
			wp_enqueue_style( $handle, $style_file, [], WPSOLVEX_AUTOAIBLOGGER_VERSION );
		}
	}

	/**
	 * Function to load the admin area actions.
	 *
	 * @since 1.0.0
	 */
	public function initialize_hooks(): void {
		add_action( 'admin_menu', [ $this, 'register_plugin_menus' ] );
	}

	/**
	 * Add submenu to admin menu.
	 *
	 * @since 1.0.0
	 */
	public function register_plugin_menus(): void {
		if ( current_user_can( WPSOLVEX_AUTOAIBLOGGER_CAPABILITY ) ) {
			add_submenu_page(
				'edit.php',
				__( 'Solvex AI Blogger', 'solvex-ai-blogger' ),
				__( 'Solvex AI Blogger', 'solvex-ai-blogger' ),
				WPSOLVEX_AUTOAIBLOGGER_CAPABILITY,
				self::PAGE_ID,
				[ $this, 'render_settings_page' ]
			);
		}
	}

	/**
	 * Check if current page is our plugin admin page.
	 *
	 * @return bool
	 * @since 0.0.2
	 */
	private function is_plugin_admin_page(): bool {
		$page = ! empty( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce verification is not required here as this is a static check.

		if ( empty( $page ) ) {
			return false;
		}

		$page = sanitize_text_field( wp_unslash( $page ) );

		return $page === self::PAGE_ID || strpos( $page, self::PAGE_ID . '_' ) === 0;
	}

	/**
	 * Validates security input parameters
	 *
	 * @since 1.0.0
	 * @param array $data Input data to validate.
	 * @return array Validated data
	 */
	private function validate_security_input( array $data ): array {
		$validated = [];

		// Validate page parameter.
		if ( isset( $data['page'] ) ) {
			$validated['page'] = sanitize_key( $data['page'] );
		}

		// Validate action parameter.
		if ( isset( $data['action'] ) ) {
			$validated['action'] = sanitize_key( $data['action'] );
		}

		// Validate tab parameter.
		if ( isset( $data['tab'] ) ) {
			$validated['tab'] = sanitize_key( $data['tab'] );
		}

		return $validated;
	}

	/**
	 * Validates script file
	 *
	 * @since 1.0.0
	 * @param string $file_path File path to validate.
	 * @return bool True if valid
	 */
	private function validate_script_file( string $file_path ): bool {
		if ( ! file_exists( $file_path ) ) {
			return false;
		}

		$file_info = pathinfo( $file_path );
		if ( ! isset( $file_info['extension'] ) || $file_info['extension'] !== 'js' ) {
			return false;
		}

		// Check file size (max 5MB).
		if ( filesize( $file_path ) > 5 * 1024 * 1024 ) {
			return false;
		}

		return true;
	}

	/**
	 * Validates style file
	 *
	 * @since 1.0.0
	 * @param string $file_path File path to validate.
	 * @return bool True if valid
	 */
	private function validate_style_file( string $file_path ): bool {
		if ( ! file_exists( $file_path ) ) {
			return false;
		}

		$file_info = pathinfo( $file_path );
		if ( ! isset( $file_info['extension'] ) || $file_info['extension'] !== 'css' ) {
			return false;
		}

		// Check file size (max 2MB).
		if ( filesize( $file_path ) > 2 * 1024 * 1024 ) {
			return false;
		}

		return true;
	}
}
