<?php
/**
 * Settings.
 *
 * @package solvex-ai-blogger
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * This class will holds the code related to the managing of settings of the plugin.
 *
 * @class Settings
 */
class Settings {
	/**
	 * Cache the DB options
	 *
	 * @since 1.0.0
	 * @access public
	 * @var array
	 */
	public static $dashboard_options = [];

	/**
	 * Returns all default dashboard settings.
	 *
	 * @return array
	 * @since 1.0.0
	 */
	public static function get_settings_dataset() {
		return apply_filters(
			'wpsolvex_autoaiblogger_settings_dataset',
			[
				'userOnboarded'            => [
					'default' => false,
					'type'    => 'bool',
				],
				'tourCompleted'            => [
					'default' => false,
					'type'    => 'bool',
				],
				'onboardingTab'            => [
					'default' => 'welcome',
					'type'    => 'string',
				],
				'userName'                 => [
					'default' => wpsolvex_autoaiblogger_get_user_detail( 'name' ),
					'type'    => 'name',
				],
				'userEmail'                => [
					'default' => wpsolvex_autoaiblogger_get_user_detail( 'email' ),
					'type'    => 'email',
				],
				'siteTitle'                => [
					'default' => get_bloginfo( 'name' ),
					'type'    => 'string',
				],
				'siteDescription'          => [
					'default' => get_bloginfo( 'description' ),
					'type'    => 'string',
				],
				'siteFor'                  => [
					'default' => '',
					'type'    => 'string',
				],
				'temperature'              => [
					'default' => 1,
					'type'    => 'float',
				],
				'harassment'               => [
					'default' => 2,
					'type'    => 'float',
				],
				'hate'                     => [
					'default' => 2,
					'type'    => 'float',
				],
				'sexuallyExplicit'         => [
					'default' => 2,
					'type'    => 'float',
				],
				'dangerousContent'         => [
					'default' => 2,
					'type'    => 'float',
				],
				'license'                  => [
					'default' => '',
					'type'    => 'string',
				],
				'license_status'           => [
					'default' => 'unlicensed',
					'type'    => 'string',
				],
				'tokenTotal'               => [
					'default' => 0,
					'type'    => 'int',
				],
				'tokenRemaining'           => [
					'default' => 0,
					'type'    => 'int',
				],
				'postIdeas'                => [
					'default' => '',
					'type'    => 'string',
				],
				'createdPostIdeas'         => [
					'default' => '',
					'type'    => 'string',
				],
				// Notification settings.
				'emailNotificationEnabled' => [
					'default' => false,
					'type'    => 'bool',
				],
				'emailNotificationValue'   => [
					'default' => wpsolvex_autoaiblogger_get_user_detail( 'email' ),
					'type'    => 'email',
				],
			]
		);
	}

	/**
	 * Returns an option from the default options.
	 *
	 * @param  string $key     The option key.
	 * @param  mixed  $default Option default value if option is not available.
	 * @return mixed   Returns the option value
	 *
	 * @since 1.0.0
	 */
	public static function get_default_option( $key, $default = false ) {
		$default_settings = self::get_default_settings();

		if ( ! is_array( $default_settings ) || ! array_key_exists( $key, $default_settings ) || empty( $default_settings ) ) {
			return $default;
		}

		return $default_settings[ $key ];
	}

	/**
	 * As per the settings dataset, return the default settings.
	 *
	 * @return array
	 * @since 1.0.0
	 */
	public static function get_default_settings() {
		$settings_dataset = self::get_settings_dataset();

		$default_settings = [];

		foreach ( $settings_dataset as $key => $value ) {
			$default_settings[ $key ] = $value['default'];
		}

		return $default_settings;
	}

	/**
	 * Returns all portal settings.
	 *
	 * @return array
	 * @since 1.0.0
	 */
	public static function get_ai_blogger_settings() {
		if ( ! empty( self::$dashboard_options ) ) {
			return self::$dashboard_options;
		}

		$db_option = get_option( WPSOLVEX_AUTOAIBLOGGER_DB_OPTION, [] );

		$defaults = apply_filters( 'wpsolvex_autoaiblogger_dashboard_rest_options', self::get_default_settings() );

		self::$dashboard_options = wp_parse_args( $db_option, $defaults );
		return self::$dashboard_options;
	}

	/**
	 * Get all the settings type wise.
	 *
	 * @return array
	 * @since 1.0.0
	 */
	public static function get_all_type_wise_settings() {
		$settings_dataset = self::get_settings_dataset();

		$type_wise_settings = [];

		foreach ( $settings_dataset as $key => $value ) {
			$type_wise_settings[ $key ] = $value['type'];
		}

		return $type_wise_settings;
	}

	/**
	 * Data cleaner
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param mixed  $value     data from AJAX.
	 * @param string $data_type datatype to sanitize further.
	 *
	 * @return mixed Sanitized data.
	 */
	public static function sanitize_data( $value, $data_type = 'default' ) {
		$output = '';
		switch ( $data_type ) {
			case 'bool':
				$output = isset( $value ) && sanitize_text_field( $value ) === 'true' ? true : false;
				break;

			case 'email':
				$output = isset( $value ) ? sanitize_email( wp_unslash( $value ) ) : wpsolvex_autoaiblogger_get_user_detail( 'email' );
				break;

			case 'name':
				$output = isset( $value ) ? sanitize_text_field( wp_unslash( $value ) ) : wpsolvex_autoaiblogger_get_user_detail( 'name' );
				break;

			case 'int':
				$output = ! empty( $value ) ? absint( $value ) : '';
				break;

			case 'float':
				$val    = is_scalar( $value ) || is_null( $value ) ? strval( $value ) : '';
				$output = ! empty( $value ) ? floatval( $val ) : '';
				break;

			case 'url':
				$output = ! empty( $value ) ? esc_url( $value ) : '';
				break;

			case 'color':
				$output = ! empty( $value ) ? json_decode( stripslashes( $value ) ) : '';
				$output = is_string( $output ) ? trim( $output, '"' ) : $output;
				break;

			case 'array':
				$output = ! empty( $value ) ? wpsolvex_autoaiblogger_clean_data( $value ) : '';
				break;

			case 'textarea':
				$output = ! empty( $value ) ? sanitize_textarea_field( wp_unslash( $value ) ) : '';
				break;

			case 'html':
				$output = ! empty( $value ) ? wp_unslash( $value ) : '';
				break;

			case 'string':
				$output = isset( $value ) ? sanitize_textarea_field( wp_unslash( $value ) ) : '';
				break;

			case 'text':
			case 'default':
			default:
				$output = isset( $value ) ? sanitize_text_field( wp_unslash( $value ) ) : '';
				break;
		}

		return $output;
	}

	/**
	 * Get the type of the setting.
	 *
	 * @param string $key The setting key.
	 * @return string
	 * @since 1.0.0
	 */
	public static function get_setting_type( $key ) {
		$settings_dataset = self::get_settings_dataset();

		if ( ! is_array( $settings_dataset ) || ! array_key_exists( $key, $settings_dataset ) ) {
			return 'string';
		}

		return $settings_dataset[ $key ]['type'];
	}
}
