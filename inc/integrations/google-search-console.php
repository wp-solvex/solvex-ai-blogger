<?php
/**
 * Google Search Console integration for Solvex AI Blogger.
 *
 * Handles the Google Search Console OAuth flow. The dashboard sends the user
 * straight to Google's consent screen; Google redirects to a standalone
 * server-side callback (WPSOLVEX_AUTOAIBLOGGER_GSC_CALLBACK_URL) that exchanges
 * the authorization code for tokens and redirects back to this site with a
 * Base64-encoded JSON payload. This class intercepts that payload, stores the
 * tokens securely, and exposes helpers used by the dashboard (connection
 * status, connect/disconnect URLs).
 *
 * Tokens are stored in their own option (not the shared settings option) to
 * avoid the settings save key-casing normalization and to keep credentials
 * isolated.
 *
 * @package solvex-ai-blogger
 * @subpackage Inc\Integrations
 * @since 1.0.4
 */

namespace WPSolvex\AutoAIBlogger\Inc\Integrations;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;

defined( 'ABSPATH' ) || exit;

/**
 * Google Search Console integration class.
 *
 * @since 1.0.4
 */
class Google_Search_Console {
	use Get_Instance;

	/**
	 * Option name where the GSC OAuth tokens are stored.
	 *
	 * @var string
	 */
	public const TOKENS_OPTION = 'wpsolvex_autoaiblogger_gsc_tokens';

	/**
	 * Nonce action used for the disconnect request.
	 *
	 * @var string
	 */
	private const DISCONNECT_NONCE_ACTION = 'wpsolvex_autoaiblogger_gsc_disconnect';

	/**
	 * Constructor. Registers admin hooks.
	 *
	 * @since 1.0.4
	 */
	protected function __construct() {
		add_action( 'admin_init', [ $this, 'maybe_handle_oauth_payload' ] );
		add_action( 'admin_init', [ $this, 'maybe_handle_disconnect' ] );
	}

