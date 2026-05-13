import React, { memo, useCallback, useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import List from 'lucide-react/dist/esm/icons/list';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import apiFetch from '@wordpress/api-fetch';
import { ConfigureDrawer } from '@Elements/Campaigns';
import CampaignAnalyticsModal from '@Components/CampaignAnalyticsModal';
import { TrimWordsContent } from '@Utils/TrimWordsContent';
import { fetchCampaigns } from '@Utils/CampaignsApi';
import { cn } from '@Utils/cn';

const formatLastRun = ( lastRun ) => {
	if ( ! lastRun || lastRun === 'Not Started Yet.' ) {
		return __( 'Scheduled — No posts yet', 'solvex-ai-blogger' );
	}
	try {
		return new Date( lastRun ).toLocaleString( undefined, {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		} );
	} catch ( e ) {
		return lastRun;
	}
};

const getCampaignStatus = ( campaign ) => {
	const postsCreated = parseInt( campaign?.postsCreated, 10 ) || 0;
	const postsTarget = parseInt( campaign?.postsTarget, 10 ) || 0;
	const postsFailed = parseInt( campaign?.postsFailed, 10 ) || 0;
	const targetMet = postsTarget > 0 && postsCreated >= postsTarget;
	const allAttemptsMade = postsTarget > 0 && postsCreated + postsFailed >= postsTarget;
	const completed =
		campaign?.status === 'draft' || targetMet || allAttemptsMade || campaign?.campaignCompleted;

	if ( completed ) {
		return { label: __( 'Complete', 'solvex-ai-blogger' ), tone: 'text-foreground' };
	}
	if ( campaign?.isPaused ) {
		return { label: __( 'Paused', 'solvex-ai-blogger' ), tone: 'text-brand' };
	}
	return { label: __( 'Active', 'solvex-ai-blogger' ), tone: 'text-[oklch(0.55_0.16_155)]' };
};

const fetchCampaignMetaData = async ( campaignId ) => {
	const formData = new window.FormData();
	formData.append( 'action', 'wpsolvex_autoaiblogger_get_campaign_metadata' );
	formData.append( 'security', wpsolvex_autoaiblogger_localized_data.admin_nonce );
	formData.append( 'campaign_id', campaignId );

	try {
		const data = await apiFetch( {
			url: wpsolvex_autoaiblogger_localized_data.ajax_url,
			method: 'POST',
			body: formData,
		} );
		return data?.success ? data.data.data : null;
	} catch ( e ) {
		return null;
	}
};

const Row = ( { label, value, tone } ) => (
	<div className="flex items-baseline justify-between">
		<dt className="text-muted-foreground">{ label }</dt>
		<dd className={ cn( 'font-semibold tabular-nums', tone ) }>{ value }</dd>
	</div>
);

const IconBtn = ( { icon: Icon, onClick, label } ) => (
	<button
		type="button"
		onClick={ onClick }
		aria-label={ label }
		className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand"
	>
		<Icon className="size-3.5" aria-hidden="true" />
	</button>
);

const CampaignCard = memo( ( { campaign, onOpenAnalytics, onOpenConfigure, onOpenPosts } ) => {
	const status = getCampaignStatus( campaign );
	const lastRun = formatLastRun( campaign?.lastRun );
	const name = campaign?.title || __( 'Unnamed Campaign', 'solvex-ai-blogger' );

	return (
		<article className="group rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02] transition-colors hover:border-brand/25">
			<dl className="space-y-3 text-sm">
				<Row label={ __( 'Posts', 'solvex-ai-blogger' ) } value={ campaign?.postsCreated || 0 } />
				<Row label={ __( 'Visits', 'solvex-ai-blogger' ) } value={ campaign?.postsVisit || 0 } />
				<Row
					label={ __( 'Status', 'solvex-ai-blogger' ) }
					value={ <span className={ cn( 'font-medium', status.tone ) }>{ status.label }</span> }
				/>
				<Row
					label={ __( 'Last Post Run', 'solvex-ai-blogger' ) }
					value={ <span className="text-foreground">{ lastRun }</span> }
				/>
			</dl>
			<div className="mt-5 flex items-center justify-between border-t border-border pt-4">
				<button
					type="button"
					onClick={ () => onOpenConfigure( campaign ) }
					className="truncate text-sm font-medium text-brand hover:underline"
					title={ name }
				>
					<TrimWordsContent content={ name } count={ 5 } />
				</button>
				<div className="flex items-center gap-1">
					<IconBtn
						icon={ List }
						label={ __( 'View posts', 'solvex-ai-blogger' ) }
						onClick={ () => onOpenPosts( campaign ) }
					/>
					<IconBtn
						icon={ BarChart3 }
						label={ __( 'Analytics', 'solvex-ai-blogger' ) }
						onClick={ () => onOpenAnalytics( campaign ) }
					/>
					<IconBtn
						icon={ Settings2 }
						label={ __( 'Configure', 'solvex-ai-blogger' ) }
						onClick={ () => onOpenConfigure( campaign ) }
					/>
				</div>
			</div>
		</article>
	);
} );
CampaignCard.displayName = 'CampaignCard';

const LicenseRequiredState = memo( ( { onActivate } ) => (
	<div className="rounded-xl border border-dashed border-brand/40 bg-brand-soft/40 p-8 text-center">
		<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
			<Lock className="size-5" aria-hidden="true" />
		</div>
		<h3 className="text-base font-semibold tracking-tight">
			{ __( 'License required', 'solvex-ai-blogger' ) }
		</h3>
		<p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
			{ __( 'Activate your license to see campaign insights and analytics.', 'solvex-ai-blogger' ) }
		</p>
		<button
			type="button"
			onClick={ onActivate }
			className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
		>
			{ __( 'Activate license', 'solvex-ai-blogger' ) }
		</button>
	</div>
) );
LicenseRequiredState.displayName = 'CampaignsLicenseRequiredState';

const EmptyState = memo( () => (
	<div className="rounded-xl border border-border bg-card p-8 text-center ring-1 ring-black/[0.02]">
		<div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
			<BarChart3 className="size-5" aria-hidden="true" />
		</div>
		<h3 className="text-base font-semibold tracking-tight">
			{ __( 'No campaigns yet', 'solvex-ai-blogger' ) }
		</h3>
		<p className="mt-1 text-sm text-muted-foreground">
			{ __( 'Create your first campaign to start generating content automatically.', 'solvex-ai-blogger' ) }
		</p>
	</div>
) );
EmptyState.displayName = 'CampaignsEmptyState';

function CampaignsInsights() {
	const navigate = useNavigate();
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const homeSlug = useSelector( ( s ) => s.homeSlug ) || 'solvex-ai-blogger';
	const defaultMetaDefaults = useSelector( ( s ) => s.postmetaDefaults ) || {};

	const [ openDrawer, setOpenDrawer ] = useState( false );
	const [ configureData, setConfigureData ] = useState( defaultMetaDefaults );
	const [ analyticsModal, setAnalyticsModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );

	const [ topCampaigns, setTopCampaigns ] = useState( [] );
	// Start in the loading state so the first paint shows skeletons rather
	// than the empty state. Stale-while-revalidate keeps cached cards on
	// revisit (only swap to skeletons when we have nothing to render).
	const [ loadingCampaigns, setLoadingCampaigns ] = useState( true );

	useEffect( () => {
		if ( licenseStatus !== 'licensed' ) {
			setLoadingCampaigns( false );
			return undefined;
		}
		let cancelled = false;
		setLoadingCampaigns( true );
		fetchCampaigns( { page: 1, perPage: 4, orderBy: 'date', order: 'DESC' } )
			.then( ( data ) => {
				if ( ! cancelled ) {
					setTopCampaigns( Object.values( data.items || {} ) );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setTopCampaigns( [] );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoadingCampaigns( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ licenseStatus ] );

	const handleActivateLicense = useCallback( ( e ) => {
		e?.preventDefault?.();
		navigate( `?page=${ homeSlug }&path=settings/license` );
	}, [ navigate, homeSlug ] );

	const handleViewAll = useCallback( ( e ) => {
		e.preventDefault();
		navigate( `?page=${ homeSlug }&path=campaigns` );
	}, [ navigate, homeSlug ] );

	const handleOpenConfigure = useCallback( async ( campaign ) => {
		if ( ! campaign?.id ) {
			return;
		}
		const data = await fetchCampaignMetaData( campaign.id );
		if ( data ) {
			setConfigureData( { ...data, type: 'edit' } );
			setOpenDrawer( true );
		}
	}, [] );

	const handleOpenAnalytics = useCallback( ( campaign ) => {
		setAnalyticsModal( { isOpen: true, campaignId: campaign?.id, campaignData: campaign } );
	}, [] );

	const handleOpenPosts = useCallback( ( campaign ) => {
		if ( ! campaign?.id ) {
			return;
		}
		const postType = campaign?.postType || 'post';
		const adminUrl = wpsolvex_autoaiblogger_localized_data?.admin_url || '/wp-admin/';
		const url = postType === 'post'
			? `${ adminUrl }edit.php?wpsolvex_autoaiblogger_campaign_id=${ campaign.id }`
			: `${ adminUrl }edit.php?post_type=${ postType }&wpsolvex_autoaiblogger_campaign_id=${ campaign.id }`;
		window.open( url, '_blank', 'noopener,noreferrer' );
	}, [] );

	if ( licenseStatus !== 'licensed' ) {
		return (
			<section aria-labelledby="campaigns-insights-heading">
				<header className="mb-6">
					<h2 id="campaigns-insights-heading" className="text-2xl font-semibold tracking-tight">
						{ __( 'Campaigns Insights', 'solvex-ai-blogger' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Overview of active AI generation cycles.', 'solvex-ai-blogger' ) }
					</p>
				</header>
				<LicenseRequiredState onActivate={ handleActivateLicense } />
			</section>
		);
	}

	return (
		<section aria-labelledby="campaigns-insights-heading">
			<header className="mb-6 flex items-end justify-between">
				<div>
					<h2 id="campaigns-insights-heading" className="text-2xl font-semibold tracking-tight">
						{ __( 'Campaigns Insights', 'solvex-ai-blogger' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Overview of active AI generation cycles.', 'solvex-ai-blogger' ) }
					</p>
				</div>
				<a
					href={ `?page=${ homeSlug }&path=campaigns` }
					onClick={ handleViewAll }
					className="inline-flex items-center gap-1 text-sm font-medium text-brand no-underline hover:underline"
				>
					{ __( 'View all', 'solvex-ai-blogger' ) }
					<ArrowUpRight className="size-3.5" aria-hidden="true" />
				</a>
			</header>

			{ loadingCampaigns && topCampaigns.length === 0 ? (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					{ Array.from( { length: 2 } ).map( ( _, i ) => (
						<div key={ i } className="h-44 animate-pulse rounded-xl border border-border bg-muted/40" />
					) ) }
				</div>
			) : topCampaigns.length === 0 ? (
				<EmptyState />
			) : (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					{ topCampaigns.map( ( campaign ) => (
						<CampaignCard
							key={ campaign?.id || campaign?.title }
							campaign={ campaign }
							onOpenConfigure={ handleOpenConfigure }
							onOpenAnalytics={ handleOpenAnalytics }
							onOpenPosts={ handleOpenPosts }
						/>
					) ) }
				</div>
			) }

			<ConfigureDrawer
				openDrawer={ openDrawer }
				setOpenDrawer={ setOpenDrawer }
				configureData={ configureData }
				mode="edit"
			/>
			<CampaignAnalyticsModal
				isOpen={ analyticsModal.isOpen }
				onClose={ () => setAnalyticsModal( { isOpen: false, campaignId: null, campaignData: null } ) }
				campaignId={ analyticsModal.campaignId }
				campaignData={ analyticsModal.campaignData }
			/>
		</section>
	);
}

CampaignsInsights.displayName = 'CampaignsInsights';

export default memo( CampaignsInsights );
