import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Search, CheckCircle2, AlertTriangle, Plug, Link2Off, RefreshCw, Loader2, PlusCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { updateApiData } from '@Utils/ApiData';

const REST_SITES = '/solvex-ai-blogger/v1/admin/gsc/sites';
const REST_KEYWORDS = '/solvex-ai-blogger/v1/admin/gsc/keywords';
const REST_SYNC = '/solvex-ai-blogger/v1/admin/gsc/sync';

/**
 * Read the Google Search Console connection data injected by PHP.
 *
 * @return {Object} The gsc localized data ({ connected, connectUrl, disconnectUrl }).
 */
const getGscData = () => {
	const data = typeof wpsolvex_autoaiblogger_localized_data !== 'undefined' // eslint-disable-line no-undef
		? wpsolvex_autoaiblogger_localized_data.gsc // eslint-disable-line no-undef
		: null;

	return {
		connected: !! ( data && data.connected ),
		connectUrl: ( data && data.connect_url ) || '',
		disconnectUrl: ( data && data.disconnect_url ) || '',
	};
};

/**
 * Whether an apiFetch error represents an expired/revoked Google connection.
 *
 * @param {Object} error The apiFetch error.
 * @return {boolean} True when the user should reconnect.
 */
const isReauthError = ( error ) => {
	return !! error && ( error.code === 'wpsolvex_autoaiblogger_gsc_needs_reauth' || error?.data?.status === 401 );
};

/**
 * Brand-styled primary button classes (matches the Settings "Save" button).
 *
 * @type {string}
 */
const PRIMARY_BTN = 'cursor-pointer inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200';

/**
 * Search Console page.
 *
 * Handles the full lifecycle: connect (OAuth), pick a verified property, and
 * display the locally cached keyword analytics with a per-row Create Campaign action.
 *
 * @return {JSX.Element} The Search Console page.
 */