	/**
	 * Intercept the OAuth payload returned by the relay and persist the tokens.
	 *
	 * The relay redirects back to the WordPress admin with a `gsc_auth_payload`
	 * query argument containing Base64-encoded JSON. We decode it, validate the
	 * access token, store the credentials, then redirect to a clean URL on the
	 * Search Console tab so the long payload never lingers in the address bar.
	 *
	 * @since 1.0.4
	 * @return void
	 */
	public function maybe_handle_oauth_payload(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- OAuth callback originates from the external relay and cannot carry a WP nonce; access is gated by the capability check below.
		if ( empty( $_GET['gsc_auth_payload'] ) ) {
			return;
		}

		// Only a privileged user connecting their own site may store credentials.
		if ( ! current_user_can( WPSOLVEX_AUTOAIBLOGGER_CAPABILITY ) ) {
			return;
		}

		$raw_payload = wp_unslash( $_GET['gsc_auth_payload'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Base64/JSON payload is validated and decoded below; sanitize_text_field would corrupt it.
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$token_data = $this->decode_token_payload( (string) $raw_payload );

		if ( ! is_array( $token_data ) || empty( $token_data['access_token'] ) ) {
			$this->log_debug( 'Invalid OAuth payload received from callback.', (string) $raw_payload );
			$this->redirect_to_tab( [ 'gsc_error' => 'invalid_payload' ] );
			return;
		}

		$expires_in = isset( $token_data['expires_in'] ) ? absint( $token_data['expires_in'] ) : 3600;

		$tokens = [
			'access_token'  => sanitize_text_field( $token_data['access_token'] ),
			// Refresh token is only returned on first consent; keep any existing one otherwise.
			'refresh_token' => ! empty( $token_data['refresh_token'] )
				? sanitize_text_field( $token_data['refresh_token'] )
				: $this->get_refresh_token(),
			'scope'         => isset( $token_data['scope'] ) ? sanitize_text_field( $token_data['scope'] ) : '',
			'expires_at'    => time() + $expires_in - 60,
			'connected_at'  => time(),
		];

		update_option( self::TOKENS_OPTION, $tokens, false );

		do_action( 'wpsolvex_autoaiblogger_gsc_connected', $tokens );

		$this->redirect_to_tab( [ 'gsc_connected' => 'success' ] );
	}

	/**
	 * Handle a disconnect request from the dashboard.
	 *
	 * @since 1.0.4
	 * @return void
	 */
	public function maybe_handle_disconnect(): void {
		if ( empty( $_GET['gsc_action'] ) || 'disconnect' !== $_GET['gsc_action'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce verified immediately below.
			return;
		}

		if ( ! current_user_can( WPSOLVEX_AUTOAIBLOGGER_CAPABILITY ) ) {
			return;
		}

		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, self::DISCONNECT_NONCE_ACTION ) ) {
			return;
		}

		delete_option( self::TOKENS_OPTION );

		// Clear the locally cached keywords so disconnected state shows no stale data.
		global $wpdb;
		$table_name = $wpdb->prefix . 'solvex_gsc_keywords';
		$wpdb->query( "DELETE FROM {$table_name}" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Clearing the plugin-owned cache table; table name is internal.

		do_action( 'wpsolvex_autoaiblogger_gsc_disconnected' );

		$this->redirect_to_tab( [ 'gsc_disconnected' => 'success' ] );
	}

	/**
	 * Whether the site currently has stored GSC credentials.
	 *
	 * @since 1.0.4
	 * @return bool
	 */
	public static function is_connected(): bool {
		$tokens = get_option( self::TOKENS_OPTION, [] );
		return is_array( $tokens ) && ! empty( $tokens['access_token'] );
	}

	/**
	 * Get the stored tokens array.
	 *
	 * @since 1.0.4
	 * @return array
	 */
	public static function get_tokens(): array {
		$tokens = get_option( self::TOKENS_OPTION, [] );
		return is_array( $tokens ) ? $tokens : [];
	}

	/**
	 * Return a valid access token, refreshing it first if it has (nearly) expired.
	 *
	 * Tokens are short-lived (~1h). When `expires_at` is within a 60s buffer of now,
	 * this exchanges the stored `refresh_token` for a fresh access token via the relay
	 * (which holds the client secret) and persists the new token + expiry.
	 *
	 * @since 1.0.5
	 * @return string A valid access token, or '' if none is available.
	 */
	public function maybe_refresh_token(): string {
		$tokens       = self::get_tokens();
		$access_token = isset( $tokens['access_token'] ) ? (string) $tokens['access_token'] : '';
		$expires_at   = isset( $tokens['expires_at'] ) ? (int) $tokens['expires_at'] : 0;

		// Still valid -> return the existing token immediately.
		if ( '' !== $access_token && $expires_at > time() + 60 ) {
			return $access_token;
		}

		$refresh_token = isset( $tokens['refresh_token'] ) ? (string) $tokens['refresh_token'] : '';
		if ( '' === $refresh_token ) {
			return $access_token;
		}

		$response = wp_remote_post(
			WPSOLVEX_AUTOAIBLOGGER_GSC_REFRESH_URL,
			[
				'timeout' => 15,
				'body'    => [ 'refresh_token' => $refresh_token ],
			]
		);

		if ( is_wp_error( $response ) ) {
			$this->log_debug( 'Token refresh request failed: ' . $response->get_error_message() );
			return $access_token;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status < 200 || $status >= 300 || ! is_array( $body ) || empty( $body['access_token'] ) ) {
			$this->log_debug( 'Token refresh returned an unexpected response (status ' . $status . ').' );
			return $access_token;
		}

		$expires_in = isset( $body['expires_in'] ) ? absint( $body['expires_in'] ) : 3600;

		$tokens['access_token'] = sanitize_text_field( $body['access_token'] );
		// A refresh response may omit refresh_token; keep the existing one.
		if ( ! empty( $body['refresh_token'] ) ) {
			$tokens['refresh_token'] = sanitize_text_field( $body['refresh_token'] );
		}
		if ( isset( $body['scope'] ) ) {
			$tokens['scope'] = sanitize_text_field( $body['scope'] );
		}
		$tokens['expires_at'] = time() + $expires_in - 60;

		update_option( self::TOKENS_OPTION, $tokens, false );

		return (string) $tokens['access_token'];
	}

	/**
	 * Fetch the list of Search Console properties the connected account can access.
	 *
	 * Calls the Webmasters API `sites.list` endpoint with the stored access token.
	 * Returns a structured result so callers (REST/UI) can react to each state:
	 * - success:      [ 'success' => true, 'sites' => [ { siteUrl, permissionLevel }, ... ] ]
	 * - not connected:[ 'success' => false, 'code' => 'not_connected', 'message' => ... ]
	 * - token expired:[ 'success' => false, 'code' => 'needs_reauth', 'message' => ... ]
	 * - other errors: [ 'success' => false, 'code' => 'api_error', 'message' => ..., 'status' => int ]
	 *
	 * Note: the token is refreshed first via maybe_refresh_token(); a persistent 401
	 * (e.g. revoked access) is surfaced as `needs_reauth` for the UI to prompt a reconnect.
	 *
	 * @since 1.0.5
	 * @return array Structured result (see above).
	 */
	public function get_verified_sites(): array {
		$access_token = $this->maybe_refresh_token();

		if ( '' === $access_token ) {
			return [
				'success' => false,
				'code'    => 'not_connected',
				'message' => __( 'Google Search Console is not connected.', 'solvex-ai-blogger' ),
			];
		}

		$response = wp_remote_get(
			'https://www.googleapis.com/webmasters/v3/sites',
			[
				'timeout' => 15,
				'headers' => [
					'Authorization' => 'Bearer ' . $access_token,
					'Accept'        => 'application/json',
				],
			]
		);

		if ( is_wp_error( $response ) ) {
			return [
				'success' => false,
				'code'    => 'api_error',
				'message' => $response->get_error_message(),
				'status'  => 0,
			];
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 401 === $status ) {
			return [
				'success' => false,
				'code'    => 'needs_reauth',
				'message' => __( 'Your Google connection has expired. Please reconnect.', 'solvex-ai-blogger' ),
				'status'  => $status,
			];
		}

		if ( $status < 200 || $status >= 300 ) {
			$message = isset( $body['error']['message'] )
				? sanitize_text_field( $body['error']['message'] )
				: __( 'Could not load Search Console properties.', 'solvex-ai-blogger' );

			return [
				'success' => false,
				'code'    => 'api_error',
				'message' => $message,
				'status'  => $status,
			];
		}

		$entries = ( is_array( $body ) && ! empty( $body['siteEntry'] ) && is_array( $body['siteEntry'] ) )
			? $body['siteEntry']
			: [];

		$sites = [];
		foreach ( $entries as $entry ) {
			if ( empty( $entry['siteUrl'] ) ) {
				continue;
			}
			$sites[] = [
				'siteUrl'         => sanitize_text_field( $entry['siteUrl'] ),
				'permissionLevel' => isset( $entry['permissionLevel'] ) ? sanitize_text_field( $entry['permissionLevel'] ) : '',
			];
		}

		return [
			'success' => true,
			'sites'   => $sites,
		];
	}

	/**
	 * Build the Google OAuth consent URL that starts the connection flow.
	 *
	 * Encodes the Search Console tab URL into the OAuth `state` parameter so the
	 * server-side callback can redirect the user back to the right place.
	 *
	 * @since 1.0.4
	 * @return string
	 */
	public static function get_connect_url(): string {
		$redirect = self::get_tab_url();

		// Public Google OAuth client ID for the Solvex relay app.
		$client_id    = '242609428505-hc6vd8b740qua68n83qgpj8n95cs4jpn.apps.googleusercontent.com';
		$redirect_uri = WPSOLVEX_AUTOAIBLOGGER_GSC_CALLBACK_URL;

		// We encode the return URL into Google's 'state' parameter
		$state_payload = base64_encode( $redirect );

		// Define the required APIs
		$scopes = urlencode('https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/siteverification');

		// Construct the direct Google Login URL
		$auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" .
			"client_id=" . $client_id .
			"&redirect_uri=" . urlencode($redirect_uri) .
			"&response_type=code" .
			"&scope=" . $scopes .
			"&access_type=offline" .
			"&prompt=consent" .
			"&state=" . $state_payload;

		return esc_url_raw( $auth_url );
	}

	/**
	 * Build the nonce-protected disconnect URL.
	 *
	 * @since 1.0.4
	 * @return string
	 */
	public static function get_disconnect_url(): string {
		$url = add_query_arg(
			[
				'gsc_action' => 'disconnect',
				'_wpnonce'   => wp_create_nonce( self::DISCONNECT_NONCE_ACTION ),
			],
			self::get_tab_url()
		);

		return esc_url_raw( $url );
	}

	/**
	 * Get the stored refresh token, if any.
	 *
	 * @since 1.0.4
	 * @return string
	 */
	private function get_refresh_token(): string {
		$tokens = self::get_tokens();
		return isset( $tokens['refresh_token'] ) ? (string) $tokens['refresh_token'] : '';
	}

	/**
	 * Absolute admin URL of the Search Console dashboard tab.
	 *
	 * @since 1.0.4
	 * @return string
	 */
	private static function get_tab_url(): string {
		return admin_url( 'edit.php?page=' . WPSOLVEX_AUTOAIBLOGGER_SLUG . '&path=search-console' );
	}

	/**
	 * Decode the token payload returned by the OAuth callback.
	 *
	 * The relay encodes the JSON token data as a pure hexadecimal string (to pass
	 * cleanly through firewalls). For robustness this also accepts raw JSON or a
	 * Base64 / Base64URL encoded JSON string, tolerating URL transport quirks
	 * (`+` decoded to a space, missing padding).
	 *
	 * @param string $raw The raw payload from the request.
	 * @since 1.0.4
	 * @return array|null Decoded token data, or null on failure.
	 */
	private function decode_token_payload( string $raw ): ?array {
		$raw = trim( $raw );
		if ( '' === $raw ) {
			return null;
		}

		// 1) The payload may already be plain JSON.
		$direct = json_decode( $raw, true );
		if ( is_array( $direct ) ) {
			return $direct;
		}

		// 2) The relay encodes the JSON as a pure hexadecimal string (firewall-safe).
		if ( 0 === strlen( $raw ) % 2 && ctype_xdigit( $raw ) ) {
			$hex_decoded = hex2bin( $raw );
			if ( is_string( $hex_decoded ) && '' !== $hex_decoded ) {
				$hex_data = json_decode( $hex_decoded, true );
				if ( is_array( $hex_data ) ) {
					return $hex_data;
				}
			}
		}

		// 3) Otherwise treat it as Base64 / Base64URL encoded JSON.
		$normalized = strtr( $raw, ' ', '+' );          // Restore '+' lost in URL transport.
		$normalized = strtr( $normalized, '-_', '+/' ); // Base64URL -> standard Base64.

		$remainder = strlen( $normalized ) % 4;
		if ( $remainder > 0 ) {
			$normalized .= str_repeat( '=', 4 - $remainder );
		}

		$decoded = base64_decode( $normalized, false ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decoding a transport-encoded OAuth payload, not obfuscation.
		if ( ! is_string( $decoded ) || '' === $decoded ) {
			return null;
		}

		$data = json_decode( $decoded, true );
		return is_array( $data ) ? $data : null;
	}

	/**
	 * Log a diagnostic message when WP_DEBUG is enabled.
	 *
	 * @param string $message Context message.
	 * @param string $payload Raw payload (truncated) to aid diagnosis.
	 * @since 1.0.4
	 * @return void
	 */
	private function log_debug( string $message, string $payload = '' ): void {
		if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
			return;
		}

		$snippet = '' !== $payload ? ' Payload: ' . substr( $payload, 0, 500 ) : '';
		error_log( '[Solvex GSC] ' . $message . $snippet ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Gated behind WP_DEBUG for OAuth diagnostics.
	}

	/**
	 * Redirect to the Search Console tab with the given query args and exit.
	 *
	 * @param array $args Query args to append to the tab URL.
	 * @since 1.0.4
	 * @return void
	 */
	private function redirect_to_tab( array $args ): void {
		$url = add_query_arg( $args, self::get_tab_url() );
		wp_safe_redirect( $url );
		exit;
	}
}
