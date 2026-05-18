/**
 * Tests for the toast wrapper.
 *
 * Verifies the adapter delegates each method to Sonner with the right args.
 */
jest.mock( 'sonner', () => {
	const sonner = {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
		loading: jest.fn(),
		dismiss: jest.fn(),
		promise: jest.fn(),
	};
	return { toast: sonner };
} );

import { toast } from '../../src/dashboard/Utils/toast';
import { toast as sonner } from 'sonner';

describe( 'toast wrapper', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [ 'success', 'error', 'info', 'warning', 'loading' ] )(
		'%s() forwards to Sonner',
		( method ) => {
			toast[ method ]( 'hello' );
			expect( sonner[ method ] ).toHaveBeenCalledWith( 'hello', {} );
		}
	);

	it( 'passes options through', () => {
		toast.success( 'saved', { duration: 1000 } );
		expect( sonner.success ).toHaveBeenCalledWith( 'saved', { duration: 1000 } );
	} );

	it( 'dismiss() forwards an id', () => {
		toast.dismiss( 'toast-1' );
		expect( sonner.dismiss ).toHaveBeenCalledWith( 'toast-1' );
	} );
} );
