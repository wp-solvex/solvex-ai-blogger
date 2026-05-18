/**
 * Detect the user's prefers-reduced-motion preference.
 *
 * AppShell mirrors the result onto a data attribute so the CSS can
 * short-circuit `.animate-reveal` and similar animations.
 */
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion() {
	const [ reduced, setReduced ] = useState(
		typeof window !== 'undefined' && window.matchMedia
			? window.matchMedia( QUERY ).matches
			: false
	);

	useEffect( () => {
		if ( typeof window === 'undefined' || ! window.matchMedia ) {
			return undefined;
		}
		const mql = window.matchMedia( QUERY );
		const handler = ( event ) => setReduced( event.matches );
		mql.addEventListener( 'change', handler );
		return () => mql.removeEventListener( 'change', handler );
	}, [] );

	return reduced;
}

export default useReducedMotion;
