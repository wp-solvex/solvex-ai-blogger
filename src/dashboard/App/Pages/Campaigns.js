import React, { useState, useMemo, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Settings, Trash2, Info, FolderPlus, RotateCw, List, ChartNoAxesColumn, CalendarArrowUp, ScrollText, Search } from 'lucide-react';
import { Tooltip } from '@wordpress/components';
import { ConfigureDrawer } from '@Elements/Campaigns';
import CampaignAnalyticsModal from '@Components/CampaignAnalyticsModal';
import CampaignLogsModal from '@Components/CampaignLogsModal';
import CampaignDeleteModal from '@Components/CampaignDeleteModal';
import CampaignFilters from '@Components/CampaignFilters';
import apiFetch from '@wordpress/api-fetch';

export default function Campaigns() {
	const initialCampaigns = wpsolvex_autoaiblogger_localized_data.all_campaigns;
	const defaultMetaDefaults = wpsolvex_autoaiblogger_localized_data.postmeta_defaults;
	const isTestingMode = wpsolvex_autoaiblogger_localized_data.campaign_testing_mode || false;

	const [ campaigns, setCampaigns ] = useState( initialCampaigns ); // Make campaigns stateful
	const [ configureData, setConfigureData ] = useState( defaultMetaDefaults );
	const [ openDrawer, setOpenDrawer ] = useState( false );
	const [ openingConfigureDrawer, setOpeningConfigureDrawer ] = useState( false );
	const [ analyticsModal, setAnalyticsModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );
	const [ logsModal, setLogsModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );
	const [ deleteModal, setDeleteModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );
	const [ updatingStatus, setUpdatingStatus ] = useState( {} ); // Track which campaigns are being updated
	const [ sortBy, setSortBy ] = useState( 'latest' ); // Default sort by latest
	const [ showSortDropdown, setShowSortDropdown ] = useState( false );
	const [ searchTerm, setSearchTerm ] = useState( '' ); // Search functionality
	const [ highlightedCampaignId, setHighlightedCampaignId ] = useState( null );

	// Check if debug logs should be shown via URL parameter
	const shouldShowDebugLogs = useMemo( () => {
		const urlParams = new URLSearchParams( window.location.search );
		return urlParams.get( 'debugLogs' ) === 'true';
	}, [] );

	// Handle campaign ID from URL parameter and scroll to it
	useEffect( () => {
		const urlParams = new URLSearchParams( window.location.search );
		const campaignId = urlParams.get( 'id' );

		if ( campaignId && campaigns && campaigns[ campaignId ] ) {
			// Small delay to ensure table is rendered
			setTimeout( () => {
				const campaignRow = document.querySelector( `tr[data-campaign-id="${ campaignId }"]` );
				if ( campaignRow ) {
					// Scroll to the campaign row with smooth behavior
					campaignRow.scrollIntoView( {
						behavior: 'smooth',
						block: 'center',
					} );

					// Highlight the campaign row
					setHighlightedCampaignId( campaignId );

					// Remove highlight after 3 seconds
					setTimeout( () => {
						setHighlightedCampaignId( null );
					}, 3000 );
				}
			}, 300 );
		}
	}, [ campaigns ] );

	// Sort campaigns based on selected criteria
	const sortedCampaigns = useMemo( () => {
		if ( ! campaigns ) {
			return [];
		}

		const campaignsArray = Object.values( campaigns );

		// Helper function to determine campaign state
		const getCampaignState = ( campaign ) => {
			const postsCreated = parseInt( campaign.postsCreated ) || 0;
			const postsTarget = parseInt( campaign.postsTarget ) || 0;
			const postsFailed = parseInt( campaign.postsFailed ) || 0;
			const isPaused = campaign.isPaused || false;
			const campaignCompleted = campaign.campaignCompleted || false;

			// Check if completed
			const isTargetMet = postsTarget > 0 && postsCreated >= postsTarget;
			const allAttemptsMade = postsTarget > 0 && ( postsCreated + postsFailed ) >= postsTarget;
			const isCompleted = campaign.status === 'draft' || isTargetMet || allAttemptsMade || campaignCompleted;

			if ( isCompleted ) {
				return 'completed';
			}
			if ( isPaused ) {
				if ( campaign.pauseReason === 'token_exhaustion' ) {
					return 'paused_tokens';
				}
				return 'paused';
			}
			return 'active';
		};

		// First filter by search term
		const filteredCampaigns = campaignsArray.filter( ( campaign ) => {
			if ( ! searchTerm ) {
				return true;
			}

			const searchLower = searchTerm.toLowerCase();
			return (
				( campaign.name || '' ).toLowerCase().includes( searchLower ) ||
				( campaign.frequency || '' ).toLowerCase().includes( searchLower ) ||
				( campaign.last_post_title || '' ).toLowerCase().includes( searchLower )
			);
		} );

		// Then sort the filtered results
		return filteredCampaigns.sort( ( a, b ) => {
			switch ( sortBy ) {
				case 'active': {
					// Active first, then paused, then completed
					const stateA = getCampaignState( a );
					const stateB = getCampaignState( b );
					const stateOrder = { active: 0, paused: 1, completed: 2 };

					const orderA = stateOrder[ stateA ] ?? 3;
					const orderB = stateOrder[ stateB ] ?? 3;

					if ( orderA !== orderB ) {
						return orderA - orderB;
					}

					// If same state, sort by creation date (latest first)
					return new Date( b.created_at ) - new Date( a.created_at );
				}

				case 'inactive': {
					// Completed first, then paused, then active
					const stateA = getCampaignState( a );
					const stateB = getCampaignState( b );
					const stateOrder = { completed: 0, paused: 1, active: 2 };

					const orderA = stateOrder[ stateA ] ?? 3;
					const orderB = stateOrder[ stateB ] ?? 3;

					if ( orderA !== orderB ) {
						return orderA - orderB;
					}

					// If same state, sort by creation date (latest first)
					return new Date( b.created_at ) - new Date( a.created_at );
				}

				case 'name-asc':
					return ( a.name || '' ).localeCompare( b.name || '' );

				case 'name-desc':
					return ( b.name || '' ).localeCompare( a.name || '' );

				case 'start-date-asc':
					const startDateA = a.startDate ? new Date( a.startDate ) : new Date( a.created_at );
					const startDateB = b.startDate ? new Date( b.startDate ) : new Date( b.created_at );
					return startDateA - startDateB;

				case 'start-date-desc':
					const startDateDescA = a.startDate ? new Date( a.startDate ) : new Date( a.created_at );
					const startDateDescB = b.startDate ? new Date( b.startDate ) : new Date( b.created_at );
					return startDateDescB - startDateDescA;

				case 'end-date-asc':
					const endDateA = a.lastRun ? new Date( a.lastRun ) : new Date( 0 );
					const endDateB = b.lastRun ? new Date( b.lastRun ) : new Date( 0 );
					return endDateA - endDateB;

				case 'end-date-desc':
					const endDateDescA = a.lastRun ? new Date( a.lastRun ) : new Date( 0 );
					const endDateDescB = b.lastRun ? new Date( b.lastRun ) : new Date( 0 );
					return endDateDescB - endDateDescA;

				case 'latest':
				default:
					// Default: Latest campaigns first (by creation date)
					return new Date( b.created_at ) - new Date( a.created_at );
			}
		} );
	}, [ campaigns, sortBy, searchTerm ] );

	const fetchCampaignMetaData = async ( campaignId ) => {
		const formData = new window.FormData();

		formData.append( 'action', 'wpsolvex_autoaiblogger_get_campaign_metadata' );
		formData.append( 'security', wpsolvex_autoaiblogger_localized_data.admin_nonce );
		formData.append( 'campaign_id', campaignId );

		const response = await apiFetch( {
			url: wpsolvex_autoaiblogger_localized_data.ajax_url,
			method: 'POST',
			body: formData,
		} )
			.then( ( data ) => {
				if ( data.success ) {
					return data.data.data;
				}
			} )
			.catch( ( error ) => {
				console.error( error );
			} );

		return response;
	};

	const configureCampaign = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		setOpeningConfigureDrawer( true );

		const campaignId = e.currentTarget.getAttribute( 'data-campaign_id' );
		if ( ! campaignId ) {
			return;
		}

		fetchCampaignMetaData( campaignId )
			.then( ( data ) => {
				if ( data ) {
					setConfigureData(
						{
							...data,
							type: 'edit',
						}
					);
					setOpenDrawer( true );
				}
			} )
			.catch( ( error ) => {
				console.error( error );
			} );

		setOpeningConfigureDrawer( false );
	};

	const openCampaignAnalytics = ( e, campaignId ) => {
		e.preventDefault();
		e.stopPropagation();

		// Get the campaign data
		const campaignData = campaigns[ campaignId ];

		// Open analytics modal
		setAnalyticsModal( {
			isOpen: true,
			campaignId,
			campaignData,
		} );
	};

	const openCampaignLogs = ( e, campaignId ) => {
		e.preventDefault();
		e.stopPropagation();

		// Get the campaign data
		const campaignData = campaigns[ campaignId ];

		// Open logs modal
		setLogsModal( {
			isOpen: true,
			campaignId,
			campaignData,
		} );
	};

	const viewCampaignPosts = ( e, campaignId ) => {
		e.preventDefault();
		e.stopPropagation();

		// Get the campaign data to determine the post type
		const campaignData = campaigns[ campaignId ];
		const postType = campaignData?.postType || 'post'; // Default to 'post' if not found

		// Redirect to All Posts page with campaign filter
		const adminUrl = wpsolvex_autoaiblogger_localized_data.admin_url || '/wp-admin/';
		let filterUrl;

		// For 'post' type, we don't need to specify post_type parameter
		if ( postType === 'post' ) {
			filterUrl = `${ adminUrl }edit.php?wpsolvex_autoaiblogger_campaign_id=${ campaignId }`;
		} else {
			filterUrl = `${ adminUrl }edit.php?post_type=${ postType }&wpsolvex_autoaiblogger_campaign_id=${ campaignId }`;
		}

		window.open( filterUrl, '_blank' );
	};

	const openDeleteModal = ( e, campaignId ) => {
		e.preventDefault();
		e.stopPropagation();

		// Get the campaign data
		const campaignData = campaigns[ campaignId ];

		// Open delete modal
		setDeleteModal( {
			isOpen: true,
			campaignId,
			campaignData,
		} );
	};

	const handleCampaignDeleted = () => {
		// Refresh the page or update the campaigns list
		// For now, we'll refresh the page to update the campaigns list
		window.location.reload();
	};

	const toggleCampaignStatus = async ( campaignId ) => {
		// Prevent multiple simultaneous requests.
		if ( updatingStatus[ campaignId ] ) {
			return;
		}

		setUpdatingStatus( ( prev ) => ( { ...prev, [ campaignId ]: true } ) );

		try {
			// Get current campaign data.
			const campaignData = campaigns[ campaignId ];
			const isPaused = campaignData.isPaused || false;

			// Determine action: pause or resume.
			const action = isPaused ? 'wpsolvex_autoaiblogger_resume_campaign' : 'wpsolvex_autoaiblogger_pause_campaign';

			const formData = new window.FormData();
			formData.append( 'action', action );
			formData.append( 'security', wpsolvex_autoaiblogger_localized_data.admin_nonce );
			formData.append( 'campaign_id', campaignId );

			const response = await apiFetch( {
				url: wpsolvex_autoaiblogger_localized_data.ajax_url,
				method: 'POST',
				body: formData,
			} );

			if ( response.success ) {
				// Update the local campaigns state without page refresh.
				setCampaigns( ( prevCampaigns ) => ( {
					...prevCampaigns,
					[ campaignId ]: {
						...prevCampaigns[ campaignId ],
						isPaused: response.data.isPaused,
					},
				} ) );
			} else {
				console.error( 'Failed to toggle campaign status:', response );
				// Optionally show an error message to the user.
			}
		} catch ( error ) {
			console.error( 'Error toggling campaign status:', error );
		} finally {
			setUpdatingStatus( ( prev ) => ( { ...prev, [ campaignId ]: false } ) );
		}
	};	if ( ! campaigns || Object.keys( campaigns ).length === 0 ) {
		return (
			<>
				<div className="flex flex-col items-center justify-center gap-y-3 border border-dashed border-gray-300 p-6 max-w-lg mx-auto mt-20 bg-white rounded-lg shadow-md">
					<FolderPlus className="w-8 h-8 text-gray-400" />
					<h3 className="text-base font-semibold text-gray-900 m-0 p-0">
						{ __( 'No Campaigns.', 'solvex-ai-blogger' ) }
					</h3>
					<p className="text-sm text-gray-500">
						{ __( 'Get Started by Creating a New Campaign.', 'solvex-ai-blogger' ) }
					</p>
					<button
						type="button"
						className="rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 border-none cursor-pointer m-2 flex gap-x-2 items-center"
						data-tour-target="add-campaign"
						onClick={ ( e ) => {
							e.preventDefault();
							setConfigureData( defaultMetaDefaults );
							setOpenDrawer( true );
						} }
					>
						{ __( 'Add New', 'solvex-ai-blogger' ) }
					</button>
				</div>

				<ConfigureDrawer
					openDrawer={ openDrawer }
					setOpenDrawer={ setOpenDrawer }
					configureData={ configureData }
				/>

				<CampaignAnalyticsModal
					isOpen={ analyticsModal.isOpen }
					onClose={ () => setAnalyticsModal( { isOpen: false, campaignId: null, campaignData: null } ) }
					campaignId={ analyticsModal.campaignId }
					campaignData={ analyticsModal.campaignData }
				/>

				<CampaignLogsModal
					isOpen={ logsModal.isOpen }
					onClose={ () => setLogsModal( { isOpen: false, campaignId: null, campaignData: null } ) }
					campaignId={ logsModal.campaignId }
					campaignData={ logsModal.campaignData }
				/>

				<CampaignDeleteModal
					isOpen={ deleteModal.isOpen }
					onClose={ () => setDeleteModal( { isOpen: false, campaignId: null, campaignData: null } ) }
					campaignId={ deleteModal.campaignId }
					onDeleted={ handleCampaignDeleted }
				/>
			</>
		);
	}

	return (
		<>
			{ isTestingMode && (
				<div className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-md mx-4 mt-4 mb-2">
					<div className="flex items-center gap-2">
						<Info className="w-5 h-5" />
						<div>
							<h4 className="font-semibold text-sm m-0">{ __( '🧪 Campaign Testing Mode Active', 'solvex-ai-blogger' ) }</h4>
							<p className="text-xs mt-1 mb-0">
								{ __( 'Intervals are accelerated for testing: Daily = 1min, Weekly = 2min, Weekday Selection = 2min per day gap (Mon→Thu = 6min). Remember to disable testing mode in production!', 'solvex-ai-blogger' ) }
							</p>
						</div>
					</div>
				</div>
			) }

			<div className="sm:px-6 lg:px-8 py-8 px-4">
				<div className="sm:flex sm:items-center">
					<div className="sm:flex-auto">
						<h2 id="free-vs-pro-heading" className="text-xl font-bold text-gray-900 p-0 m-0">
							{ __( 'Manage Campaigns', 'solvex-ai-blogger' ) }
						</h2>
					</div>

					<div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">
						{ /* Campaign Filters Component */ }
						<CampaignFilters
							sortBy={ sortBy }
							onSortChange={ setSortBy }
							searchTerm={ searchTerm }
							onSearchChange={ setSearchTerm }
							showSortDropdown={ showSortDropdown }
							onToggleSortDropdown={ setShowSortDropdown }
						/>

						<button
							type="button"
							className="flex items-center justify-center rounded-md bg-brand-500 px-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:ring-2 focus:ring-inset focus:ring-brand-600 border-none cursor-pointer outline-none transition-all duration-200"
							style={ { height: '38px' } }
							data-tour-target="add-campaign"
							onClick={ ( e ) => {
								e.preventDefault();
								setConfigureData( defaultMetaDefaults );
								setOpenDrawer( true );
							} }
						>
							{ __( 'Add New', 'solvex-ai-blogger' ) }
						</button>
					</div>
				</div>

				{
					campaigns && Object.keys( campaigns ).length > 0 ? (
						<div className="mt-6">
							<div className="overflow-x-auto shadow ring-1 ring-black/5 sm:rounded-lg" style={ { scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' } }>
								<table className="w-full divide-y divide-gray-300" style={ { tableLayout: 'fixed', minWidth: '1200px' } }>
									<thead className="bg-gradient-to-r from-brand-50 to-indigo-50 header-nav">
										<tr>
											<th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6" style={ { width: '200px' } }>
												{ __( 'Name', 'solvex-ai-blogger' ) }
											</th>
											<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style={ { width: '100px' } }>
												{ __( 'Status', 'solvex-ai-blogger' ) }
											</th>
											<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style={ { width: '280px' } }>
												{ __( 'Results', 'solvex-ai-blogger' ) }
											</th>
											<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style={ { width: '180px' } }>
												{ __( 'Latest Post', 'solvex-ai-blogger' ) }
											</th>
											<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style={ { width: '120px' } }>
												{ __( 'Frequency', 'solvex-ai-blogger' ) }
											</th>
											<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style={ { width: '280px' } }>
												{ __( 'Actions', 'solvex-ai-blogger' ) }
											</th>
										</tr>
									</thead>

									<tbody className="divide-y divide-gray-200 bg-white">
										{ sortedCampaigns && sortedCampaigns.length > 0 ? (
											sortedCampaigns.map( ( campaign ) => (
												<tr
													key={ campaign.id }
													data-campaign-id={ campaign.id }
													className={ `even:bg-gray-50 transition-colors duration-500 ${
														highlightedCampaignId === campaign.id.toString() ? 'bg-brand-50 ring-2 ring-brand-500 ring-inset' : ''
													}` }
												>
													<td className="py-4 pl-4 pr-3 text-sm text-gray-600 sm:pl-6 overflow-hidden" style={ { maxWidth: '200px' } }>
														<div className="truncate">
															{ campaign.name && campaign.name.length > 0 ? (
																<Tooltip text={ campaign.name }
																	delay={ 100 }
																	className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	<span className="truncate block">{ campaign.name }</span>
																</Tooltip>
															) : (
																<span className="text-gray-500">{ __( 'Untitled Campaign', 'solvex-ai-blogger' ) }</span>
															) }
														</div>
													</td>

													<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
														{ ( () => {
															// Use direct metadata fields
															const postsCreated = parseInt( campaign.postsCreated ) || 0;
															const postsTarget = parseInt( campaign.postsTarget ) || 0;
															const postsFailed = parseInt( campaign.postsFailed ) || 0;
															const isPaused = campaign.isPaused || false;
															const campaignCompleted = campaign.campaignCompleted || false;

															// Check if campaign target is reached or all attempts completed
															// Disable when:
															// 1. Success >= Target (target met successfully)
															// 2. Success + Failed >= Target (all attempts made, some failed)
															const isTargetMet = postsTarget > 0 && postsCreated >= postsTarget;
															const allAttemptsMade = postsTarget > 0 && ( postsCreated + postsFailed ) >= postsTarget;
															const shouldDisableSwitch = isTargetMet || allAttemptsMade || campaignCompleted;
															const isUpdating = updatingStatus[ campaign.id ] || false;

															// Determine tooltip text
															let tooltipText = '';
															if ( shouldDisableSwitch ) {
																tooltipText = __( 'Completed', 'solvex-ai-blogger' );
															} else if ( isPaused && campaign.pauseReason === 'token_exhaustion' ) {
																tooltipText = __( 'Out of tokens, upgrade to resume', 'solvex-ai-blogger' );
															} else if ( isPaused ) {
																tooltipText = __( 'Paused', 'solvex-ai-blogger' );
															} else {
																tooltipText = __( 'Active', 'solvex-ai-blogger' );
															}

															const disableForTokens = isPaused && campaign.pauseReason === 'token_exhaustion';

															return (
																<div className="flex items-center gap-1.5">
																	<Tooltip
																		text={ tooltipText }
																		delay={ 100 }
																		className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																	>
																		<span className="inline-block">
																			<button
																				type="button"
																				onClick={ ( shouldDisableSwitch || disableForTokens ) ? undefined : () => toggleCampaignStatus( campaign.id ) }
																				disabled={ isUpdating || shouldDisableSwitch || disableForTokens }
																				aria-label={ `${ __( 'Toggle campaign status for', 'solvex-ai-blogger' ) } ${ campaign.name }` }
																				className={ `relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out border-none p-0 ${
																					isUpdating || shouldDisableSwitch
																						? 'opacity-50 cursor-default bg-gray-300 focus:outline-none'
																						: disableForTokens
																							? 'opacity-70 cursor-default bg-brand-300 focus:outline-none'
																							: isPaused
																								? 'bg-brand-300 focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:outline-none cursor-pointer'
																								: 'bg-brand-500 focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:outline-none cursor-pointer'
																				}` }
																			>
																				<span
																					className={ `inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
																						! isPaused && ! shouldDisableSwitch ? 'translate-x-5' : 'translate-x-0'
																					}` }
																					style={ { margin: '2px' } }
																				/>
																			</button>
																		</span>
																	</Tooltip>
																</div>
															);
														} )() }
													</td>

													<td className="whitespace-nowrap px-3 py-4 text-sm">
														{ ( () => {
															// Use direct metadata fields for clean display
															const postsCreated = parseInt( campaign.postsCreated ) || 0;
															const postsTarget = parseInt( campaign.postsTarget ) || 0;
															const postsFailed = parseInt( campaign.postsFailed ) || 0;

															// Check if campaign is completed (inactive, target met, or all attempts exhausted)
															const isCompleted = campaign.status === 'draft' ||
																	( postsTarget > 0 && postsCreated >= postsTarget ) ||
																	( postsTarget > 0 && ( postsCreated + postsFailed ) >= postsTarget ) ||
																	campaign.campaignCompleted === true;

															return (
																<div className="flex flex-col gap-1">
																	<div className="flex items-center gap-2">
																		<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
																				Success: { postsCreated }
																		</span>
																		{ postsFailed > 0 && isCompleted && (
																			<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
																					Undelivered: { postsFailed }
																			</span>
																		) }
																		<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
																				Target: { postsTarget }
																		</span>
																	</div>
																</div>
															);
														} )() }
													</td>

													<td className="px-3 py-4 text-sm text-gray-500 overflow-hidden" style={ { maxWidth: '180px' } }>
														<div className="truncate">
															{ campaign.last_post_title && campaign.last_post_title.length > 0 ? (
																<Tooltip text={ campaign.last_post_title }
																	delay={ 100 }
																	className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	<span className="truncate block">{ campaign.last_post_title }</span>
																</Tooltip>
															) : (
																<span className="text-gray-500">{ __( 'Scheduled - No posts yet', 'solvex-ai-blogger' ) }</span>
															) }
														</div>
													</td>

													<td className="px-3 py-4 text-sm text-gray-500 overflow-hidden" style={ { maxWidth: '120px' } }>
														<div className="truncate">
															{ campaign.frequency }
														</div>
													</td>

													<td className="py-4 pl-3 pr-4 sm:pr-6 text-sm">
														<div className="flex gap-x-3 items-center flex-nowrap">
															<button type="button" className={ `focus:outline-none focus:ring-0 border-none bg-transparent p-0 m-0 cursor-pointer flex-shrink-0 ${
																campaign.startDate && campaign.startDate.trim() !== ''
																	? 'text-gray-500 hover:text-brand-900'
																	: 'text-amber-500 hover:text-amber-600'
															}` }>
																<Tooltip text={ `${ __( 'Start Date', 'solvex-ai-blogger' ) }: ${
																	campaign.startDate && campaign.startDate.trim() !== ''
																		? new Date( campaign.startDate ).toLocaleString()
																		: __( 'Not configured - Click Configure to set start date. Currently using creation date', 'solvex-ai-blogger' ) + ': ' + new Date( campaign.created_at ).toLocaleString()
																}` }
																delay={ 100 }
																className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	<CalendarArrowUp className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" />
																</Tooltip>
															</button>

															<button type="button" className="text-gray-500 hover:text-brand-900 focus:outline-none focus:ring-0 border-none bg-transparent p-0 m-0 cursor-pointer flex-shrink-0">
																<Tooltip text={ ( () => {
																	// Use direct metadata field to check if any posts have been created
																	const postsCreated = parseInt( campaign.postsCreated ) || 0;

																	// Show appropriate message based on posts created
																	if ( postsCreated === 0 ) {
																		return __( 'Scheduled - No posts yet', 'solvex-ai-blogger' );
																	}
																	return `${ __( 'Last Post Run', 'solvex-ai-blogger' ) }: ${ campaign.lastRun }`;
																} )() }
																delay={ 100 }
																className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	<Info className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" />
																</Tooltip>
															</button>

															<button type="button" className="text-gray-500 hover:text-brand-900 focus:outline-none focus:ring-0 border-none bg-transparent p-0 m-0 cursor-pointer flex-shrink-0" data-campaign_id={ campaign.id } onClick={ ( e ) => {
																viewCampaignPosts( e, campaign.id );
															} }>
																<Tooltip text={ __( 'Posts List', 'solvex-ai-blogger' ) }
																	delay={ 100 }
																	className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	<List className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" />
																</Tooltip>
															</button>

															<button type="button" data-campaign_id={ campaign.id } className="text-gray-500 hover:text-brand-900 focus:outline-none focus:ring-0 border-none bg-transparent p-0 m-0 cursor-pointer flex-shrink-0" onClick={ configureCampaign }>
																<Tooltip text={ __( 'Configure', 'solvex-ai-blogger' ) }
																	delay={ 100 }
																	className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	{
																		openingConfigureDrawer ? (
																			<RotateCw className="w-4 h-4 animate-spin" style={ { outline: 'none' } } tabIndex="-1" />
																		) : (
																			<Settings className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" />
																		)
																	}
																</Tooltip>
															</button>

															<button type="button" className="text-gray-500 hover:text-brand-900 focus:outline-none focus:ring-0 border-none bg-transparent p-0 m-0 cursor-pointer flex-shrink-0" data-campaign_id={ campaign.id } onClick={ ( e ) => {
																openCampaignAnalytics( e, campaign.id );
															} }>
																<Tooltip text={ __( 'Analytics', 'solvex-ai-blogger' ) }
																	delay={ 100 }
																	className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	<ChartNoAxesColumn className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" />
																</Tooltip>
															</button>

															{ shouldShowDebugLogs && (
																<button
																	type="button"
																	className="text-gray-500 hover:text-brand-900 focus:outline-none focus:ring-0 border-none bg-transparent p-0 m-0 cursor-pointer flex-shrink-0"
																	data-campaign_id={ campaign.id }
																	onClick={ ( e ) => {
																		e.preventDefault();
																		e.stopPropagation();
																		openCampaignLogs( e, campaign.id );
																	} }
																>
																	<Tooltip text={ __( 'View logs', 'solvex-ai-blogger' ) }
																		delay={ 100 }
																		className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																	>
																		<ScrollText className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" />
																	</Tooltip>
																</button>
															) }

															<button type="button" className="text-gray-500 hover:text-brand-900 focus:outline-none focus:ring-0 border-none bg-transparent p-0 m-0 cursor-pointer flex-shrink-0" data-campaign_id={ campaign.id } onClick={ ( e ) => {
																openDeleteModal( e, campaign.id );
															} }>
																<Tooltip text={ __( 'Delete', 'solvex-ai-blogger' ) }
																	delay={ 100 }
																	className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
																>
																	<Trash2 className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" />
																</Tooltip>
															</button>
														</div>
													</td>
												</tr>
											) )
										) : (
											<tr>
												<td colSpan="6" className="py-12 text-center">
													<div className="flex flex-col items-center justify-center gap-y-3">
														<Search className="w-8 h-8 text-gray-400" />
														<h3 className="text-sm font-medium text-gray-900 m-0 p-0">
															{ searchTerm
																? __( 'No campaigns found', 'solvex-ai-blogger' )
																: __( 'No campaigns match your search', 'solvex-ai-blogger' )
															}
														</h3>
														<p className="text-sm text-gray-500 max-w-sm">
															{ searchTerm
																? sprintf( /* translators: %s: search term */ __( 'No campaigns match "%s".', 'solvex-ai-blogger' ), searchTerm )
																: __( 'Try different search terms or clear your search to see all campaigns.', 'solvex-ai-blogger' )
															}
														</p>
														{ searchTerm && (
															<button
																type="button"
																onClick={ () => setSearchTerm( '' ) }
																className="mt-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-inset focus:ring-brand-600 border-none cursor-pointer outline-none transition-all duration-200"
															>
																{ __( 'Clear search', 'solvex-ai-blogger' ) }
															</button>
														) }
													</div>
												</td>
											</tr>
										) }
									</tbody>
								</table>
							</div>
						</div>
					) : null
				}
			</div>

			<ConfigureDrawer
				openDrawer={ openDrawer }
				setOpenDrawer={ setOpenDrawer }
				configureData={ configureData }
			/>

			<CampaignAnalyticsModal
				isOpen={ analyticsModal.isOpen }
				onClose={ () => setAnalyticsModal( { isOpen: false, campaignId: null, campaignData: null } ) }
				campaignId={ analyticsModal.campaignId }
				campaignData={ analyticsModal.campaignData }
			/>

			<CampaignLogsModal
				isOpen={ logsModal.isOpen }
				onClose={ () => setLogsModal( { isOpen: false, campaignId: null, campaignData: null } ) }
				campaignId={ logsModal.campaignId }
				campaignData={ logsModal.campaignData }
			/>

			<CampaignDeleteModal
				isOpen={ deleteModal.isOpen }
				onClose={ () => setDeleteModal( { isOpen: false, campaignId: null, campaignData: null } ) }
				campaignId={ deleteModal.campaignId }
				onDeleted={ handleCampaignDeleted }
			/>
		</>
	);
}