const SearchConsole = () => {
	const { search } = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { connected, connectUrl, disconnectUrl } = useMemo( getGscData, [] );
	const gscPropertyUrl = useSelector( ( state ) => state.gscPropertyUrl ) || '';

	// Property selection state.
	const [ sites, setSites ] = useState( [] );
	const [ sitesLoading, setSitesLoading ] = useState( false );
	const [ sitesError, setSitesError ] = useState( '' );
	const [ selectedSite, setSelectedSite ] = useState( '' );
	const [ saving, setSaving ] = useState( false );

	// Keyword table state.
	const [ keywords, setKeywords ] = useState( [] );
	const [ keywordsLoading, setKeywordsLoading ] = useState( false );
	const [ syncing, setSyncing ] = useState( false );
	const [ tableSort, setTableSort ] = useState( { column: 'impressions', asc: false } );

	// Sorted keywords for the analytics table (default: impressions high -> low).
	const sortedKeywords = useMemo( () => {
		const { column, asc } = tableSort;
		return [ ...keywords ].sort( ( a, b ) => {
			let cmp;
			if ( column === 'keyword' ) {
				cmp = String( a.keyword || '' ).localeCompare( String( b.keyword || '' ) );
			} else {
				cmp = Number( a[ column ] || 0 ) - Number( b[ column ] || 0 );
			}
			return asc ? cmp : -cmp;
		} );
	}, [ keywords, tableSort ] );

	const handleTableSort = useCallback( ( column ) => {
		setTableSort( ( prev ) => (
			prev.column === column
				? { column, asc: ! prev.asc }
				: { column, asc: column === 'keyword' }
		) );
	}, [] );

	/**
	 * Render the sort indicator for a table column.
	 *
	 * @param {string} column The column key.
	 * @return {JSX.Element} The sort icon (neutral double-arrow, or directional when active).
	 */
	const renderTableSortIcon = ( column ) => {
		if ( tableSort.column !== column ) {
			return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />;
		}
		return tableSort.asc
			? <ArrowUp className="h-3.5 w-3.5 text-gray-700" aria-hidden="true" />
			: <ArrowDown className="h-3.5 w-3.5 text-gray-700" aria-hidden="true" />;
	};

	// Dispatch a message to the global notification popup.
	const notify = useCallback( ( message, type = 'success', duration = 4000 ) => {
		dispatch( { type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION', payload: { message, type, duration } } );
	}, [ dispatch ] );

	// Surface the result of the OAuth round-trip (query flags set by PHP) via the
	// global notification popup, then strip the flag so it fires only once.
	useEffect( () => {
		const params = new URLSearchParams( search );
		let handled = false;

		if ( params.get( 'gsc_connected' ) === 'success' ) {
			notify( __( 'Google Search Console connected successfully.', 'solvex-ai-blogger' ), 'success' );
			params.delete( 'gsc_connected' );
			handled = true;
		} else if ( params.get( 'gsc_disconnected' ) === 'success' ) {
			notify( __( 'Google Search Console has been disconnected.', 'solvex-ai-blogger' ), 'success' );
			params.delete( 'gsc_disconnected' );
			handled = true;
		} else if ( params.get( 'gsc_error' ) ) {
			notify( __( 'We could not complete the connection. Please try connecting again.', 'solvex-ai-blogger' ), 'error', 5000 );
			params.delete( 'gsc_error' );
			handled = true;
		}

		if ( handled ) {
			navigate( `?${ params.toString() }`, { replace: true } );
		}
	}, [ search, notify, navigate ] );

	// Load the cached keywords for the selected property.
	const loadKeywords = useCallback( async () => {
		setKeywordsLoading( true );
		try {
			const res = await apiFetch( { path: REST_KEYWORDS } );
			setKeywords( ( res && res.keywords ) || [] );
		} catch ( error ) {
			setKeywords( [] );
		} finally {
			setKeywordsLoading( false );
		}
	}, [] );

	// Fetch verified sites when connected but no property is selected yet.
	useEffect( () => {
		if ( ! connected || gscPropertyUrl ) {
			return undefined;
		}

		let cancelled = false;
		setSitesLoading( true );
		setSitesError( '' );

		apiFetch( { path: REST_SITES } )
			.then( ( res ) => {
				if ( cancelled ) {
					return;
				}
				const list = ( res && res.sites ) || [];
				setSites( list );
				if ( list.length > 0 ) {
					setSelectedSite( list[ 0 ].siteUrl );
				}
			} )
			.catch( ( error ) => {
				if ( cancelled ) {
					return;
				}
				setSitesError(
					isReauthError( error )
						? __( 'Your Google connection has expired. Please reconnect.', 'solvex-ai-blogger' )
						: __( 'Could not load your Search Console properties. Please try again.', 'solvex-ai-blogger' )
				);
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setSitesLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ connected, gscPropertyUrl ] );

	// Load keywords whenever a property is set.
	useEffect( () => {
		if ( connected && gscPropertyUrl ) {
			loadKeywords();
		}
	}, [ connected, gscPropertyUrl, loadKeywords ] );

	// Persist the selected property, then trigger an immediate sync.
	const handleSaveProperty = useCallback( async () => {
		if ( ! selectedSite || saving ) {
			return;
		}

		setSaving( true );

		try {
			await updateApiData( 'gscPropertyUrl', selectedSite, dispatch );
			dispatch( { type: 'UPDATE_INITIAL_STATE', payload: { gscPropertyUrl: selectedSite } } );

			try {
				const res = await apiFetch( { path: REST_SYNC, method: 'POST', data: {} } );
				notify( __( 'Property saved. Imported', 'solvex-ai-blogger' ) + ` ${ ( res && res.count ) || 0 } ` + __( 'keywords.', 'solvex-ai-blogger' ), 'success' );
			} catch ( syncError ) {
				notify(
					isReauthError( syncError )
						? __( 'Property saved, but your Google connection expired. Please reconnect.', 'solvex-ai-blogger' )
						: ( syncError?.message || __( 'Property saved, but the initial sync failed. Try "Sync now".', 'solvex-ai-blogger' ) ),
					'error',
					5000
				);
			}

			await loadKeywords();
		} catch ( error ) {
			notify( __( 'Could not save the selected property. Please try again.', 'solvex-ai-blogger' ), 'error', 5000 );
		} finally {
			setSaving( false );
		}
	}, [ selectedSite, saving, dispatch, loadKeywords, notify ] );

	// Re-run the sync on demand.
	const handleSyncNow = useCallback( async () => {
		if ( syncing ) {
			return;
		}
		setSyncing( true );
		try {
			const res = await apiFetch( { path: REST_SYNC, method: 'POST', data: {} } );
			notify( __( 'Synced', 'solvex-ai-blogger' ) + ` ${ ( res && res.count ) || 0 } ` + __( 'keywords.', 'solvex-ai-blogger' ), 'success' );
			await loadKeywords();
		} catch ( error ) {
			notify(
				isReauthError( error )
					? __( 'Your Google connection has expired. Please reconnect.', 'solvex-ai-blogger' )
					: ( error?.message || __( 'Sync failed. Please try again.', 'solvex-ai-blogger' ) ),
				'error',
				5000
			);
		} finally {
			setSyncing( false );
		}
	}, [ syncing, loadKeywords, notify ] );

	// Clear the selected property to pick a different one.
	const handleChangeProperty = useCallback( async () => {
		try {
			await updateApiData( 'gscPropertyUrl', '', dispatch );
		} catch ( error ) {
			// Non-fatal: still clear locally so the picker reappears.
		}
		dispatch( { type: 'UPDATE_INITIAL_STATE', payload: { gscPropertyUrl: '' } } );
		setKeywords( [] );
	}, [ dispatch ] );

	/**
	 * Open the campaign drawer pre-seeded with the selected keyword.
	 *
	 * @param {string} keyword The selected keyword.
	 * @return {void}
	 */
	const handleCreateCampaign = ( keyword ) => {
		const homeSlug = ( typeof wpsolvex_autoaiblogger_localized_data !== 'undefined' && wpsolvex_autoaiblogger_localized_data.home_slug ) || 'solvex-ai-blogger'; // eslint-disable-line no-undef
		navigate( `?page=${ homeSlug }&path=campaigns&seed_keyword=${ encodeURIComponent( keyword ) }` );
	};

	/**
	 * Render a success/error notice block.
	 *
	 * @param {Object} notice The notice ({ type, message }).
	 * @return {JSX.Element} The notice element.
	 */
	const renderNotice = ( notice ) => (
		<div
			className={ `flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
				notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
			}` }
			role="status"
		>
			{ notice.type === 'success'
				? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
				: <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" /> }
			<span>{ notice.message }</span>
		</div>
	);

	return (
		<div className="px-4 sm:px-6 lg:px-8 py-8">
			{ /* Not connected: connect card */ }
			{ ! connected && (
				<div className="rounded-xl border border-gray-200 bg-white px-6 py-8">
					<div className="flex flex-col items-center justify-center text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
							<Search className="h-6 w-6 text-brand-600" aria-hidden="true" />
						</div>
						<h3 className="mt-4 text-sm font-semibold text-gray-900">
							{ __( 'Google Search Console', 'solvex-ai-blogger' ) }
						</h3>
						<p className="mt-1 max-w-md text-xs text-gray-600">
							{ __( 'Connect Google Search Console to track how your posts perform in search.', 'solvex-ai-blogger' ) }
						</p>
						{ connectUrl && (
							<button
								type="button"
								onClick={ () => {
									window.location.href = connectUrl;
								} }
								className={ `mt-6 ${ PRIMARY_BTN }` }
							>
								<Plug className="w-4 h-4 mr-2" aria-hidden="true" />
								<span>{ __( 'Connect Google Search Console', 'solvex-ai-blogger' ) }</span>
							</button>
						) }
					</div>
				</div>
			) }

			{ /* Connected, no property: property selector */ }
			{ connected && ! gscPropertyUrl && (
				<div className="rounded-xl border border-gray-200 bg-white px-6 py-8">
					<div className="mx-auto max-w-md text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
							<Search className="h-6 w-6 text-brand-600" aria-hidden="true" />
						</div>
						<h3 className="mt-4 text-sm font-semibold text-gray-900">
							{ __( 'Select your Search Console property', 'solvex-ai-blogger' ) }
						</h3>
						<p className="mt-1 text-xs text-gray-600">
							{ __( 'Choose the property that matches this website.', 'solvex-ai-blogger' ) }
						</p>

						{ sitesLoading && (
							<p className="mt-6 inline-flex items-center gap-2 text-sm text-gray-600">
								<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
								{ __( 'Loading properties…', 'solvex-ai-blogger' ) }
							</p>
						) }

						{ ! sitesLoading && sitesError && (
							<div className="mt-6">
								{ renderNotice( { type: 'error', message: sitesError } ) }
								{ connectUrl && (
									<button
										type="button"
										onClick={ () => {
											window.location.href = connectUrl;
										} }
										className={ `mt-4 ${ PRIMARY_BTN }` }
									>
										<Plug className="w-4 h-4 mr-2" aria-hidden="true" />
										<span>{ __( 'Reconnect', 'solvex-ai-blogger' ) }</span>
									</button>
								) }
							</div>
						) }

						{ ! sitesLoading && ! sitesError && sites.length === 0 && (
							<p className="mt-6 text-sm text-gray-600">
								{ __( 'No verified properties were found for this Google account.', 'solvex-ai-blogger' ) }
							</p>
						) }

						{ ! sitesLoading && ! sitesError && sites.length > 0 && (
							<div className="mt-6 flex flex-col items-stretch gap-3">
								<select
									value={ selectedSite }
									onChange={ ( e ) => setSelectedSite( e.target.value ) }
									className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
								>
									{ sites.map( ( site ) => (
										<option key={ site.siteUrl } value={ site.siteUrl }>
											{ site.siteUrl }
										</option>
									) ) }
								</select>
								<button
									type="button"
									onClick={ handleSaveProperty }
									disabled={ saving || ! selectedSite }
									className={ PRIMARY_BTN }
								>
									{ saving
										? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
										: <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" /> }
									<span>{ saving ? __( 'Saving…', 'solvex-ai-blogger' ) : __( 'Save & sync', 'solvex-ai-blogger' ) }</span>
								</button>
							</div>
						) }
					</div>
				</div>
			) }

			{ /* Connected, property set: analytics table */ }
			{ connected && gscPropertyUrl && (
				<div>
					{ /* Header row */ }
					<div className="sm:flex sm:items-center sm:justify-between">
						<div className="sm:flex-auto">
							<h2 className="text-xl font-bold text-gray-900 p-0 m-0">
								{ __( 'Search performance', 'solvex-ai-blogger' ) }
							</h2>
							<p className="mt-1 text-sm text-gray-500">{ gscPropertyUrl }</p>
						</div>
						<div className="mt-4 sm:mt-0 sm:ml-16 flex items-center gap-2">
							<button
								type="button"
								onClick={ handleSyncNow }
								disabled={ syncing }
								className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
							>
								<RefreshCw className={ `h-4 w-4 ${ syncing ? 'animate-spin' : '' }` } aria-hidden="true" />
								{ syncing ? __( 'Syncing…', 'solvex-ai-blogger' ) : __( 'Sync now', 'solvex-ai-blogger' ) }
							</button>
							<button
								type="button"
								onClick={ handleChangeProperty }
								className="cursor-pointer inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
							>
								{ __( 'Change property', 'solvex-ai-blogger' ) }
							</button>
							{ disconnectUrl && (
								<a
									href={ disconnectUrl }
									className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
								>
									<Link2Off className="h-4 w-4" aria-hidden="true" />
									{ __( 'Disconnect', 'solvex-ai-blogger' ) }
								</a>
							) }
						</div>
					</div>

					{ /* Table */ }
					<div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
						{ keywordsLoading ? (
							<div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-gray-600">
								<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
								{ __( 'Loading keywords…', 'solvex-ai-blogger' ) }
							</div>
						) : keywords.length === 0 ? (
							<div className="px-6 py-16 text-center text-sm text-gray-600">
								{ __( 'No data yet. Use "Sync now" to import the latest keywords.', 'solvex-ai-blogger' ) }
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200 text-sm">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left font-medium text-gray-600">
												<button type="button" onClick={ () => handleTableSort( 'keyword' ) } className="inline-flex cursor-pointer items-center gap-1.5 hover:text-gray-900" style={ { color: 'inherit', background: 'transparent', border: 0, padding: 0, boxShadow: 'none', minHeight: 0 } }>
													{ __( 'Keywords', 'solvex-ai-blogger' ) }
													{ renderTableSortIcon( 'keyword' ) }
												</button>
											</th>
											<th className="px-4 py-3 text-left font-medium text-gray-600">
												<button type="button" onClick={ () => handleTableSort( 'position' ) } className="inline-flex cursor-pointer items-center gap-1.5 hover:text-gray-900" style={ { color: 'inherit', background: 'transparent', border: 0, padding: 0, boxShadow: 'none', minHeight: 0 } }>
													{ __( 'Avg. Position', 'solvex-ai-blogger' ) }
													{ renderTableSortIcon( 'position' ) }
												</button>
											</th>
											<th className="px-4 py-3 text-left font-medium text-gray-600">
												<button type="button" onClick={ () => handleTableSort( 'impressions' ) } className="inline-flex cursor-pointer items-center gap-1.5 hover:text-gray-900" style={ { color: 'inherit', background: 'transparent', border: 0, padding: 0, boxShadow: 'none', minHeight: 0 } }>
													{ __( 'Impressions', 'solvex-ai-blogger' ) }
													{ renderTableSortIcon( 'impressions' ) }
												</button>
											</th>
											<th className="px-4 py-3 text-left font-medium text-gray-600">
												<button type="button" onClick={ () => handleTableSort( 'clicks' ) } className="inline-flex cursor-pointer items-center gap-1.5 hover:text-gray-900" style={ { color: 'inherit', background: 'transparent', border: 0, padding: 0, boxShadow: 'none', minHeight: 0 } }>
													{ __( 'Clicks', 'solvex-ai-blogger' ) }
													{ renderTableSortIcon( 'clicks' ) }
												</button>
											</th>
											<th className="px-4 py-3 text-right font-medium text-gray-600">{ __( 'Action', 'solvex-ai-blogger' ) }</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100">
										{ sortedKeywords.map( ( row ) => (
											<tr key={ row.keyword } className="hover:bg-gray-50">
												<td className="px-4 py-3 font-medium text-gray-900">{ row.keyword }</td>
												<td className="px-4 py-3 text-gray-700">{ Number( row.position || 0 ).toFixed( 1 ) }</td>
												<td className="px-4 py-3 text-gray-700">{ Number( row.impressions || 0 ).toLocaleString() }</td>
												<td className="px-4 py-3 text-gray-700">{ Number( row.clicks || 0 ).toLocaleString() }</td>
												<td className="px-4 py-3 text-right">
													<button
														type="button"
														onClick={ () => handleCreateCampaign( row.keyword ) }
														className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand transition-all duration-200"
													>
														<PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
														{ __( 'Create Campaign', 'solvex-ai-blogger' ) }
													</button>
												</td>
											</tr>
										) ) }
									</tbody>
								</table>
							</div>
						) }
					</div>
				</div>
			) }
		</div>
	);
};

SearchConsole.displayName = 'SearchConsole';

export default memo( SearchConsole );
