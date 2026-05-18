/**
 * Tests for the CampaignsApi.fetchCampaigns wrapper.
 */
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

import apiFetch from '@wordpress/api-fetch';
import { fetchCampaigns } from '../../src/dashboard/Utils/CampaignsApi';

describe( 'fetchCampaigns', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'requests REST path with defaults', async () => {
		apiFetch.mockResolvedValue( { items: {}, page: 1, per_page: 20, total: 0, total_pages: 0 } );
		await fetchCampaigns();
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		const call = apiFetch.mock.calls[ 0 ][ 0 ];
		expect( call.method ).toBe( 'GET' );
		expect( call.path ).toMatch( /^\/solvex-ai-blogger\/v1\/campaigns\?/ );
		const params = new URLSearchParams( call.path.split( '?' )[ 1 ] );
		expect( params.get( 'page' ) ).toBe( '1' );
		expect( params.get( 'per_page' ) ).toBe( '20' );
		expect( params.get( 'order_by' ) ).toBe( 'date' );
		expect( params.get( 'order' ) ).toBe( 'DESC' );
	} );

	it( 'passes search and status when present', async () => {
		apiFetch.mockResolvedValue( { items: {}, page: 1, per_page: 20, total: 0, total_pages: 0 } );
		await fetchCampaigns( { search: 'fitness', status: 'active' } );
		const params = new URLSearchParams( apiFetch.mock.calls[ 0 ][ 0 ].path.split( '?' )[ 1 ] );
		expect( params.get( 'search' ) ).toBe( 'fitness' );
		expect( params.get( 'status' ) ).toBe( 'active' );
	} );

	it( 'omits search and status when empty', async () => {
		apiFetch.mockResolvedValue( { items: {}, page: 1, per_page: 20, total: 0, total_pages: 0 } );
		await fetchCampaigns( { search: '', status: '' } );
		const params = new URLSearchParams( apiFetch.mock.calls[ 0 ][ 0 ].path.split( '?' )[ 1 ] );
		expect( params.has( 'search' ) ).toBe( false );
		expect( params.has( 'status' ) ).toBe( false );
	} );

	it( 'normalises response keys', async () => {
		apiFetch.mockResolvedValue( {
			items: { 1: { id: 1 }, 2: { id: 2 } },
			page: 3,
			per_page: 15,
			total: 47,
			total_pages: 4,
		} );
		const result = await fetchCampaigns( { page: 3, perPage: 15 } );
		expect( result ).toEqual( {
			items: { 1: { id: 1 }, 2: { id: 2 } },
			page: 3,
			perPage: 15,
			total: 47,
			totalPages: 4,
		} );
	} );

	it( 'forwards AbortSignal', async () => {
		apiFetch.mockResolvedValue( { items: {}, page: 1, per_page: 20, total: 0, total_pages: 0 } );
		const ctrl = new AbortController();
		await fetchCampaigns( { signal: ctrl.signal } );
		expect( apiFetch.mock.calls[ 0 ][ 0 ].signal ).toBe( ctrl.signal );
	} );
} );
