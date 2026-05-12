/**
 * Thin client for `GET /solvex-ai-blogger/v1/campaigns`.
 *
 * Returns `{ items, page, per_page, total, total_pages }` from the REST
 * response. Errors propagate as rejected promises so callers can
 * `try/catch` around them.
 */
import apiFetch from '@wordpress/api-fetch';

const REST_PATH = '/solvex-ai-blogger/v1/campaigns';

export async function fetchCampaigns( {
	page = 1,
	perPage = 20,
	search = '',
	status = '',
	orderBy = 'date',
	order = 'DESC',
	signal,
} = {} ) {
	const params = new URLSearchParams( {
		page: String( page ),
		per_page: String( perPage ),
		order_by: orderBy,
		order,
	} );
	if ( search ) {
		params.set( 'search', search );
	}
	if ( status ) {
		params.set( 'status', status );
	}

	const path = `${ REST_PATH }?${ params.toString() }`;
	const response = await apiFetch( {
		path,
		method: 'GET',
		signal,
	} );

	return {
		items: response?.items || {},
		page: response?.page || 1,
		perPage: response?.per_page || perPage,
		total: response?.total || 0,
		totalPages: response?.total_pages || 0,
	};
}

export default { fetchCampaigns };
