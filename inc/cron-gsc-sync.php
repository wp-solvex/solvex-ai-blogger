<?php
/**
 * Google Search Console daily analytics sync for Solvex AI Blogger.
 *
 * Maintains a small local cache (top 100 keywords) of Search Console performance
 * data in a custom table, refreshed once per day via WP-Cron. Keeping the data
 * local means the dashboard renders instantly without hitting Google on every view.
 *
 * @package solvex-ai-blogger
 * @subpackage Inc
 * @since 1.0.5
 */

namespace WPSolvex\AutoAIBlogger\Inc;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;
use WPSolvex\AutoAIBlogger\Inc\Utils\Helper;
use WPSolvex\AutoAIBlogger\Inc\Integrations\Google_Search_Console;

defined( 'ABSPATH' ) || exit;

/**
 * Google Search Console daily sync class.
 *
 * @since 1.0.5
 */
class Cron_GSC_Sync {
	use Get_Instance;

	/**
	 * Cron hook name for the daily sync.
	 *
	 * @var string
	 */
	public const CRON_HOOK = 'solvex_gsc_daily_sync';

	/**
	 * Schema version for the custom table (bump to trigger a dbDelta upgrade).
	 *
	 * @var string
	 */
	private const DB_VERSION = '1';

	/**
	 * Option key storing the installed table schema version.
	 *
	 * @var string
	 */
	private const DB_VERSION_OPTION = 'wpsolvex_autoaiblogger_gsc_db_version';

	/**
	 * Constructor. Registers the cron hook and ensures scheduling + table install.
	 *
	 * @since 1.0.5
	 */
	protected function __construct() {
		add_action( self::CRON_HOOK, [ $this, 'run_sync' ] );
		add_action( 'init', [ $this, 'maybe_schedule' ] );
		add_action( 'init', [ $this, 'maybe_install_table' ] );
	}

	/**
	 * Fully-qualified custom table name.
	 *
	 * @since 1.0.5
	 * @return string
	 */
	public static function get_table_name(): string {
		global $wpdb;
		return $wpdb->prefix . 'solvex_gsc_keywords';
	}

	/**
	 * Ensure the daily cron event is scheduled.
	 *
	 * @since 1.0.5
	 * @return void
	 */
	public function maybe_schedule(): void {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time(), 'daily', self::CRON_HOOK );
		}
	}

	/**
	 * Ensure the custom table exists / is up to date (version-gated).
	 *
	 * @since 1.0.5
	 * @return void
	 */
	public function maybe_install_table(): void {
		if ( get_option( self::DB_VERSION_OPTION ) === self::DB_VERSION ) {
			return;
		}
		self::install_table();
		update_option( self::DB_VERSION_OPTION, self::DB_VERSION, false );
	}

	/**
	 * Create or update the custom keywords table via dbDelta.
	 *
	 * @since 1.0.5
	 * @return void
	 */
	public static function install_table(): void {
		global $wpdb;

		$table_name      = self::get_table_name();
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			keyword VARCHAR(191) NOT NULL,
			clicks INT NOT NULL DEFAULT 0,
			impressions INT NOT NULL DEFAULT 0,
			ctr FLOAT NOT NULL DEFAULT 0,
			position FLOAT NOT NULL DEFAULT 0,
			PRIMARY KEY  (id),
			UNIQUE KEY keyword (keyword)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Run the daily sync: pull the latest top-100 keywords and replace the cache.
	 *
	 * Public so the dashboard can trigger an on-demand "sync now".
	 *
	 * @since 1.0.5
	 * @return array Structured result: [ 'success' => bool, 'count'|'code'|'message' => … ].
	 */
	public function run_sync(): array {
		global $wpdb;

		$property = sanitize_text_field( Helper::get_option( 'gscPropertyUrl', '' ) );
		if ( '' === $property ) {
			return [
				'success' => false,
				'code'    => 'no_property',
				'message' => __( 'No Search Console property selected.', 'solvex-ai-blogger' ),
			];
		}

		$access_token = Google_Search_Console::get_instance()->maybe_refresh_token();
		if ( '' === $access_token ) {
			return [
				'success' => false,
				'code'    => 'not_connected',
				'message' => __( 'Google Search Console is not connected.', 'solvex-ai-blogger' ),
			];
		}

		$endpoint = 'https://searchconsole.googleapis.com/webmasters/v3/sites/' . rawurlencode( $property ) . '/searchAnalytics/query';

		$response = wp_remote_post(
			$endpoint,
			[
				'timeout'     => 20,
				'redirection' => 0,
				'headers'     => [
					'Authorization' => 'Bearer ' . $access_token,
					'Content-Type'  => 'application/json',
				],
				'body'        => wp_json_encode(
					[
						'startDate'  => gmdate( 'Y-m-d', time() - 30 * DAY_IN_SECONDS ),
						'endDate'    => gmdate( 'Y-m-d' ),
						'dimensions' => [ 'query' ],
						'rowLimit'   => 100,
					]
				),
			]
		);

		if ( is_wp_error( $response ) ) {
			$this->log( 'searchAnalytics request failed: ' . $response->get_error_message() );
			return [
				'success' => false,
				'code'    => 'api_error',
				'message' => $response->get_error_message(),
			];
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status < 200 || $status >= 300 ) {
			$message = isset( $body['error']['message'] ) ? sanitize_text_field( $body['error']['message'] ) : 'Search Console API error';
			$this->log( 'searchAnalytics returned status ' . $status . ': ' . $message );
			return [
				'success' => false,
				'code'    => 401 === $status ? 'needs_reauth' : 'api_error',
				'message' => $message,
			];
		}

		$rows = ( is_array( $body ) && ! empty( $body['rows'] ) && is_array( $body['rows'] ) ) ? $body['rows'] : [];

		$table_name = self::get_table_name();

		// Replace the whole cache with the fresh top-100 (enforces the row cap).
		$wpdb->query( "DELETE FROM {$table_name}" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Truncating a small plugin-owned cache table; table name is internal.

		$inserted = 0;
		foreach ( $rows as $row ) {
			$keyword = ( ! empty( $row['keys'][0] ) ) ? sanitize_text_field( $row['keys'][0] ) : '';
			if ( '' === $keyword ) {
				continue;
			}

			$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Writing to the plugin-owned cache table.
				$table_name,
				[
					'keyword'     => $keyword,
					'clicks'      => isset( $row['clicks'] ) ? (int) $row['clicks'] : 0,
					'impressions' => isset( $row['impressions'] ) ? (int) $row['impressions'] : 0,
					'ctr'         => isset( $row['ctr'] ) ? (float) $row['ctr'] : 0,
					'position'    => isset( $row['position'] ) ? (float) $row['position'] : 0,
				],
				[ '%s', '%d', '%d', '%f', '%f' ]
			);
			++$inserted;
		}

		return [
			'success' => true,
			'count'   => $inserted,
		];
	}

	/**
	 * Log a diagnostic message when WP_DEBUG is enabled.
	 *
	 * @param string $message Context message.
	 * @since 1.0.5
	 * @return void
	 */
	private function log( string $message ): void {
		if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
			return;
		}
		error_log( '[Solvex GSC Sync] ' . $message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Gated behind WP_DEBUG.
	}
}
