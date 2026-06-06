/**
 * Store connection helpers (one-click "Connect to wpaiblogger.com").
 *
 * These talk to the admin-ajax endpoints registered in admin/licensing.php:
 *  - wpsolvex_autoaiblogger_get_connect_url   -> returns the auth-provider URL (or null when connected)
 *  - wpsolvex_autoaiblogger_connect_license   -> exchanges the returned access_key for a stored license
 *  - wpsolvex_autoaiblogger_deactivate_license-> disconnects + frees the store activation slot
 */
import apiFetch from '@wordpress/api-fetch';

const getConfig = () => {
	const data = typeof wpsolvex_autoaiblogger_localized_data !== 'undefined' ? wpsolvex_autoaiblogger_localized_data : {};
	return {
		ajaxUrl: data.ajax_url || '',
		nonce: data.licensing_nonce || '',
	};
};

const postAjax = async ( action, extra = {} ) => {
	const { ajaxUrl, nonce } = getConfig();
	const formData = new window.FormData();
	formData.append( 'action', action );
	formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', nonce );
	Object.keys( extra ).forEach( ( key ) => formData.append( key, extra[ key ] ) );

	return apiFetch( {
		url: ajaxUrl,
		method: 'POST',
		body: formData,
		timeout: 30000,
	} );
};

/**
 * Ask the backend for the auth-provider URL. Returns { auth_url, ... } where
 * auth_url is null once the site is already connected (unless force is true,
 * which is used when switching to a different account).
 *
 * @param {boolean} force When true, always return a fresh auth URL even if connected.
 * @return {Promise<Object>} The response data object.
 */
export const getConnectUrl = async ( force = false ) => {
	const response = await postAjax( 'wpsolvex_autoaiblogger_get_connect_url', force ? { force: '1' } : {} );
	if ( ! response?.success ) {
		throw new Error( response?.data?.message || 'Unable to start the connection.' );
	}
	return response.data || {};
};

/**
 * Exchange the encrypted access_key from the provider for a stored license + tokens.
 *
 * @param {string} accessKey The access_key returned in the redirect URL.
 * @return {Promise<Object>} The response data object on success.
 */
export const connectLicense = async ( accessKey ) => {
	const response = await postAjax( 'wpsolvex_autoaiblogger_connect_license', { access_key: accessKey } );
	if ( ! response?.success ) {
		throw new Error( response?.data?.message || 'Unable to complete the connection.' );
	}
	return response.data || {};
};

/**
 * Disconnect the current site (clears the license and frees the store activation slot).
 *
 * @return {Promise<Object>} The response data object on success.
 */
export const disconnectLicense = async () => {
	const response = await postAjax( 'wpsolvex_autoaiblogger_deactivate_license' );
	if ( ! response?.success ) {
		throw new Error( response?.data?.message || 'Unable to disconnect.' );
	}
	return response.data || {};
};
