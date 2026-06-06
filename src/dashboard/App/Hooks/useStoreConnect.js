/**
 * useStoreConnect — drives the one-click connect popup, account switching and disconnect.
 *
 * Success arrives via window.postMessage from the popup (SaveAccessToken); a light
 * watcher handles popup-close (cancel) and a 5-minute timeout. If the popup is
 * blocked we fall back to a full-page redirect.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { getConnectUrl, disconnectLicense, applyConnectedState } from '@Utils/StoreConnect';

const WATCH_INTERVAL = 1000;
const CONNECT_TIMEOUT = 300000; // 5 minutes.

export default function useStoreConnect() {
	const dispatch = useDispatch();
	const [ isConnecting, setIsConnecting ] = useState( false );
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );

	const watcherRef = useRef( null );
	const popupRef = useRef( null );
	const startedAtRef = useRef( 0 );
	const listenerRef = useRef( null );
	const isConnectingRef = useRef( false ); // Synchronous re-entrancy guard.

	const notify = useCallback( ( message, type = 'success', duration = 4000 ) => {
		dispatch( { type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION', payload: { message, type, duration } } );
	}, [ dispatch ] );

	const applyConnected = useCallback( ( data = {} ) => {
		applyConnectedState( dispatch, data );
	}, [ dispatch ] );

	const cleanup = useCallback( () => {
		if ( watcherRef.current ) {
			clearInterval( watcherRef.current );
			watcherRef.current = null;
		}
		if ( listenerRef.current ) {
			window.removeEventListener( 'message', listenerRef.current );
			listenerRef.current = null;
		}
		if ( popupRef.current && ! popupRef.current.closed ) {
			popupRef.current.close();
		}
		popupRef.current = null;
		isConnectingRef.current = false;
		setIsConnecting( false );
	}, [] );

	const connect = useCallback( async ( { force = false } = {} ) => {
		if ( isConnectingRef.current ) {
			return;
		}
		isConnectingRef.current = true;
		setIsConnecting( true );

		try {
			const data = await getConnectUrl( force );

			// Already connected (only when not forcing a switch).
			if ( data && data.auth_url === null ) {
				applyConnected( data );
				isConnectingRef.current = false;
				setIsConnecting( false );
				notify( __( 'Already connected.', 'solvex-ai-blogger' ), 'info', 3000 );
				return;
			}

			const authUrl = data.auth_url;
			const popup = window.open( authUrl, 'solvex_connect', 'width=620,height=780,scrollbars=yes,resizable=yes' );

			// Popup blocked → fall back to a full-page redirect (reset state first in case
			// the navigation is deferred or the page is restored from bfcache).
			if ( ! popup || popup.closed || typeof popup.closed === 'undefined' ) {
				isConnectingRef.current = false;
				setIsConnecting( false );
				window.location.href = authUrl;
				return;
			}

			popupRef.current = popup;
			startedAtRef.current = Date.now();

			// Success channel: the popup posts the connection result back to us.
			const onMessage = ( event ) => {
				// Only trust a message from our own popup, on our own origin.
				if ( event.origin !== window.location.origin || event.source !== popupRef.current || ! event.data ) {
					return;
				}
				if ( event.data.type === 'solvex-connected' ) {
					applyConnected( event.data.data || {} );
					cleanup();
					notify( __( 'Connected successfully!', 'solvex-ai-blogger' ), 'success', 4000 );
				} else if ( event.data.type === 'solvex-connect-error' ) {
					cleanup();
					notify( event.data.message || __( 'Connection failed.', 'solvex-ai-blogger' ), 'error', 5000 );
				}
			};
			listenerRef.current = onMessage;
			window.addEventListener( 'message', onMessage );

			// Watcher: handle the user closing the popup, and the overall timeout.
			watcherRef.current = setInterval( () => {
				if ( Date.now() - startedAtRef.current > CONNECT_TIMEOUT ) {
					cleanup();
					notify( __( 'Connection timed out. Please try again.', 'solvex-ai-blogger' ), 'error', 5000 );
					return;
				}
				if ( popupRef.current && popupRef.current.closed ) {
					cleanup();
					notify( __( 'Connection cancelled.', 'solvex-ai-blogger' ), 'info', 4000 );
				}
			}, WATCH_INTERVAL );
		} catch ( error ) {
			isConnectingRef.current = false;
			setIsConnecting( false );
			notify( error.message || __( 'Unable to start the connection.', 'solvex-ai-blogger' ), 'error', 5000 );
		}
	}, [ applyConnected, cleanup, notify ] );

	const switchAccount = useCallback( () => {
		// eslint-disable-next-line no-alert
		if ( window.confirm( __( 'This will replace your current connection. Continue?', 'solvex-ai-blogger' ) ) ) {
			connect( { force: true } );
		}
	}, [ connect ] );

	const disconnect = useCallback( async () => {
		if ( isDisconnecting ) {
			return;
		}
		setIsDisconnecting( true );
		try {
			await disconnectLicense();
			dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'unlicensed' } );
			dispatch( { type: 'UPDATE_LICENSE', payload: '' } );
			dispatch( { type: 'UPDATE_CONNECTED_EMAIL', payload: '' } );
			dispatch( { type: 'UPDATE_PLAN', payload: '' } );
			dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: 0 } );
			dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: 0 } );
			notify( __( 'Disconnected successfully.', 'solvex-ai-blogger' ), 'success', 3000 );
		} catch ( error ) {
			notify( error.message || __( 'Unable to disconnect.', 'solvex-ai-blogger' ), 'error', 5000 );
		} finally {
			setIsDisconnecting( false );
		}
	}, [ isDisconnecting, dispatch, notify ] );

	useEffect( () => () => cleanup(), [ cleanup ] );

	return { isConnecting, isDisconnecting, connect, switchAccount, disconnect };
}
