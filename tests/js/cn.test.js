/**
 * Tests for the `cn` class-name composer.
 */
import { cn } from '../../src/dashboard/Utils/cn';

describe( 'cn()', () => {
	it( 'joins string class names', () => {
		expect( cn( 'a', 'b', 'c' ) ).toBe( 'a b c' );
	} );

	it( 'drops falsy values', () => {
		expect( cn( 'a', null, undefined, false, 'b' ) ).toBe( 'a b' );
	} );

	it( 'resolves conflicting Tailwind utilities (twMerge)', () => {
		expect( cn( 'p-2', 'p-4' ) ).toBe( 'p-4' );
		expect( cn( 'text-red-500', 'text-blue-500' ) ).toBe( 'text-blue-500' );
	} );

	it( 'supports object syntax from clsx', () => {
		expect( cn( 'a', { b: true, c: false }, 'd' ) ).toBe( 'a b d' );
	} );

	it( 'supports arrays from clsx', () => {
		expect( cn( [ 'a', 'b' ], 'c' ) ).toBe( 'a b c' );
	} );

	it( 'returns empty string for no inputs', () => {
		expect( cn() ).toBe( '' );
	} );
} );
