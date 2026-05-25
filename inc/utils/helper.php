<?php
/**
 * Helper Class for Solvex AI Blogger.
 *
 * This class provides utility functions for settings management
 * with input validation, data sanitization, and security checks.
 *
 * @package solvex-ai-blogger
 * @subpackage Utils
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * Helper class for settings management.
 *
 * This class provides utility functions for managing plugin settings
 * with validation, sanitization, and access control.
 *
 * @package solvex-ai-blogger
 * @subpackage Utils
 * @since 1.0.0
 */
class Helper {
	/**
	 * Allowed setting keys for security validation.
	 *
	 * @var array
	 */
	private static $allowed_keys = [
		'userOnboarded',
		'onboardingTab',
		'userName',
		'userEmail',
		'siteTitle',
		'siteDescription',
		'siteFor',
		'license',
		'license_status',
		'temperature',
		'harassment',
		'hate',
		'sexuallyExplicit',
		'dangerousContent',
		'postIdeas',
		'createdPostIdeas',
		'tokenTotal',
		'tokenRemaining',
		'apiKey',
		'enableLogging',
		'blogName',
		'adminEmail',
		'emailNotificationEnabled',
		'emailNotificationValue',
		'contentTone',
		'targetDemographic',
	];

	/**
	 * Resolve any key format (camelCase or lowercase) to the original camelCase key.
	 *
	 * @param string $key The key to resolve.
	 * @return string|false The original camelCase key, or false if not allowed.
	 * @since 1.1.0
	 */
	private static function resolve_key( $key ) {
		if ( ! is_string( $key ) || empty( $key ) ) {
			return false;
		}

		$lower_key = strtolower( $key );
		foreach ( self::$allowed_keys as $allowed ) {
			if ( strtolower( $allowed ) === $lower_key ) {
				return $allowed;
			}
		}
		return false;
	}

	/**
	 * Returns an option from the database for the admin settings.
	 *
	 * @param  string $key     The option key.
	 * @param  mixed  $default Option default value if option is not available.
	 * @return mixed   Returns the option value
	 *
	 * @since 1.0.0
	 */
	public static function get_option( $key, $default = false ) {
		$original_key = self::resolve_key( $key );
		if ( ! $original_key ) {
			return $default;
		}

		$settings = Settings::get_ai_blogger_settings();

		if ( empty( $settings ) || ! is_array( $settings ) ) {
			return $default;
		}

		if ( ! array_key_exists( $original_key, $settings ) ) {
			return $default;
		}

		$value = $settings[ $original_key ];

		// Return default if value is empty and default is provided.
		if ( $value === '' && $default !== false ) {
			return $default;
		}

		return $value;
	}

	/**
	 * Update option in the database for the admin settings.
	 *
	 * @param  string $key      The option key.
	 * @param  mixed  $value    Option value to update.
	 * @return array            Returns array with 'success' boolean and 'value' for the sanitized value
	 *
	 * @since 1.0.0
	 */
	public static function update_option( $key, $value = true ) {
		$original_key = self::resolve_key( $key );
		if ( ! $original_key ) {
			return [
				'success' => false,
				'error'   => __( 'Invalid key parameter', 'solvex-ai-blogger' ),
			];
		}

		// Capability check.
		if ( ! current_user_can( 'manage_options' ) && ! wp_doing_cron() && ! wp_doing_ajax() ) {
			return [
				'success' => false,
				'error'   => 'Insufficient permissions',
			];
		}

		// Sanitize value based on key type.
		$sanitized_value = self::sanitize_input( $original_key, $value );

		// Check if sanitization failed (false can be a valid value for boolean fields).
		$boolean_fields = [ 'userOnboarded', 'enableLogging', 'emailNotificationEnabled' ];
		if ( $sanitized_value === false && ! in_array( $original_key, $boolean_fields, true ) ) {
			return [
				'success' => false,
				'error'   => 'Sanitization failed',
			];
		}

		$settings = get_option( WPSOLVEX_AUTOAIBLOGGER_DB_OPTION, [] );

		if ( ! is_array( $settings ) ) {
			$settings = [];
		}

		// If the value is same as default then remove it from the DB.
		$default_value = Settings::get_default_option( $original_key );
		if ( $default_value === $sanitized_value ) {
			unset( $settings[ $original_key ] );
		} else {
			$settings[ $original_key ] = $sanitized_value;
		}

		// Validate and normalize keys, then save.
		$validated_settings = self::validate_settings_array( $settings );

		update_option( WPSOLVEX_AUTOAIBLOGGER_DB_OPTION, $validated_settings );

		// Clear settings cache.
		Settings::$dashboard_options = [];

		return [
			'success' => true,
			'value'   => $sanitized_value,
		];
	}

