/**
 * useAutoSave — debounced async-save helper for settings forms.
 *
 * Pass a `save(values)` async function and the latest `values`. The hook
 * debounces by `delay` ms, runs `save`, and toasts success/failure.
 *
 * Returns `{ saving }` so the caller can show a hint if needed.
 */
import { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { toast } from './toast';

export function useAutoSave( values, save, { delay = 600, skipFirst = true } = {} ) {
	const [ saving, setSaving ] = useState( false );
	const firstRunRef = useRef( true );
	const timerRef = useRef( null );
	const inFlightRef = useRef( null );

	useEffect( () => {
		if ( firstRunRef.current && skipFirst ) {
			firstRunRef.current = false;
			return undefined;
		}

		if ( timerRef.current ) {
			clearTimeout( timerRef.current );
		}

		timerRef.current = setTimeout( async () => {
			if ( inFlightRef.current ) {
				return;
			}
			inFlightRef.current = true;
			setSaving( true );
			try {
				await save( values );
				toast.success( __( 'Saved', 'solvex-ai-blogger' ) );
			} catch ( err ) {
				toast.error( err?.message || __( 'Save failed', 'solvex-ai-blogger' ) );
			} finally {
				inFlightRef.current = false;
				setSaving( false );
			}
		}, delay );

		return () => {
			if ( timerRef.current ) {
				clearTimeout( timerRef.current );
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ JSON.stringify( values ) ] );

	return { saving };
}

export default useAutoSave;
