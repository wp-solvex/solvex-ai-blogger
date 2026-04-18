<?php

namespace SureCart\Licensing;

// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound

defined( 'ABSPATH' ) || exit;

/**
 * This class will handle the updates.
 */
class Updater {
	/**
	 * SureCart\Licensing\Client.
	 *
	 * @var object
	 */
	protected $client;

	/**
	 * Holds the cache key for the version info.
	 *
	 * @var string
	 */
	private $cache_key; // Declared as private.

	/**
	 * Initialize the class.
	 *
	 * @param SureCart\Licensing\Client $client The client.
	 */
	public function __construct( Client $client ) {
		$this->client    = $client;
		$this->cache_key = 'autoaib_' . md5( $this->client->slug ) . '_version_info';
	}

	/**
	 * Get version info from database
	 *
	 * @return Object or Boolean
	 */
	private function get_cached_version_info() {
		global $pagenow;
		// If updater page then force fetch.
		if ( $pagenow === 'update-core.php' ) {
			return false;
		}

		return get_transient( $this->cache_key );
	}

	/**
	 * Set version info to database.
	 *
	 * @param Object $value Version info to store in the transient.
	 */
	private function set_cached_version_info( $value ): void {
		if ( ! $value ) {
			return;
		}
		// cache for 3 hours.
		set_transient( $this->cache_key, $value, 3 * HOUR_IN_SECONDS );
	}

	/**
	 * Get plugin info from SureCart\Licensing
	 */
	private function get_project_latest_version() {
		$current_release = $this->client->license()->get_current_release( 3 * HOUR_IN_SECONDS );

		if ( is_wp_error( $current_release ) || empty( $current_release ) ) {
			return false;
		}

		$release = $current_release->release_json;

		// must have a slug.
		if ( ! isset( $release->slug ) ) {
			return false;
		}

		// set the new version.
		$release->new_version = $release->version;

		if ( empty( $release->last_updated ) ) {
			$release->last_updated = date_i18n( get_option( 'date_format' ), $current_release->updated_at ?? time() );
		}

		if ( isset( $current_release->url ) ) {
			$release->package = $current_release->url;
		}

		if ( isset( $release->banners ) ) {
			$release->banners = (array) $release->banners;
		}

		if ( isset( $release->sections ) ) {
			$release->sections = (array) $release->sections;
		}

		return $release;
	}

	/**
	 * Get version information
	 */
	private function get_version_info() {
		$version_info = $this->get_cached_version_info();

		if ( $version_info === false ) {
			$version_info = $this->get_project_latest_version();
			$this->set_cached_version_info( $version_info );
		}

		return $version_info;
	}
}