	/**
	 * Delete option from the database for the admin settings.
	 *
	 * @param  string $key The option key.
	 * @return bool True on success, false on failure.
	 *
	 * @since 1.0.0
	 */
	public static function delete_option( $key ): bool {
		if ( ! is_string( $key ) || empty( $key ) ) {
			return false;
		}

		if ( ! current_user_can( 'manage_options' ) && ! wp_doing_cron() ) {
			return false;
		}

		// Resolve to original camelCase key.
		$original_key = self::resolve_key( $key );
		if ( ! $original_key ) {
			return false;
		}

		$settings = get_option( WPSOLVEX_AUTOAIBLOGGER_DB_OPTION, [] );

		if ( ! is_array( $settings ) ) {
			return true;
		}

		// Remove both possible key formats.
		unset( $settings[ $original_key ] );
		unset( $settings[ strtolower( $original_key ) ] );

		$settings = self::validate_settings_array( $settings );

		return update_option( WPSOLVEX_AUTOAIBLOGGER_DB_OPTION, $settings );
	}

	/**
	 * Bulk update multiple options with validation.
	 *
	 * @since 1.0.0
	 * @param array $options Array of key-value pairs to update.
	 * @return bool True on success, false on failure.
	 */
	public static function bulk_update_options( array $options ): bool {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		$settings = get_option( WPSOLVEX_AUTOAIBLOGGER_DB_OPTION, [] );

		if ( ! is_array( $settings ) ) {
			$settings = [];
		}

		$updated = false;

		foreach ( $options as $key => $value ) {
			$original_key = self::resolve_key( $key );
			if ( ! $original_key ) {
				continue;
			}

			$sanitized_value = self::sanitize_input( $original_key, $value );

			$boolean_fields = [ 'userOnboarded', 'enableLogging', 'emailNotificationEnabled' ];
			$is_valid_value = $sanitized_value !== false || in_array( $original_key, $boolean_fields, true );

			if ( $is_valid_value ) {
				$settings[ $original_key ] = $sanitized_value;
				$updated                   = true;
			}
		}

		if ( $updated ) {
			$settings = self::validate_settings_array( $settings );
			Settings::$dashboard_options = [];
			return update_option( WPSOLVEX_AUTOAIBLOGGER_DB_OPTION, $settings );
		}

		return true;
	}

	/**
	 * Sanitizes input values based on key type.
	 *
	 * @since 1.0.0
	 * @param string $key The option key.
	 * @param mixed  $value The value to sanitize.
	 * @return mixed|false Sanitized value or false on failure.
	 */
	private static function sanitize_input( string $key, $value ) {
		switch ( $key ) {
			case 'userOnboarded':
				return (bool) $value;

			case 'onboardingTab':
				$allowed_tabs = [ 'welcome', 'settings', 'license', 'complete' ];
				$value        = sanitize_key( $value );
				return in_array( $value, $allowed_tabs, true ) ? $value : 'welcome';

			case 'userName':
				return sanitize_text_field( $value );

			case 'userEmail':
				$email = sanitize_email( $value );
				return is_email( $email ) ? $email : false;

			case 'siteTitle':
			case 'siteFor':
				return sanitize_text_field( $value );

			case 'siteDescription':
				return sanitize_textarea_field( $value );

			case 'license':
				$license = sanitize_text_field( $value );
				// License key validation.
				if ( strlen( $license ) > 100 || ! preg_match( '/^[a-zA-Z0-9\-_]*$/', $license ) ) {
					return false;
				}
				return $license;

			case 'license_status':
				$allowed_statuses = [ 'licensed', 'unlicensed', 'expired', 'invalid' ];
				$status           = sanitize_key( $value );
				return in_array( $status, $allowed_statuses, true ) ? $status : 'unlicensed';

			case 'temperature':
				$temp = (float) $value;
				return max( 0, min( 2, $temp ) );

			case 'harassment':
			case 'hate':
			case 'sexuallyExplicit':
			case 'dangerousContent':
				$level = absint( $value );
				return max( 0, min( 4, $level ) );

			case 'postIdeas':
				// Convert to simple string format for easier handling.
				if ( is_array( $value ) ) {
					// Convert array to newline-separated string.
					$cleaned_ideas = [];
					foreach ( $value as $idea ) {
						if ( is_string( $idea ) ) {
							$sanitized_idea = sanitize_textarea_field( $idea );
							if ( ! empty( $sanitized_idea ) ) {
								$cleaned_ideas[] = $sanitized_idea;
							}
						}
					}
					// Limit to 50 ideas and join with newlines.
					$limited_ideas = array_slice( $cleaned_ideas, 0, 50 );
					return ! empty( $limited_ideas ) ? implode( "\n", $limited_ideas ) : '';
				}

				if ( is_string( $value ) ) {
					// Handle JSON string input by converting to array first, then to string.
					$decoded = json_decode( $value, true );
					if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
						// Recursively call with the decoded array.
						return self::sanitize_input( $key, $decoded );
					}

					// Try with stripslashes for double-escaped JSON.
					$unescaped = stripslashes( $value );
					$decoded   = json_decode( $unescaped, true );
					if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
						// Recursively call with the decoded array.
						return self::sanitize_input( $key, $decoded );
					}

					// If not JSON, treat as plain string (newline-separated ideas).
					return sanitize_textarea_field( $value );
				}

