import React, { useMemo, useCallback, memo, useState, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { Lock, TrendingUp, Eye, BarChart3, ExternalLink, ChartNoAxesColumn, RotateCw, Settings, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TrimWordsContent } from '@Utils/TrimWordsContent';
import { ConfigureDrawer } from '@Elements/Campaigns';
import CampaignAnalyticsModal from '@Components/CampaignAnalyticsModal';
import { Tooltip } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

// Enhanced metric card component with animations and accessibility.
const MetricCard = memo( ( { metric, value, description, icon: Icon, trend, className = '', getOnlyDetails = false } ) => (
	<div className={ `${ getOnlyDetails ? '' : 'bg-white rounded-lg p-4 border border-solid border-gray-200 hover:border-brand transition-all duration-200 shadow-sm hover:shadow-lg' } ${ className }` }>
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				{
					! getOnlyDetails && (
						<div className={ `${ getOnlyDetails ? '' : 'p-2 bg-brand-50 rounded-lg' }` }>
							<Icon className="w-4 h-4 text-brand flex" aria-hidden="true" />
						</div>
					)
				}
				<span className="text-xs font-medium text-gray-600">{ metric }</span>
			</div>

			<div className={ `${ getOnlyDetails ? 'text-sm' : 'text-xl' } font-semibold text-gray-900` } aria-label={ `${ metric }: ${ value }` }>
				{ value }
				{ trend && (
					<div className={ `flex items-center gap-1 text-xs ${ trend > 0 ? 'text-green-600' : 'text-red-600' }` }>
						<TrendingUp className="w-3 h-3" aria-hidden="true" />
						<span>{ Math.abs( trend ) }%</span>
					</div>
				) }
			</div>
		</div>

		{ description && (
			<div className="space-y-1">
				<p className="text-xs text-gray-500">{ description }</p>
			</div>
		) }
	</div>
) );

MetricCard.displayName = 'CampaignMetricCard';

// Helper function to format date consistently
const formatLastPostRun = ( lastRun ) => {
	if ( ! lastRun || lastRun === 'Not Started Yet.' ) {
		return 'Scheduled - No posts yet';
	}

	try {
		const date = new Date( lastRun );
		return date.toLocaleString( 'en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		} );
	} catch ( error ) {
		return lastRun;
	}
};

// Enhanced campaign card component with better UX.
const CampaignCard = memo( ( { campaign } ) => {
	const navigate = useNavigate();
	const defaultMetaDefaults = autoaib_localized_data.postmeta_defaults;

	const campaigns = useSelector( ( state ) => state.allCampaigns ) || {};
	const isPerformant = ( campaign?.postsVisit || 0 ) > 100;
	const [ openingConfigureDrawer, setOpeningConfigureDrawer ] = useState( false );
	const [ analyticsModal, setAnalyticsModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );
	const [ viewConfigureData, setViewConfigureData ] = useState( defaultMetaDefaults ); // eslint-disable-line no-unused-vars
	const [ openViewDrawer, setOpenViewDrawer ] = useState( false );
	const [ openDrawer, setOpenDrawer ] = useState( false );
	const [ configureData, setConfigureData ] = useState( defaultMetaDefaults );

	const fetchCampaignMetaData = async ( campaignId ) => {
		const formData = new window.FormData();

		formData.append( 'action', 'autoaib_get_campaign_metadata' );
		formData.append( 'security', autoaib_localized_data.admin_nonce );
		formData.append( 'campaign_id', campaignId );

		const response = await apiFetch( {
			url: autoaib_localized_data.ajax_url,
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

	const viewCampaignPosts = ( e, campaignId ) => {
		e.preventDefault();

		// Get the campaign data to determine the post type
		const campaignData = campaigns[ campaignId ];
		const postType = campaignData?.postType || 'post'; // Default to 'post' if not found.

		// Redirect to All Posts page with campaign filter
		const adminUrl = autoaib_localized_data.admin_url || '/wp-admin/';
		let filterUrl;

		// For 'post' type, we don't need to specify post_type parameter
		if ( postType === 'post' ) {
			filterUrl = `${ adminUrl }edit.php?autoaib_campaign_id=${ campaignId }`;
		} else {
			filterUrl = `${ adminUrl }edit.php?post_type=${ postType }&autoaib_campaign_id=${ campaignId }`;
		}

		window.open( filterUrl, '_blank' );
	};

	const openCampaignAnalytics = ( e, campaignId ) => {
		e.preventDefault();

		// Get the campaign data.
		const campaignData = campaigns[ campaignId ];

		// Open analytics modal.
		setAnalyticsModal( {
			isOpen: true,
			campaignId,
			campaignData,
		} );
	};

	return (
		<div className="relative overflow-hidden rounded-lg bg-white shadow-sm border border-solid border-gray-200 hover:shadow-md hover:border-brand transition-all duration-200 flex flex-col h-full">
			{ /* Performance indicator */ }
			{ isPerformant && (
				<div className="absolute top-2 right-2 bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-medium z-10">
					{ __( 'High', 'auto-ai-blogger' ) }
				</div>
			) }

			<div className="p-3 flex-1">
				{ /* Metrics grid */ }
				<div className="flex flex-col gap-2">
					<MetricCard
						metric={ __( 'Posts', 'auto-ai-blogger' ) }
						value={ campaign?.postsCreated || '0' }
						icon={ BarChart3 }
						getOnlyDetails={ true }
					/>
					<MetricCard
						metric={ __( 'Visits', 'auto-ai-blogger' ) }
						value={ campaign?.postsVisit || '0' }
						icon={ Eye }
						trend={ campaign?.visitTrend }
						getOnlyDetails={ true }
					/>
					<div className="flex items-center justify-between min-h-[24px]">
						<span className="text-xs font-medium text-gray-600">{ __( 'Status', 'auto-ai-blogger' ) }</span>
						<div className="text-sm font-semibold text-right capitalize">
							{ ( () => {
								// Use same logic as Campaigns.js switch tooltip
								const postsCreated = parseInt( campaign?.postsCreated ) || 0;
								const postsTarget = parseInt( campaign?.postsTarget ) || 0;
								const postsFailed = parseInt( campaign?.postsFailed ) || 0;
								const isPaused = campaign?.isPaused || false;
								const campaignCompleted = campaign?.campaignCompleted || false;

								// Check if completed
								const isTargetMet = postsTarget > 0 && postsCreated >= postsTarget;
								const allAttemptsMade = postsTarget > 0 && ( postsCreated + postsFailed ) >= postsTarget;
								const isCompleted = campaign?.status === 'draft' || isTargetMet || allAttemptsMade || campaignCompleted;

								if ( isCompleted ) {
									return <span className="text-gray-600">{ __( 'Complete', 'auto-ai-blogger' ) }</span>;
								}
								if ( isPaused ) {
									return <span className="text-brand">{ __( 'Paused', 'auto-ai-blogger' ) }</span>;
								}
								return <span className="text-green-600">{ __( 'Active', 'auto-ai-blogger' ) }</span>;
							} )() }
						</div>
					</div>
					<div className="flex items-center justify-between min-h-[24px]">
						<span className="text-xs font-medium text-gray-600">{ __( 'Last Post Run', 'auto-ai-blogger' ) }</span>
						<div className="text-sm font-semibold text-gray-900 text-right">
							{ formatLastPostRun( campaign?.lastRun ) }
						</div>
					</div>
				</div>
			</div>

			{ /* Enhanced footer with action - Fixed height for consistency */ }
			<div className="bg-gray-50 px-3 py-2.5 border-t border-gray-100 w-full flex items-center justify-between text-sm font-medium transition-all duration-200 min-h-[52px]">
				<a
					href={ `?page=auto-ai-blogger&path=campaigns&id=${ campaign.id }` }
					className="text-brand hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded-md transition-colors duration-200 no-underline truncate flex-1 min-w-0 mr-2"
					onClick={ ( e ) => {
						e.preventDefault();
						navigate( `?page=auto-ai-blogger&path=campaigns&id=${ campaign.id }` );
					} }
					title={ campaign?.title || __( 'Unnamed Campaign', 'auto-ai-blogger' ) }
				>
					<TrimWordsContent
						content={ campaign?.title || __( 'Unnamed Campaign', 'auto-ai-blogger' ) }
						count={ 5 }
					/>
				</a>

				<div className="flex items-center gap-x-1.5 flex-shrink-0">
					<a href="#" className="text-gray-500 hover:text-brand-900" data-campaign_id={ campaign.id } onClick={ ( e ) => {
						viewCampaignPosts( e, campaign.id );
					} }>
						<Tooltip text={ __( 'Posts List', 'auto-ai-blogger' ) }
							delay={ 100 }
							className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
						>
							<List className="w-3.5 h-3.5 text-brand hover:text-brand-700" style={ { outline: 'none' } } tabIndex="-1" />
						</Tooltip>
					</a>

					<a href="#" className="text-gray-500 hover:text-brand-900" data-campaign_id={ campaign.id } onClick={ ( e ) => {
						openCampaignAnalytics( e, campaign.id );
					} }>
						<Tooltip text={ __( 'Analytics', 'auto-ai-blogger' ) }
							delay={ 100 }
							className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
						>
							<ChartNoAxesColumn className="w-3.5 h-3.5 text-brand hover:text-brand-700" style={ { outline: 'none' } } tabIndex="-1" />
						</Tooltip>
					</a>

					<a href="#" data-campaign_id={ campaign.id } className="text-gray-500 hover:text-brand-900" onClick={ configureCampaign }>
						<Tooltip text={ __( 'Configure', 'auto-ai-blogger' ) }
							delay={ 100 }
							className="z-999999 bg-black text-xs text-white shadow-md p-2 rounded-md"
						>
							{
								openingConfigureDrawer ? (
									<RotateCw className="w-3.5 h-3.5 animate-spin text-brand hover:text-brand-700" style={ { outline: 'none' } } tabIndex="-1" />
								) : (
									<Settings className="w-3.5 h-3.5 text-brand hover:text-brand-700" style={ { outline: 'none' } } tabIndex="-1" />
								)
							}
						</Tooltip>
					</a>
				</div>
			</div>

			<ConfigureDrawer
				openDrawer={ openDrawer }
				setOpenDrawer={ setOpenDrawer }
				configureData={ configureData }
				mode="edit"
			/>

			<ConfigureDrawer
				openDrawer={ openViewDrawer }
				setOpenDrawer={ setOpenViewDrawer }
				configureData={ viewConfigureData }
				mode="view"
			/>

			<CampaignAnalyticsModal
				isOpen={ analyticsModal.isOpen }
				onClose={ () => setAnalyticsModal( { isOpen: false, campaignId: null, campaignData: null } ) }
				campaignId={ analyticsModal.campaignId }
				campaignData={ analyticsModal.campaignData }
			/>
		</div>
	);
} );

CampaignCard.displayName = 'CampaignInsightCard';

// Enhanced license required component
const LicenseRequiredState = memo( ( { onNavigateToLicense } ) => (
	<div className="flex flex-col items-center justify-center gap-6 border-2 border-dashed border-orange-300 rounded-xl p-8 max-w-lg mx-auto mt-12 bg-orange-50 hover:bg-orange-100 transition-colors">
		<div className="p-4 bg-orange-100 rounded-full">
			<Lock className="w-8 h-8 text-orange-600" aria-hidden="true" />
		</div>

		<div className="text-center space-y-2">
			<h3 className="text-xl font-semibold text-orange-900">
				{ __( 'License Required', 'auto-ai-blogger' ) }
			</h3>
			<p className="text-orange-700 max-w-md">
				{ __( 'Activate your license to access campaign insights and performance analytics.', 'auto-ai-blogger' ) }
			</p>
		</div>

		<button
			type="button"
			onClick={ onNavigateToLicense }
			className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
			aria-label={ __( 'Navigate to license settings', 'auto-ai-blogger' ) }
		>
			{ __( 'Activate License', 'auto-ai-blogger' ) }
			<ExternalLink className="w-4 h-4" aria-hidden="true" />
		</button>
	</div>
) );

LicenseRequiredState.displayName = 'CampaignsLicenseRequiredState';

// Enhanced empty state component
const EmptyState = memo( () => (
	<div className="text-center py-12 bg-white shadow-sm rounded-lg border border-gray-200">
		<div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
			<BarChart3 className="w-8 h-8 text-gray-400" aria-hidden="true" />
		</div>
		<h3 className="text-lg font-medium text-gray-900 mb-2">
			{ __( 'No Campaign Data Available', 'auto-ai-blogger' ) }
		</h3>
		<p className="text-gray-500 max-w-lg !m-auto">
			{ __( 'Campaign insights will appear here once you create and run your first campaign.', 'auto-ai-blogger' ) }
		</p>
	</div>
) );

EmptyState.displayName = 'CampaignsEmptyState';

// Main component with enhanced features
function CampaignsInsights( { onError } ) {
	const navigate = useNavigate();
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';
	const allCampaigns = useSelector( ( state ) => state.allCampaigns ) || {};
	const homeSlug = useSelector( ( state ) => state.homeSlug ) || 'auto-ai-blogger';
	const scrollContainerRef = useRef( null );
	const [ canScrollLeft, setCanScrollLeft ] = useState( false );
	const [ canScrollRight, setCanScrollRight ] = useState( false );

	// Memoized campaigns data with enhancements
	const campaignsData = useMemo( () => {
		const campaigns = allCampaigns;

		if ( ! campaigns || typeof campaigns !== 'object' ) {
			return { campaigns: [], totalCampaigns: 0, activeCampaigns: 0, totalPosts: 0, totalVisits: 0, recentCampaigns: [] };
		}

		const campaignArray = Object.values( campaigns );
		const activeCampaigns = campaignArray.filter( ( c ) => c.status === 'active' ).length;
		const totalPosts = campaignArray.reduce( ( sum, c ) => sum + ( parseInt( c.postsCreated ) || 0 ), 0 );
		const totalVisits = campaignArray.reduce( ( sum, c ) => sum + ( parseInt( c.postsVisit ) || 0 ), 0 );

		// Sort campaigns by creation date (most recent first) and get top 10 for horizontal scroll
		const recentCampaigns = [ ...campaignArray ]
			.sort( ( a, b ) => {
				// Sort by created_at date (newest first)
				const dateA = a.created_at ? new Date( a.created_at ) : new Date( 0 );
				const dateB = b.created_at ? new Date( b.created_at ) : new Date( 0 );
				return dateB - dateA; // Most recent first
			} )
			.slice( 0, 10 );

		return {
			campaigns: campaignArray,
			totalCampaigns: campaignArray.length,
			activeCampaigns,
			totalPosts,
			totalVisits,
			recentCampaigns,
		};
	}, [ allCampaigns ] );

	// Enhanced navigation handlers.
	const handleNavigateToLicense = useCallback( ( event ) => {
		event.preventDefault();
		try {
			navigate( `?page=${ homeSlug }&path=settings&tab=license` );
		} catch ( error ) {
			console.error( 'Navigation error:', error );
			onError?.( error, { component: 'CampaignsInsights', action: 'navigate_to_license' } );
		}
	}, [ navigate, onError, homeSlug ] );

	// Scroll navigation handlers
	const updateScrollButtons = useCallback( () => {
		if ( scrollContainerRef.current ) {
			const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
			setCanScrollLeft( scrollLeft > 0 );
			setCanScrollRight( scrollLeft < scrollWidth - clientWidth - 10 ); // 10px threshold
		}
	}, [] );

	const scrollLeft = useCallback( () => {
		if ( scrollContainerRef.current ) {
			const cardWidth = 320 + 16; // card width (80 * 4px) + gap (16px)
			scrollContainerRef.current.scrollBy( {
				left: -cardWidth,
				behavior: 'smooth',
			} );
			setTimeout( updateScrollButtons, 300 ); // Update after animation
		}
	}, [ updateScrollButtons ] );

	const scrollRight = useCallback( () => {
		if ( scrollContainerRef.current ) {
			const cardWidth = 320 + 16; // card width (80 * 4px) + gap (16px)
			scrollContainerRef.current.scrollBy( {
				left: cardWidth,
				behavior: 'smooth',
			} );
			setTimeout( updateScrollButtons, 300 ); // Update after animation
		}
	}, [ updateScrollButtons ] );

	// Update scroll buttons on mount and when campaigns change
	React.useEffect( () => {
		updateScrollButtons();
		const container = scrollContainerRef.current;
		if ( container ) {
			container.addEventListener( 'scroll', updateScrollButtons );
			return () => container.removeEventListener( 'scroll', updateScrollButtons );
		}
	}, [ campaignsData.recentCampaigns, updateScrollButtons ] );

	// License check.
	if ( licenseStatus !== 'licensed' ) {
		return <LicenseRequiredState onNavigateToLicense={ handleNavigateToLicense } />;
	}

	// Empty state.
	if ( ! campaignsData.campaigns || campaignsData.campaigns.length === 0 ) {
		return (
			<section
				className="px-4 sm:px-6 lg:px-8 pb-8 pt-8"
				aria-labelledby="campaigns-insights-heading"
			>
				<div className="mb-6">
					<h2 id="campaigns-insights-heading" className="text-xl font-bold text-gray-900 p-0 m-0">
						{ __( 'Campaigns Insights', 'auto-ai-blogger' ) }
					</h2>
					<p className="text-gray-600 mt-1">
						{ __( 'Monitor your campaign performance and analytics.', 'auto-ai-blogger' ) }
					</p>
				</div>
				<EmptyState />
			</section>
		);
	}

	return (
		<section
			className="px-4 sm:px-6 lg:px-8 py-8"
			aria-labelledby="campaigns-insights-heading"
		>
			{ /* Header with View All link */ }
			<div className="flex items-center justify-between mb-6">
				<h2 id="campaigns-insights-heading" className="text-xl font-bold text-gray-900 p-0 m-0">
					{ __( 'Campaigns Insights', 'auto-ai-blogger' ) }
				</h2>
				<a
					href={ `?page=${ homeSlug }&path=campaigns` }
					onClick={ ( e ) => {
						e.preventDefault();
						navigate( `?page=${ homeSlug }&path=campaigns` );
					} }
					className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-700 no-underline transition-colors"
				>
					{ __( 'View All', 'auto-ai-blogger' ) }
					<ExternalLink className="w-3.5 h-3.5" />
				</a>
			</div>

			{ /* Scrollable container with arrow navigation */ }
			<div className="relative">
				{ /* Left arrow */ }
				{ canScrollLeft && (
					<button
						onClick={ scrollLeft }
						className="absolute left-2 top-1/2 -translate-y-1/2 pb-1 z-10 bg-white hover:bg-gray-50 border-[3px] border-brand rounded-full p-2 shadow-lg transition-all duration-200"
						aria-label={ __( 'Scroll left', 'auto-ai-blogger' ) }
					>
						<ChevronLeft className="w-5 h-5 text-brand" />
					</button>
				) }

				{ /* Right arrow */ }
				{ canScrollRight && (
					<button
						onClick={ scrollRight }
						className="absolute right-2 top-1/2 -translate-y-1/2 pb-1 z-10 bg-white hover:bg-gray-50 border-[3px] border-brand rounded-full p-2 shadow-lg transition-all duration-200"
						aria-label={ __( 'Scroll right', 'auto-ai-blogger' ) }
					>
						<ChevronRight className="w-5 h-5 text-brand" />
					</button>
				) }

				{ /* Horizontal scrollable container */ }
				<div
					ref={ scrollContainerRef }
					className="overflow-x-auto -mx-4 px-4"
					style={ { scrollbarWidth: 'none', msOverflowStyle: 'none' } }
				>
					<style>{ `
						.overflow-x-auto::-webkit-scrollbar {
							display: none;
						}
					` }</style>
					<div className="flex gap-4 min-w-max">
						{ campaignsData.recentCampaigns && campaignsData.recentCampaigns.length > 0 ? (
							campaignsData.recentCampaigns.map( ( campaign, index ) => (
								<div key={ campaign?.id || `campaign-${ index }` } className="w-80 flex-shrink-0">
									<CampaignCard campaign={ campaign } />
								</div>
							) )
						) : (
							<div className="w-full flex flex-col items-center justify-center py-12 text-gray-500">
								<BarChart3 className="w-12 h-12 mb-4 text-gray-300" />
								<p className="text-lg font-medium mb-2">
									{ __( 'No campaigns found', 'auto-ai-blogger' ) }
								</p>
								<p className="text-sm">
									{ __( 'Create your first campaign to start generating content automatically.', 'auto-ai-blogger' ) }
								</p>
							</div>
						) }
					</div>
				</div>
			</div>
		</section>
	);
}

// Add display name for debugging
CampaignsInsights.displayName = 'CampaignsInsights';

export default memo( CampaignsInsights );
