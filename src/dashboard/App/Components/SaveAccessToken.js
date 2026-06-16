/**
 * SaveAccessToken — captures the access_key from the connect redirect.
 *
 * Runs on the admin page that the auth provider redirects back to (usually inside
 * the connect popup). It exchanges the access_key for a stored license, then either
 * messages the opener window (popup case) or updates state directly (popup-blocked
 * full-redirect fallback). The access_key is scrubbed from the URL immediately.
 */
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { connectLicense, applyConnectedState } from '@Utils/StoreConnect';

const getAccessKey = () => {
	try {
		return new URLSearchParams( window.location.search ).get( 'access_key' );
	} catch ( e ) {
		return null;
	}
};

const SaveAccessToken = () => {
	const dispatch = useDispatch();

	useEffect( () => {
		const accessKey = getAccessKey();
		if ( ! accessKey ) {
			return;
		}

		// Remove the access_key from the URL (history + referrer hygiene).
		try {
			const url = new URL( window.location.href );
			url.searchParams.delete( 'access_key' );
			window.history.replaceState( {}, document.title, url.toString() );
		} catch ( e ) {}

		const isPopup = !! ( window.opener && window.opener !== window );

		connectLicense( accessKey )
			.then( ( data ) => {
				if ( isPopup ) {
					try {
						window.opener.postMessage( { type: 'solvex-connected', data }, window.location.origin );
					} catch ( e ) {}
					// The opener closes us on receipt; this is only a fallback for a dead
					// opener, and is intentionally longer than the opener's watcher interval
					// so a self-close can't race ahead of the success message.
					window.setTimeout( () => window.close(), 2500 );
					return;
				}

				// Same-tab fallback (popup was blocked): apply state here.
				applyConnectedState( dispatch, data );
				dispatch( {
					type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
					payload: { message: __( 'Connected successfully!', 'solvex-ai-blogger' ), type: 'success', duration: 4000 },
				} );
			} )
			.catch( ( error ) => {
				if ( isPopup ) {
					try {
						window.opener.postMessage( { type: 'solvex-connect-error', message: error.message }, window.location.origin );
					} catch ( e ) {}
					window.setTimeout( () => window.close(), 2500 );
					return;
				}
				dispatch( {
					type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
					payload: { message: error.message || __( 'Connection failed.', 'solvex-ai-blogger' ), type: 'error', duration: 5000 },
				} );
			} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return null;
};

export default SaveAccessToken;