				// For any other type, return empty string.
				return '';

			case 'createdPostIdeas':
				// Handle JSON string of created post ideas {title: editUrl, ...}.
				if ( is_string( $value ) ) {
					// Try to decode JSON.
					$decoded = json_decode( $value, true );
					if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
						// Sanitize each title and URL.
						$sanitized = [];
						foreach ( $decoded as $title => $url ) {
							$clean_title = sanitize_textarea_field( $title );
							$clean_url   = esc_url_raw( $url );
							if ( ! empty( $clean_title ) && ! empty( $clean_url ) ) {
								$sanitized[ $clean_title ] = $clean_url;
							}
						}
						// Return as JSON string.
						return ! empty( $sanitized ) ? wp_json_encode( $sanitized ) : '';
					}

					// Try with stripslashes for double-escaped JSON.
					$unescaped = stripslashes( $value );
					$decoded   = json_decode( $unescaped, true );
					if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
						// Sanitize each title and URL.
						$sanitized = [];
						foreach ( $decoded as $title => $url ) {
							$clean_title = sanitize_textarea_field( $title );
							$clean_url   = esc_url_raw( $url );
							if ( ! empty( $clean_title ) && ! empty( $clean_url ) ) {
								$sanitized[ $clean_title ] = $clean_url;
							}
						}
						// Return as JSON string.
						return ! empty( $sanitized ) ? wp_json_encode( $sanitized ) : '';
					}

					// If not valid JSON, return empty string.
					return '';
				}

				// For any other type, return empty string.
				return '';

			case 'blogName':
			case 'adminEmail':
				if ( $key === 'adminEmail' ) {
					$email = sanitize_email( $value );
					return is_email( $email ) ? $email : false;
				}
				return sanitize_text_field( $value );

			case 'tokenTotal':
			case 'tokenRemaining':
				return absint( $value );

			case 'apiKey':
				$api_key = sanitize_text_field( $value );
				// Basic API key validation.
				if ( strlen( $api_key ) > 200 || ! preg_match( '/^[a-zA-Z0-9\-_\.]*$/', $api_key ) ) {
					return false;
				}
				return $api_key;

			case 'enableLogging':
				return (bool) $value;

			case 'emailNotificationEnabled':
				return (bool) $value;

			case 'emailNotificationValue':
				// Support multiple email addresses separated by commas.
				if ( empty( $value ) ) {
					return '';
				}
				$emails       = array_map( 'trim', explode( ',', $value ) );
				$valid_emails = [];
				foreach ( $emails as $email ) {
					$sanitized_email = sanitize_email( $email );
					if ( is_email( $sanitized_email ) ) {
						$valid_emails[] = $sanitized_email;
					}
				}
				// Return empty string if no valid emails (rather than false) to allow saving when disabled.
				return ! empty( $valid_emails ) ? implode( ', ', $valid_emails ) : '';

			default:
				// Unknown key type, apply basic sanitization.
				if ( is_string( $value ) ) {
					return sanitize_text_field( $value );
				}
				if ( is_array( $value ) ) {
					return array_map( 'sanitize_text_field', $value );
				}
				if ( is_bool( $value ) ) {
					return (bool) $value;
				}
				if ( is_numeric( $value ) ) {
					return is_float( $value ) ? (float) $value : absint( $value );
				}
				return false;
		}
	}

	/**
	 * Validates the entire settings array for security.
	 *
	 * @since 1.0.0
	 * @param array $settings Settings array to validate.
	 * @return array Validated settings array.
	 */
	private static function validate_settings_array( array $settings ): array {
		$validated = [];

		// Build a map: lowercase → camelCase for both formats.
		$key_map = [];
		foreach ( self::$allowed_keys as $camel_key ) {
			$key_map[ strtolower( $camel_key ) ] = $camel_key;
			$key_map[ $camel_key ]               = $camel_key;
		}

		foreach ( $settings as $key => $value ) {
			// Accept both lowercase DB keys and camelCase keys.
			if ( ! isset( $key_map[ $key ] ) ) {
				continue;
			}

			$original_key = $key_map[ $key ];

			// Boolean fields can have false as a valid value.
			$boolean_fields   = [ 'userOnboarded', 'enableLogging', 'emailNotificationEnabled' ];
			$is_boolean_field = in_array( $original_key, $boolean_fields, true );
			if ( $value !== false || $is_boolean_field ) {
				$validated[ $original_key ] = $value;
			}
		}

		return $validated;
	}
}
