import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import apiFetch from '@wordpress/api-fetch';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import List from 'lucide-react/dist/esm/icons/list';
import CalendarPlus from 'lucide-react/dist/esm/icons/calendar-plus';
import Info from 'lucide-react/dist/esm/icons/info';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { Switch } from '@Components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@Components/ui/tooltip';
import { ConfigureDrawer } from '@Elements/Campaigns';
import CampaignAnalyticsModal from '@Components/CampaignAnalyticsModal';
import CampaignLogsModal from '@Components/CampaignLogsModal';
import CampaignDeleteModal from '@Components/CampaignDeleteModal';
import { fetchCampaigns } from '@Utils/CampaignsApi';
import { toast } from '@Utils/toast';
import { cn } from '@Utils/cn';

const SORT_OPTIONS = [
	{ value: 'latest', label: __( 'Latest first', 'solvex-ai-blogger' ), orderBy: 'date', order: 'DESC' },
	{ value: 'oldest', label: __( 'Oldest first', 'solvex-ai-blogger' ), orderBy: 'date', order: 'ASC' },
	{ value: 'name-asc', label: __( 'Name A → Z', 'solvex-ai-blogger' ), orderBy: 'title', order: 'ASC' },
	{ value: 'name-desc', label: __( 'Name Z → A', 'solvex-ai-blogger' ), orderBy: 'title', order: 'DESC' },
];

const STATUS_OPTIONS = [
	{ value: '', label: __( 'All campaigns', 'solvex-ai-blogger' ) },
	{ value: 'active', label: __( 'Active', 'solvex-ai-blogger' ) },
	{ value: 'paused', label: __( 'Paused', 'solvex-ai-blogger' ) },
	{ value: 'completed', label: __( 'Completed', 'solvex-ai-blogger' ) },
];

function deriveCampaignState( campaign ) {
	const postsCreated = parseInt( campaign?.postsCreated, 10 ) || 0;
	const postsTarget = parseInt( campaign?.postsTarget, 10 ) || 0;
	const postsFailed = parseInt( campaign?.postsFailed, 10 ) || 0;
	const isCompleted =
		campaign?.status === 'draft' ||
		( postsTarget > 0 && postsCreated >= postsTarget ) ||
		( postsTarget > 0 && postsCreated + postsFailed >= postsTarget ) ||
		campaign?.campaignCompleted;
	if ( isCompleted ) {
		return 'completed';
	}
	if ( campaign?.isPaused ) {
		return 'paused';
	}
	return 'active';
}

function RowIcon( { icon: Icon, onClick, label, danger, disabled } ) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={ onClick }
					disabled={ disabled }
					aria-label={ label }
					className={ cn(
						'rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50',
						danger ? 'hover:text-destructive' : 'hover:text-brand'
					) }
				>
					<Icon className="size-3.5" aria-hidden="true" />
				</button>
			</TooltipTrigger>
			<TooltipContent>{ label }</TooltipContent>
		</Tooltip>
	);
}

