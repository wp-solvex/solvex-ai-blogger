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
import { connectLicense } from '@Utils/StoreConnect';

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
					window.setTimeout( () => window.close(), 600 );
					return;
				}

				// Same-tab fallback (popup was blocked): apply state here.
				dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'licensed' } );
				if ( data.license !== undefined ) {
					dispatch( { type: 'UPDATE_LICENSE', payload: data.license } );
				}
				if ( data.connected_email !== undefined ) {
					dispatch( { type: 'UPDATE_CONNECTED_EMAIL', payload: data.connected_email } );
				}
				if ( data.plan !== undefined ) {
					dispatch( { type: 'UPDATE_PLAN', payload: data.plan } );
				}
				if ( data.tokenTotal !== undefined ) {
					dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: data.tokenTotal } );
				}
				if ( data.tokenRemaining !== undefined ) {
					dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: data.tokenRemaining } );
				}
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
					window.setTimeout( () => window.close(), 1200 );
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
