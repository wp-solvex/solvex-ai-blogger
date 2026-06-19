import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import apiFetch from '@wordpress/api-fetch';
import { Search, Loader2, Download, Check, ArrowUp, ArrowDown, ChartLine } from 'lucide-react';

const REST_KEYWORDS = '/solvex-ai-blogger/v1/admin/gsc/keywords';

/**
 * Modal that lists cached Google Search Console keywords for multi-select import.
 *
 * @param {Object}   props          Component props.
 * @param {boolean}  props.isOpen   Whether the modal is open.
 * @param {Function} props.onClose  Called to close the modal.
 * @param {Function} props.onImport Called with the comma-joined selected keywords.
 * @return {JSX.Element} The modal.
 */
const GscImportModal = ( { isOpen, onClose, onImport } ) => {
	const [ keywords, setKeywords ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( '' );
	const [ selected, setSelected ] = useState( [] );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ sortColumn, setSortColumn ] = useState( null ); // null (default: impressions desc) | 'keyword' | 'impressions'
	const [ sortAsc, setSortAsc ] = useState( true );

	// Whether Google Search Console is currently connected (from localized data).
	const gscConnected = !! (
		typeof wpsolvex_autoaiblogger_localized_data !== 'undefined' && // eslint-disable-line no-undef
		wpsolvex_autoaiblogger_localized_data.gsc && // eslint-disable-line no-undef
		wpsolvex_autoaiblogger_localized_data.gsc.connected // eslint-disable-line no-undef
	);

	// Navigate the user to the Search Console tab (to connect / reconnect).
	const navigate = useNavigate();
	const goToSearchConsole = useCallback( () => {
		const data = typeof wpsolvex_autoaiblogger_localized_data !== 'undefined' ? wpsolvex_autoaiblogger_localized_data : {}; // eslint-disable-line no-undef
		const slug = data.home_slug || 'solvex-ai-blogger';
		onClose();
		navigate( `?page=${ slug }&path=search-console` );
	}, [ navigate, onClose ] );

	// Load keywords whenever the modal opens (only when connected).
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		setSelected( [] );
		setSearchTerm( '' );
		setSortColumn( null );
		setSortAsc( true );
		setError( '' );

		// Not connected -> don't show stale cached keywords; prompt to connect instead.
		if ( ! gscConnected ) {
			setKeywords( [] );
			setLoading( false );
			return;
		}

		let cancelled = false;
		setLoading( true );

		apiFetch( { path: REST_KEYWORDS } )
			.then( ( res ) => {
				if ( ! cancelled ) {
					setKeywords( ( res && res.keywords ) || [] );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setError( __( 'Could not load keywords. Please try again.', 'solvex-ai-blogger' ) );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ isOpen, gscConnected ] );

	const toggleKeyword = useCallback( ( keyword ) => {
		setSelected( ( prev ) => (
			prev.includes( keyword ) ? prev.filter( ( k ) => k !== keyword ) : [ ...prev, keyword ]
		) );
	}, [] );

	const handleImport = useCallback( () => {
		if ( selected.length === 0 ) {
			return;
		}
		onImport( selected.join( ', ' ) );
		onClose();
	}, [ selected, onImport, onClose ] );

	// Filtered + sorted keywords for display. Default order is impressions
	// high -> low (no explicit sort column active).
	const visibleKeywords = useMemo( () => {
		const term = searchTerm.trim().toLowerCase();
		const list = keywords.filter( ( row ) => ! term || String( row.keyword || '' ).toLowerCase().includes( term ) );

		return [ ...list ].sort( ( a, b ) => {
			if ( sortColumn === 'keyword' ) {
				const cmp = String( a.keyword || '' ).localeCompare( String( b.keyword || '' ) );
				return sortAsc ? cmp : -cmp;
			}

			const cmp = Number( a.impressions || 0 ) - Number( b.impressions || 0 );
			// Explicit impressions sort respects direction; default is descending.
			return sortColumn === 'impressions' ? ( sortAsc ? cmp : -cmp ) : -cmp;
		} );
	}, [ keywords, searchTerm, sortColumn, sortAsc ] );

	const handleSort = useCallback( ( column ) => {
		setSortColumn( ( prevColumn ) => {
			if ( prevColumn === column ) {
				setSortAsc( ( prev ) => ! prev );
				return prevColumn;
			}
			setSortAsc( true );
			return column;
		} );
	}, [] );

	/**
	 * Render the active sort arrow for a column (none when not the active column).
	 *
	 * @param {string} column The column key.
	 * @return {JSX.Element|null} The arrow icon or null.
	 */
	const renderSortArrow = ( column ) => {
		if ( sortColumn !== column ) {
			return null;
		}
		return sortAsc
			? <ArrowUp className="h-3 w-3" aria-hidden="true" />
			: <ArrowDown className="h-3 w-3" aria-hidden="true" />;
	};

	return (
		<Dialog open={ isOpen } onClose={ onClose } className="relative z-20 ai-blogger-container">
			<div className="fixed inset-0 bg-black/30" aria-hidden="true" />
			<div className="fixed inset-0 flex items-center justify-center p-4">
				<DialogPanel className="w-full max-w-lg rounded-xl bg-white shadow-xl">
					<div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3">
						<ChartLine className="h-5 w-5 flex-shrink-0 text-brand-600" aria-hidden="true" />
						<DialogTitle className="whitespace-nowrap text-sm font-semibold text-gray-900">
							{ __( 'Import keywords from Search Console', 'solvex-ai-blogger' ) }
						</DialogTitle>
						{ gscConnected && (
							<div className="relative ml-auto">
								<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
								<input
									type="text"
									value={ searchTerm }
									onChange={ ( e ) => setSearchTerm( e.target.value ) }
									placeholder={ __( 'Search', 'solvex-ai-blogger' ) }
									className="w-32 rounded-md border border-gray-300 bg-white py-1 pr-2 text-xs leading-tight text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
									style={ { paddingLeft: '1.75rem', minHeight: '0' } }
								/>
							</div>
						) }
					</div>

					<div className="max-h-72 overflow-y-auto px-5 pb-3 pt-0">
						{ ! gscConnected && (
							<div className="flex flex-col items-center justify-center px-4 py-10 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
									<ChartLine className="h-6 w-6 text-brand-600" aria-hidden="true" />
								</div>
								<h3 className="mt-4 text-sm font-semibold text-gray-900">
									{ __( 'Google Search Console is not connected', 'solvex-ai-blogger' ) }
								</h3>
								<p className="mt-1 max-w-sm text-xs text-gray-600">
									{ __( 'Connect Search Console to boost your reach.', 'solvex-ai-blogger' ) }
								</p>
								<button
									type="button"
									onClick={ goToSearchConsole }
									className="mt-5 cursor-pointer inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand transition-all duration-200"
								>
									{ __( 'Go to Search Console', 'solvex-ai-blogger' ) }
								</button>
							</div>
						) }

						{ gscConnected && loading && (
							<p className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
								<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
								{ __( 'Loading keywords…', 'solvex-ai-blogger' ) }
							</p>
						) }

						{ gscConnected && ! loading && error && (
							<p className="py-8 text-center text-sm text-red-600">{ error }</p>
						) }

						{ gscConnected && ! loading && ! error && keywords.length === 0 && (
							<p className="py-8 text-center text-sm text-gray-600">
								{ __( 'No keywords found. Sync your Search Console data first.', 'solvex-ai-blogger' ) }
							</p>
						) }

						{ gscConnected && ! loading && ! error && keywords.length > 0 && (
							<>
								<div
									className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white py-2 text-sm font-semibold"
									style={ { color: 'rgb(68 75 86)' } }
								>
									<button
										type="button"
										onClick={ () => handleSort( 'keyword' ) }
										className="inline-flex flex-1 cursor-pointer items-center gap-1 text-left hover:opacity-70"
										style={ { color: 'inherit', background: 'transparent', border: 0, padding: 0, boxShadow: 'none', minHeight: 0 } }
									>
										{ __( 'Keyword', 'solvex-ai-blogger' ) }
										{ renderSortArrow( 'keyword' ) }
									</button>
									<button
										type="button"
										onClick={ () => handleSort( 'impressions' ) }
										className="inline-flex cursor-pointer items-center gap-1 hover:opacity-70"
										style={ { color: 'inherit', background: 'transparent', border: 0, padding: 0, boxShadow: 'none', minHeight: 0 } }
									>
										{ __( 'Impressions', 'solvex-ai-blogger' ) }
										{ renderSortArrow( 'impressions' ) }
									</button>
								</div>

								{ visibleKeywords.length === 0 ? (
									<p className="py-8 text-center text-sm text-gray-600">
										{ __( 'No keywords match your search.', 'solvex-ai-blogger' ) }
									</p>
								) : (
									<ul className="divide-y divide-gray-100">
										{ visibleKeywords.map( ( row, index ) => {
											const inputId = `gsc-kw-${ index }`;
											const isChecked = selected.includes( row.keyword );
											return (
												<li key={ row.keyword }>
													<label htmlFor={ inputId } className="flex cursor-pointer items-center gap-3 py-2 text-sm text-gray-800">
														<input
															id={ inputId }
															type="checkbox"
															checked={ isChecked }
															onChange={ () => toggleKeyword( row.keyword ) }
															className="peer sr-only"
														/>
														<span
															className={ `flex h-4 w-4 flex-shrink-0 items-center justify-center rounded transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1 ${
																isChecked ? 'bg-brand' : 'bg-white'
															}` }
															style={ { border: `2px solid ${ isChecked ? '#9138c8' : '#9ca3af' }` } }
														>
															{ isChecked && <Check className="h-3 w-3 text-white" strokeWidth={ 3 } aria-hidden="true" /> }
														</span>
														<span className="flex-1 truncate">{ row.keyword }</span>
														<span className="text-xs text-gray-500">
															{ Number( row.impressions || 0 ).toLocaleString() }
														</span>
													</label>
												</li>
											);
										} ) }
									</ul>
								) }
							</>
						) }
					</div>

					<div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
						<span className="text-xs text-gray-500">
							{ gscConnected ? `${ selected.length } ${ __( 'selected', 'solvex-ai-blogger' ) }` : '' }
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={ onClose }
								className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
							>
								{ gscConnected ? __( 'Cancel', 'solvex-ai-blogger' ) : __( 'Close', 'solvex-ai-blogger' ) }
							</button>
							{ gscConnected && (
								<button
									type="button"
									onClick={ handleImport }
									disabled={ selected.length === 0 }
									className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
								>
									<Download className="h-4 w-4" aria-hidden="true" />
									{ __( 'Import Selected', 'solvex-ai-blogger' ) }
								</button>
							) }
						</div>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
};

export default GscImportModal;