function Pill( { tone, children } ) {
	const map = {
		success: 'bg-[oklch(0.95_0.05_155)] text-[oklch(0.4_0.16_155)]',
		brand: 'bg-brand-soft text-brand',
		destructive: 'bg-destructive/10 text-destructive',
	};
	return (
		<span className={ cn( 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', map[ tone ] || map.brand ) }>
			{ children }
		</span>
	);
}

function useDebouncedValue( value, delay = 300 ) {
	const [ debounced, setDebounced ] = useState( value );
	useEffect( () => {
		const t = setTimeout( () => setDebounced( value ), delay );
		return () => clearTimeout( t );
	}, [ value, delay ] );
	return debounced;
}

function Campaigns() {
	const dispatch = useDispatch();

	const campaignsList = useSelector( ( s ) => s.campaignsList ) || {};
	const pagination = useSelector( ( s ) => s.campaignsPagination ) || { page: 1, perPage: 20, total: 0, totalPages: 0 };
	const loading = useSelector( ( s ) => s.campaignsListLoading );
	const error = useSelector( ( s ) => s.campaignsListError );
	const postmetaDefaults = useSelector( ( s ) => s.postmetaDefaults ) || {};
	const adminNonce = useSelector( ( s ) => s.adminNonce );
	const ajaxUrl = useSelector( ( s ) => s.ajaxUrl );

	const [ search, setSearch ] = useState( '' );
	const [ statusFilter, setStatusFilter ] = useState( '' );
	const [ sortValue, setSortValue ] = useState( 'latest' );
	const [ page, setPage ] = useState( 1 );
	const debouncedSearch = useDebouncedValue( search, 300 );

	const [ updatingStatus, setUpdatingStatus ] = useState( {} );

	const [ configureData, setConfigureData ] = useState( postmetaDefaults );
	const [ openDrawer, setOpenDrawer ] = useState( false );
	const [ analyticsModal, setAnalyticsModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );
	const [ logsModal, setLogsModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );
	const [ deleteModal, setDeleteModal ] = useState( { isOpen: false, campaignId: null, campaignData: null } );

	const shouldShowDebugLogs = useMemo( () => {
		const params = new URLSearchParams( window.location.search );
		return params.get( 'debugLogs' ) === 'true';
	}, [] );

	const { orderBy, order } = useMemo( () => {
		const found = SORT_OPTIONS.find( ( s ) => s.value === sortValue ) || SORT_OPTIONS[ 0 ];
		return { orderBy: found.orderBy, order: found.order };
	}, [ sortValue ] );

	// Reload trigger so external actions (e.g. delete) can force a re-fetch
	// without changing query params.
	const [ reloadToken, setReloadToken ] = useState( 0 );

	useEffect( () => {
		let cancelled = false;

		dispatch( { type: 'CAMPAIGNS_LIST_START' } );
		fetchCampaigns( {
			page,
			perPage: 20,
			search: debouncedSearch,
			status: statusFilter,
			orderBy,
			order,
		} )
			.then( ( data ) => {
				if ( cancelled ) {
					return;
				}
				dispatch( { type: 'CAMPAIGNS_LIST_LOADED', payload: data } );
			} )
			.catch( ( e ) => {
				if ( cancelled ) {
					return;
				}
				dispatch( {
					type: 'CAMPAIGNS_LIST_ERRORED',
					payload: { message: e?.message || __( 'Failed to load campaigns', 'solvex-ai-blogger' ) },
				} );
			} );

		return () => {
			cancelled = true;
		};
	}, [ dispatch, page, debouncedSearch, statusFilter, orderBy, order, reloadToken ] );

	useEffect( () => {
		setPage( 1 );
	}, [ debouncedSearch, statusFilter, sortValue ] );

	const refetch = useCallback( () => setReloadToken( ( t ) => t + 1 ), [] );

	const fetchCampaignMetaData = useCallback( async ( campaignId ) => {
		const formData = new window.FormData();
		formData.append( 'action', 'wpsolvex_autoaiblogger_get_campaign_metadata' );
		formData.append( 'security', adminNonce );
		formData.append( 'campaign_id', campaignId );
		try {
			const data = await apiFetch( {
				url: ajaxUrl,
				method: 'POST',
				body: formData,
			} );
			return data?.success ? data.data.data : null;
		} catch ( e ) {
			return null;
		}
	}, [ ajaxUrl, adminNonce ] );

	const handleConfigure = useCallback( async ( campaign ) => {
		if ( ! campaign?.id ) {
			return;
		}
		const data = await fetchCampaignMetaData( campaign.id );
		if ( data ) {
			setConfigureData( { ...data, type: 'edit' } );
			setOpenDrawer( true );
		}
	}, [ fetchCampaignMetaData ] );

	const handleAddNew = useCallback( () => {
		setConfigureData( { ...postmetaDefaults, type: 'new' } );
		setOpenDrawer( true );
	}, [ postmetaDefaults ] );

	const handleAnalytics = useCallback( ( campaign ) => {
		setAnalyticsModal( { isOpen: true, campaignId: campaign.id, campaignData: campaign } );
	}, [] );

	const handleLogs = useCallback( ( campaign ) => {
		setLogsModal( { isOpen: true, campaignId: campaign.id, campaignData: campaign } );
	}, [] );

	const handleDelete = useCallback( ( campaign ) => {
		setDeleteModal( { isOpen: true, campaignId: campaign.id, campaignData: campaign } );
	}, [] );

	const handleViewPosts = useCallback( ( campaign ) => {
		const postType = campaign?.postType || 'post';
		const adminUrl = wpsolvex_autoaiblogger_localized_data?.admin_url || '/wp-admin/';
		const url = postType === 'post'
			? `${ adminUrl }edit.php?wpsolvex_autoaiblogger_campaign_id=${ campaign.id }`
			: `${ adminUrl }edit.php?post_type=${ postType }&wpsolvex_autoaiblogger_campaign_id=${ campaign.id }`;
		window.open( url, '_blank', 'noopener,noreferrer' );
	}, [] );

	const handleToggle = useCallback(
		async ( campaign ) => {
			if ( updatingStatus[ campaign.id ] ) {
				return;
			}
			const wasPaused = Boolean( campaign.isPaused );
			const action = wasPaused
				? 'wpsolvex_autoaiblogger_resume_campaign'
				: 'wpsolvex_autoaiblogger_pause_campaign';

			setUpdatingStatus( ( prev ) => ( { ...prev, [ campaign.id ]: true } ) );
			// Optimistic update.
			dispatch( {
				type: 'CAMPAIGNS_LIST_UPDATE_ITEM',
				payload: { id: campaign.id, changes: { isPaused: ! wasPaused } },
			} );

			try {
				const formData = new window.FormData();
				formData.append( 'action', action );
				formData.append( 'security', adminNonce );
				formData.append( 'campaign_id', campaign.id );
				const response = await apiFetch( {
					url: ajaxUrl,
					method: 'POST',
					body: formData,
				} );
				if ( ! response?.success ) {
					throw new Error( response?.data?.message || __( 'Failed to update campaign', 'solvex-ai-blogger' ) );
				}
				dispatch( {
					type: 'CAMPAIGNS_LIST_UPDATE_ITEM',
					payload: { id: campaign.id, changes: { isPaused: Boolean( response.data?.isPaused ) } },
				} );
			} catch ( e ) {
				// Roll back optimistic.
				dispatch( {
					type: 'CAMPAIGNS_LIST_UPDATE_ITEM',
					payload: { id: campaign.id, changes: { isPaused: wasPaused } },
				} );
				toast.error( e?.message || __( 'Failed to update campaign', 'solvex-ai-blogger' ) );
			} finally {
				setUpdatingStatus( ( prev ) => {
					const next = { ...prev };
					delete next[ campaign.id ];
					return next;
				} );
			}
		},
		[ updatingStatus, dispatch, ajaxUrl, adminNonce ]
	);

	const handleCampaignDeleted = useCallback( ( campaignId ) => {
		dispatch( { type: 'CAMPAIGNS_LIST_REMOVE_ITEM', payload: { id: campaignId } } );
		// Re-fetch to keep counts/pagination in sync.
		refetch();
	}, [ dispatch, refetch ] );

	const rows = useMemo( () => Object.values( campaignsList || {} ), [ campaignsList ] );
	const totalPages = pagination.totalPages || 1;
	const hasResults = rows.length > 0;
	const isEmpty = ! hasResults && ! loading;

	return (
		<div className="animate-reveal">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{ __( 'Manage Campaigns', 'solvex-ai-blogger' ) }
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Configure and monitor your automated content pipelines.', 'solvex-ai-blogger' ) }
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<select
						value={ statusFilter }
						onChange={ ( e ) => setStatusFilter( e.target.value ) }
						className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15"
					>
						{ STATUS_OPTIONS.map( ( opt ) => (
							<option key={ opt.value } value={ opt.value }>
								{ opt.label }
							</option>
						) ) }
					</select>
					<select
						value={ sortValue }
						onChange={ ( e ) => setSortValue( e.target.value ) }
						className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15"
						aria-label={ __( 'Sort campaigns', 'solvex-ai-blogger' ) }
					>
						{ SORT_OPTIONS.map( ( opt ) => (
							<option key={ opt.value } value={ opt.value }>
								{ opt.label }
							</option>
						) ) }
					</select>
					<div className="relative">
						<Search
							className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<input
							value={ search }
							onChange={ ( e ) => setSearch( e.target.value ) }
							placeholder={ __( 'Search campaigns…', 'solvex-ai-blogger' ) }
							className="h-9 w-64 rounded-md border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15"
						/>
					</div>
					<button
						type="button"
						onClick={ handleAddNew }
						className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
					>
						<Plus className="size-3.5" aria-hidden="true" />
						{ __( 'Add New', 'solvex-ai-blogger' ) }
					</button>
				</div>
			</header>

			{ error && (
				<div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
					{ error }
				</div>
			) }

			<div
				className="mt-8 overflow-hidden rounded-xl border border-border bg-card ring-1 ring-black/[0.02]"
				style={ { animationDelay: '100ms' } }
			>
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
								<th className="px-6 py-4">{ __( 'Name', 'solvex-ai-blogger' ) }</th>
								<th className="px-6 py-4">{ __( 'Status', 'solvex-ai-blogger' ) }</th>
								<th className="px-6 py-4">{ __( 'Results', 'solvex-ai-blogger' ) }</th>
								<th className="px-6 py-4">{ __( 'Latest Post', 'solvex-ai-blogger' ) }</th>
								<th className="px-6 py-4">{ __( 'Frequency', 'solvex-ai-blogger' ) }</th>
								<th className="px-6 py-4 text-right">{ __( 'Actions', 'solvex-ai-blogger' ) }</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{ loading && (
								<tr>
									<td colSpan={ 6 } className="px-6 py-10 text-center text-sm text-muted-foreground">
										{ __( 'Loading campaigns…', 'solvex-ai-blogger' ) }
									</td>
								</tr>
							) }
							{ ! loading && isEmpty && (
								<tr>
									<td colSpan={ 6 } className="px-6 py-12 text-center">
										<div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
											<Search className="size-8 text-muted-foreground/40" aria-hidden="true" />
											<p className="text-sm font-medium">
												{ debouncedSearch || statusFilter
													? __( 'No campaigns match your filters.', 'solvex-ai-blogger' )
													: __( 'No campaigns yet — create your first one.', 'solvex-ai-blogger' ) }
											</p>
											{ ( debouncedSearch || statusFilter ) && (
												<button
													type="button"
													onClick={ () => {
														setSearch( '' );
														setStatusFilter( '' );
													} }
													className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-brand/30"
												>
													{ __( 'Clear filters', 'solvex-ai-blogger' ) }
												</button>
											) }
										</div>
									</td>
								</tr>
							) }
							{ ! loading && hasResults && rows.map( ( campaign ) => {
								const state = deriveCampaignState( campaign );
								const isUpdating = updatingStatus[ campaign.id ];
								const switchDisabled = state === 'completed' || isUpdating;
								const lastPostTitle = campaign.last_post_title || __( 'Scheduled — No posts yet', 'solvex-ai-blogger' );
								return (
									<tr key={ campaign.id } className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-5 text-sm font-medium">
											<span className="line-clamp-1" title={ campaign.name }>
												{ campaign.name || __( 'Untitled Campaign', 'solvex-ai-blogger' ) }
											</span>
										</td>
										<td className="px-6 py-5">
											<Switch
												checked={ ! campaign.isPaused && state !== 'completed' }
												disabled={ switchDisabled }
												onCheckedChange={ () => handleToggle( campaign ) }
												aria-label={ sprintf(
													/* translators: %s: campaign name */
													__( 'Toggle %s', 'solvex-ai-blogger' ),
													campaign.name
												) }
											/>
										</td>
										<td className="px-6 py-5">
											<div className="flex flex-wrap gap-1.5">
												<Pill tone="success">
													{ __( 'Success', 'solvex-ai-blogger' ) }: { campaign.postsCreated || 0 }
												</Pill>
												{ Number( campaign.postsFailed ) > 0 && state === 'completed' && (
													<Pill tone="destructive">
														{ __( 'Undelivered', 'solvex-ai-blogger' ) }: { campaign.postsFailed }
													</Pill>
												) }
												<Pill tone="brand">
													{ __( 'Target', 'solvex-ai-blogger' ) }: { campaign.postsTarget || 0 }
												</Pill>
											</div>
										</td>
										<td className="px-6 py-5 text-sm text-muted-foreground">
											<span className="line-clamp-1" title={ lastPostTitle }>{ lastPostTitle }</span>
										</td>
										<td className="px-6 py-5 text-sm text-muted-foreground">
											<span className="line-clamp-1" title={ campaign.frequency }>{ campaign.frequency }</span>
										</td>
										<td className="px-6 py-5">
											<div className="flex items-center justify-end gap-0.5">
												<RowIcon
													icon={ CalendarPlus }
													label={ campaign.startDate ? sprintf(
														/* translators: %s: ISO datetime */
														__( 'Starts %s', 'solvex-ai-blogger' ),
														new Date( campaign.startDate ).toLocaleString()
													) : __( 'Start date not set', 'solvex-ai-blogger' ) }
												/>
												<RowIcon icon={ Info } label={ campaign.frequency } />
												<RowIcon
													icon={ List }
													label={ __( 'View posts', 'solvex-ai-blogger' ) }
													onClick={ () => handleViewPosts( campaign ) }
												/>
												<RowIcon
													icon={ Settings2 }
													label={ __( 'Configure', 'solvex-ai-blogger' ) }
													onClick={ () => handleConfigure( campaign ) }
												/>
												<RowIcon
													icon={ BarChart3 }
													label={ __( 'Analytics', 'solvex-ai-blogger' ) }
													onClick={ () => handleAnalytics( campaign ) }
												/>
												{ shouldShowDebugLogs && (
													<RowIcon
														icon={ ScrollText }
														label={ __( 'Logs', 'solvex-ai-blogger' ) }
														onClick={ () => handleLogs( campaign ) }
													/>
												) }
												<RowIcon
													icon={ Trash2 }
													label={ __( 'Delete', 'solvex-ai-blogger' ) }
													danger
													onClick={ () => handleDelete( campaign ) }
												/>
											</div>
										</td>
									</tr>
								);
							} ) }
						</tbody>
					</table>
				</div>
				{ totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-border px-6 py-3 text-sm">
						<span className="text-muted-foreground">
							{ sprintf(
								/* translators: 1: current page, 2: total pages, 3: total campaigns */
								__( 'Page %1$d of %2$d · %3$d campaigns', 'solvex-ai-blogger' ),
								pagination.page,
								totalPages,
								pagination.total
							) }
						</span>
						<div className="flex items-center gap-1">
							<button
								type="button"
								disabled={ page <= 1 || loading }
								onClick={ () => setPage( ( p ) => Math.max( 1, p - 1 ) ) }
								className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:border-brand/30 disabled:opacity-50"
							>
								<ChevronLeft className="size-3.5" aria-hidden="true" />
								{ __( 'Prev', 'solvex-ai-blogger' ) }
							</button>
							<button
								type="button"
								disabled={ page >= totalPages || loading }
								onClick={ () => setPage( ( p ) => Math.min( totalPages, p + 1 ) ) }
								className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:border-brand/30 disabled:opacity-50"
							>
								{ __( 'Next', 'solvex-ai-blogger' ) }
								<ChevronRight className="size-3.5" aria-hidden="true" />
							</button>
						</div>
					</div>
				) }
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
				onDeleted={ () => handleCampaignDeleted( deleteModal.campaignId ) }
			/>
		</div>
	);
}

Campaigns.displayName = 'Campaigns';

export default memo( Campaigns );
