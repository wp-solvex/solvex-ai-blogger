import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
	ScrollText,
	CheckCircle,
	XCircle,
	Clock,
	AlertTriangle,
	Activity,
	Info,
	ChevronDown,
	ChevronRight,
} from 'lucide-react';
import apiFetch from '@wordpress/api-fetch';

const CampaignLogsModal = ( { isOpen, onClose, campaignId, campaignData } ) => {
	const [ logsData, setLogsData ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ open, setOpen ] = useState( isOpen );
	const [ expandedLogs, setExpandedLogs ] = useState( new Set() );

	useEffect( () => {
		setOpen( isOpen );
		if ( isOpen && campaignId ) {
			fetchLogsData();
		}
	}, [ isOpen, campaignId ] );

	const closeModal = () => {
		setOpen( false );
		onClose();
	};

	const toggleLogExpansion = ( logId ) => {
		const newExpanded = new Set( expandedLogs );
		if ( newExpanded.has( logId ) ) {
			newExpanded.delete( logId );
		} else {
			newExpanded.add( logId );
		}
		setExpandedLogs( newExpanded );
	};

	const fetchLogsData = async () => {
		setLoading( true );
		setError( null );

		try {
			const formData = new FormData();
			formData.append( 'action', 'autoaib_get_campaign_logs' );
			formData.append( 'security', autoaib_localized_data.admin_nonce );
			formData.append( 'campaign_id', campaignId );

			const response = await apiFetch( {
				url: autoaib_localized_data.ajax_url,
				method: 'POST',
				body: formData,
			} );

			if ( response?.success ) {
				setLogsData( response.data );
			} else {
				setError( response?.data?.message || __( 'Failed to fetch logs data', 'auto-ai-blogger' ) );
			}
		} catch ( err ) {
			console.error( 'Error fetching logs:', err );
			setError( __( 'An error occurred while fetching logs data', 'auto-ai-blogger' ) );
		} finally {
			setLoading( false );
		}
	};

	const formatTimestamp = ( log ) => {
		// If we have a pre-formatted date from backend, use it
		if ( log?.formatted_date ) {
			return log.formatted_date;
		}

		// Fallback to timestamp processing for backward compatibility
		const timestamp = log?.timestamp || log;
		if ( ! timestamp ) {
			return '';
		}

		try {
			const date = new Date( timestamp );
			const now = new Date();
			const diffMs = now - date;
			const diffDays = Math.floor( diffMs / 86400000 );

			// For recent events (less than 7 days), show actual date/time
			// For older events, always show full date/time
			if ( diffDays >= 1 ) {
				return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
			}
			// For today's events, show time with "today" indicator
			return __( 'Today', 'auto-ai-blogger' ) + ' ' + date.toLocaleTimeString();
		} catch ( e ) {
			return timestamp;
		}
	};

	const getStatusIcon = ( status ) => {
		switch ( status?.toLowerCase() ) {
			case 'success':
			case 'completed':
			case 'published':
				return <CheckCircle className="w-4 h-4 text-green-600" />;
			case 'error':
			case 'failed':
			case 'failure':
				return <XCircle className="w-4 h-4 text-red-600" />;
			case 'warning':
			case 'partial':
				return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
			case 'scheduled':
			case 'pending':
				return <Clock className="w-4 h-4 text-brand-600" />;
			case 'running':
			case 'processing':
				return <Activity className="w-4 h-4 text-indigo-600 animate-spin" />;
			case 'info':
			default:
				return <Info className="w-4 h-4 text-gray-600" />;
		}
	};

	const getStatusBadge = ( status ) => {
		const baseClasses = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium';
		switch ( status?.toLowerCase() ) {
			case 'success':
			case 'completed':
			case 'published':
				return `${ baseClasses } bg-green-100 text-green-800`;
			case 'error':
			case 'failed':
			case 'failure':
				return `${ baseClasses } bg-red-100 text-red-800`;
			case 'warning':
			case 'partial':
				return `${ baseClasses } bg-yellow-100 text-yellow-800`;
			case 'scheduled':
			case 'pending':
				return `${ baseClasses } bg-brand-100 text-brand-800`;
			case 'running':
			case 'processing':
				return `${ baseClasses } bg-indigo-100 text-indigo-800`;
			case 'info':
			default:
				return `${ baseClasses } bg-gray-100 text-gray-800`;
		}
	};	return (
		<Dialog open={ open } onClose={ closeModal } className="relative z-999999">
			<div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
			<div className="fixed inset-0 z-999999 w-screen overflow-y-auto">
				<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
					<DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
						{ /* Header */ }
						<div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-200">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-brand-100 rounded-lg flex">
									<ScrollText className="w-5 h-5 text-brand-600" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900 m-0">
										{ __( 'Campaign Logs', 'auto-ai-blogger' ) }
									</h3>
									<p className="text-sm text-gray-600 m-0">
										{ campaignData?.name && `${ campaignData.name } - ` }{ __( 'Post creation history and scheduling logs', 'auto-ai-blogger' ) }
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={ closeModal }
								className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 p-2"
							>
								<XMarkIcon className="h-6 w-6 flex" />
							</button>
						</div>

						{ /* Content */ }
						<div className="px-6 py-4">
							{ loading ? (
								<div className="flex items-center justify-center py-8">
									<Activity className="w-6 h-6 text-gray-400 animate-spin mr-2" />
									<span className="text-gray-600">{ __( 'Loading logs…', 'auto-ai-blogger' ) }</span>
								</div>
							) : error ? (
								<div className="text-center py-8">
									<XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
									<p className="text-red-600">{ error }</p>
									<button
										onClick={ fetchLogsData }
										className="mt-2 text-brand-600 hover:text-brand-800 text-sm"
									>
										{ __( 'Try Again', 'auto-ai-blogger' ) }
									</button>
								</div>
							) : (
								<div className="space-y-4">
									{ /* Summary Stats */ }
									<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
										<div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
											<div className="flex items-center justify-between">
												<div className="flex flex-col gap-2">
													<p className="text-sm text-brand-600 m-0">{ __( 'Scheduled', 'auto-ai-blogger' ) }</p>
													<p className="text-lg font-semibold text-brand-900 m-0">
														{ parseInt( campaignData?.postsScheduled ) || 0 }
													</p>
												</div>
												<Clock className="w-5 h-5 text-brand-600" />
											</div>
										</div>
										<div className="bg-green-50 border border-green-200 rounded-lg p-4">
											<div className="flex items-center justify-between">
												<div className="flex flex-col gap-2">
													<p className="text-sm text-green-600 m-0">{ __( 'Successful', 'auto-ai-blogger' ) }</p>
													<p className="text-lg font-semibold text-green-900 m-0">
														{ parseInt( campaignData?.postsCreated ) || 0 }
													</p>
												</div>
												<CheckCircle className="w-5 h-5 text-green-600" />
											</div>
										</div>
										<div className="bg-red-50 border border-red-200 rounded-lg p-4">
											<div className="flex items-center justify-between">
												<div className="flex flex-col gap-2">
													<p className="text-sm text-red-600 m-0">{ __( 'Failed Attempts', 'auto-ai-blogger' ) }</p>
													<p className="text-lg font-semibold text-red-900 m-0">
														{ ( () => {
															// Calculate actual failed attempts from error logs
															// Count all error logs (including retries that eventually succeeded)
															const errorLogs = logsData?.logs?.filter( ( log ) =>
																log.status?.toLowerCase() === 'error' ||
																log.status?.toLowerCase() === 'failed' ||
																log.status?.toLowerCase() === 'failure'
															) || [];

															return errorLogs.length;
														} )() }
													</p>
												</div>
												<XCircle className="w-5 h-5 text-red-600" />
											</div>
										</div>
										<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
											<div className="flex items-center justify-between">
												<div className="flex flex-col gap-2">
													<p className="text-sm text-gray-600 m-0">{ __( 'Target', 'auto-ai-blogger' ) }</p>
													<p className="text-lg font-semibold text-gray-900 m-0">
														{ parseInt( campaignData?.postsTarget ) || 0 }
													</p>
												</div>
												<Activity className="w-5 h-5 text-gray-600" />
											</div>
										</div>
									</div>

									{ /* Campaign Info Cards */ }
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
										{ /* Start Date Card */ }
										<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
														{ __( 'Start Date', 'auto-ai-blogger' ) }
													</p>
													<p className="text-sm font-medium text-gray-900">
														{ ( () => {
															if ( campaignData?.startDate && campaignData.startDate.trim() !== '' ) {
																// Parse the lastRun format to match it exactly
																const startDate = new Date( campaignData.startDate );
																const formattedDate = startDate.toLocaleDateString( 'en-US', {
																	month: 'long',
																	day: 'numeric',
																	year: 'numeric',
																} );
																const formattedTime = startDate.toLocaleTimeString( 'en-US', {
																	hour: 'numeric',
																	minute: '2-digit',
																	hour12: true,
																} ).toLowerCase();
																return `${ formattedDate } ${ formattedTime }`;
															} else if ( campaignData?.created_at ) {
																const createdDate = new Date( campaignData.created_at );
																const formattedDate = createdDate.toLocaleDateString( 'en-US', {
																	month: 'long',
																	day: 'numeric',
																	year: 'numeric',
																} );
																const formattedTime = createdDate.toLocaleTimeString( 'en-US', {
																	hour: 'numeric',
																	minute: '2-digit',
																	hour12: true,
																} ).toLowerCase();
																return `${ formattedDate } ${ formattedTime }`;
															}
															return __( 'Not set', 'auto-ai-blogger' );
														} )() }
													</p>
												</div>
											</div>
										</div>

										{ /* End Date Card */ }
										<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
														{ __( 'End Date', 'auto-ai-blogger' ) }
													</p>
													<p className="text-sm font-medium text-gray-900">
														{ ( () => {
															// Check if campaign is completed
															const postsCreated = parseInt( campaignData?.postsCreated ) || 0;
															const postsScheduled = parseInt( campaignData?.postsScheduled ) || 0;
															const postsTarget = parseInt( campaignData?.postsTarget ) || 0;
															const isCompleted = campaignData?.campaignCompleted ||
																( postsTarget > 0 && ( postsScheduled >= postsTarget || postsCreated >= postsTarget ) );

															if ( isCompleted ) {
																// If completed, show the last run date as end date
																if ( campaignData?.lastRun && campaignData.lastRun !== 'Not Started Yet.' ) {
																	return campaignData.lastRun;
																}
																return __( 'Recently completed', 'auto-ai-blogger' );
															} else if ( campaignData?.status === 'publish' ) {
																return __( 'In progress', 'auto-ai-blogger' );
															}
															return __( 'Not started', 'auto-ai-blogger' );
														} )() }
													</p>
												</div>
											</div>
										</div>

										{ /* Frequency Card */ }
										<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
														{ __( 'Frequency', 'auto-ai-blogger' ) }
													</p>
													<p className="text-sm font-medium text-gray-900 truncate">
														{ ( () => {
															// Check if campaign is completed
															const postsCreated = parseInt( campaignData?.postsCreated ) || 0;
															const postsScheduled = parseInt( campaignData?.postsScheduled ) || 0;
															const postsTarget = parseInt( campaignData?.postsTarget ) || 0;
															const isCompleted = campaignData?.campaignCompleted ||
																( postsTarget > 0 && ( postsScheduled >= postsTarget || postsCreated >= postsTarget ) );

															if ( isCompleted ) {
																// For completed campaigns, show "Daily once" or similar
																const freq = campaignData?.frequency || '';
																if ( freq.toLowerCase().includes( 'daily' ) || freq.includes( '1' ) || freq.includes( 'day' ) ) {
																	return __( 'Daily once', 'auto-ai-blogger' );
																} else if ( freq.toLowerCase().includes( 'weekly' ) || freq.includes( 'week' ) ) {
																	return __( 'Weekly once', 'auto-ai-blogger' );
																} else if ( freq.toLowerCase().includes( 'hourly' ) || freq.includes( 'hour' ) ) {
																	return __( 'Hourly once', 'auto-ai-blogger' );
																}
																return freq || __( 'Daily once', 'auto-ai-blogger' );
															}
															return campaignData?.frequency || __( 'Not set', 'auto-ai-blogger' );
														} )() }
													</p>
												</div>
											</div>
										</div>
									</div>

									{ /* Activity Timeline */ }
									<div className="bg-white border border-gray-200 rounded-lg">
										<div className="px-4 py-3 border-b border-gray-200">
											<div className="flex items-center justify-between">
												<h4 className="text-base font-medium text-gray-900 m-0">{ __( 'Activity Timeline', 'auto-ai-blogger' ) }</h4>
												<button
													onClick={ fetchLogsData }
													className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 p-1 rounded-md"
													disabled={ loading }
												>
													<Activity className={ `w-3 h-3 ${ loading ? 'animate-spin' : '' }` } />
													{ __( 'Refresh', 'auto-ai-blogger' ) }
												</button>
											</div>
										</div>
										<div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
											{ logsData?.logs?.length > 0 ? (
												logsData.logs.map( ( log, index ) => {
													const logId = log.id || index;
													const isExpanded = expandedLogs.has( logId );
													const hasSteps = log.steps && log.steps.length > 0;

													return (
														<div key={ logId } className="px-4 py-3 hover:bg-gray-50 transition-colors">
															<div className="flex items-start space-x-3">
																<div className="flex-shrink-0 mt-1">
																	{ getStatusIcon( log.status ) }
																</div>
																<div className="flex-1 min-w-0">
																	{ /* Main log header */ }
																	<div className="flex items-center justify-between">
																		<div className="flex-1">
																			<div className="flex items-center space-x-2">
																				<h4 className="text-sm font-medium text-gray-900 m-0">
																					{ log.title || log.action || __( 'Campaign Activity', 'auto-ai-blogger' ) }
																				</h4>
																				<span className={ getStatusBadge( log.status ) }>
																					{ log.status?.charAt( 0 ).toUpperCase() + log.status?.slice( 1 ) || 'Unknown' }
																				</span>
																			</div>
																			{ log.message && (
																				<p className="text-xs text-gray-600 mt-1 m-0">{ log.message }</p>
																			) }
																		</div>
																		<div className="flex flex-col items-end space-y-1">
																			<span className="text-xs text-gray-700 font-medium">
																				{ formatTimestamp( log ) }
																			</span>
																			{ log.time_ago && (
																				<span className="text-xs text-gray-500">
																					{ log.time_ago }
																				</span>
																			) }
																		</div>
																		<div className="flex items-center space-x-2 ml-3">
																			{ hasSteps && (
																				<button
																					onClick={ () => toggleLogExpansion( logId ) }
																					className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
																					aria-label={ isExpanded ? __( 'Hide details', 'auto-ai-blogger' ) : __( 'Show details', 'auto-ai-blogger' ) }
																				>
																					{ isExpanded ? (
																						<ChevronDown className="w-4 h-4" />
																					) : (
																						<ChevronRight className="w-4 h-4" />
																					) }
																				</button>
																			) }
																		</div>
																	</div>

																	{ /* Post details - always visible */ }
																	{ ( log.post_id || log.post_title ) && (
																		<div className="flex items-center gap-2 text-xs mt-2">
																			{ log.post_id && (
																				<span className="inline-flex items-center px-2 py-1 bg-brand-50 text-brand-700 rounded-full">
																					<span className="w-2 h-2 bg-brand-500 rounded-full mr-1"></span>
																					{ __( 'ID:', 'auto-ai-blogger' ) } { log.post_id }
																				</span>
																			) }
																			{ log.post_title && (
																				<span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full">
																					<ScrollText className="w-3 h-3 mr-1" />
																					{ log.post_id && log.status === 'success' ? (
																						<a
																							href={ `${ autoaib_localized_data.admin_url || '/wp-admin/' }post.php?post=${ log.post_id }&action=edit` }
																							target="_blank"
																							rel="noopener noreferrer"
																							className="text-green-700 no-underline hover:cursor-pointer"
																							title={ __( 'Edit Post', 'auto-ai-blogger' ) }
																						>
																							{ log.post_title.length > 40 ? log.post_title.substring( 0, 40 ) + '...' : log.post_title }
																						</a>
																					) : (
																						<span>
																							{ log.post_title.length > 40 ? log.post_title.substring( 0, 40 ) + '...' : log.post_title }
																						</span>
																					) }
																				</span>
																			) }
																		</div>
																	) }

																	{ /* Error details - always visible if present */ }
																	{ log.error_details && (
																		<div className="bg-red-50 border border-red-200 rounded-md p-2 mt-2">
																			<p className="text-xs text-red-800 m-0 font-medium">{ __( 'Error Details:', 'auto-ai-blogger' ) }</p>
																			<p className="text-xs text-red-700 mt-1 m-0">{ log.error_details }</p>
																		</div>
																	) }

																	{ /* Collapsible Steps/Process details */ }
																	{ hasSteps && isExpanded && (
																		<div className="mt-3 border border-gray-200 rounded-md p-3 bg-gray-50">
																			<p className="text-xs font-medium text-gray-700 m-0">{ __( 'Process Steps:', 'auto-ai-blogger' ) }</p>
																			<div className="space-y-2 mt-2">
																				{ log.steps.map( ( step, stepIndex ) => (
																					<div key={ stepIndex } className="flex items-center justify-between">
																						<div className="flex items-center space-x-2">
																							{ getStatusIcon( step.status ) }
																							<span className="text-xs text-gray-600">{ step.description }</span>
																						</div>
																						{ step.duration && (
																							<span className="text-xs text-gray-500 font-mono">
																								{ step.duration }ms
																							</span>
																						) }
																					</div>
																				) ) }
																			</div>
																		</div>
																	) }
																</div>
															</div>
														</div>
													);
												} )
											) : (
												<div className="px-4 py-12 text-center">
													<div className="flex flex-col items-center">
														<ScrollText className="w-12 h-12 text-gray-300 mb-4" />
														<h5 className="text-sm font-medium text-gray-900 mb-1">{ __( 'No Activity Yet', 'auto-ai-blogger' ) }</h5>
														<p className="text-xs text-gray-500 max-w-sm">
															{ __( 'Post creation logs will appear here once your campaign starts generating content. Make sure your campaign is active and properly configured.', 'auto-ai-blogger' ) }
														</p>
														{ campaignData?.status !== 'publish' && (
															<div className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
																{ __( 'Campaign is currently inactive. Activate it to start generating logs.', 'auto-ai-blogger' ) }
															</div>
														) }
													</div>
												</div>
											) }
										</div>
									</div>
								</div>
							) }
						</div>

						{ /* Footer */ }
						<div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
							<div className="flex items-center justify-between">
								<p className="text-xs text-gray-500 m-0">
									{ __( 'Logs are automatically generated during post creation and scheduling.', 'auto-ai-blogger' ) }
								</p>
								<button
									type="button"
									onClick={ closeModal }
									className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
								>
									{ __( 'Close', 'auto-ai-blogger' ) }
								</button>
							</div>
						</div>
					</DialogPanel>
				</div>
			</div>
		</Dialog>
	);
};

export default CampaignLogsModal;
