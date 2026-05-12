/**
 * Tests for the useReducedMotion hook.
 */
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../../src/dashboard/Utils/useReducedMotion';

function mockMatchMedia( matches ) {
	const listeners = new Set();
	const mql = {
		matches,
		media: '(prefers-reduced-motion: reduce)',
		onchange: null,
		addEventListener: ( _e, h ) => listeners.add( h ),
		removeEventListener: ( _e, h ) => listeners.delete( h ),
		dispatchEvent: () => true,
	};
	window.matchMedia = jest.fn().mockReturnValue( mql );
	return { mql, listeners };
}

describe( 'useReducedMotion', () => {
	it( 'returns the initial matches value', () => {
		mockMatchMedia( true );
		const { result } = renderHook( () => useReducedMotion() );
		expect( result.current ).toBe( true );
	} );

	it( 'updates when the media query changes', () => {
		const { listeners } = mockMatchMedia( false );
		const { result } = renderHook( () => useReducedMotion() );
		expect( result.current ).toBe( false );

		act( () => {
			listeners.forEach( ( h ) => h( { matches: true } ) );
		} );

		expect( result.current ).toBe( true );
	} );
} );
