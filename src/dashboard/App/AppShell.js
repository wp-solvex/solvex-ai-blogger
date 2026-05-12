/**
 * AppShell — top-level layout for the dashboard.
 *
 * Renders the sticky header (brand, nav tabs, token counter, version pill),
 * mounts the Sonner Toaster, wraps children in a Tooltip provider, and
 * applies the user's reduced-motion preference via data attribute.
 *
 * Icons import per-icon for tree-shaking:
 *   import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Toaster } from '@Components/ui/sonner';
import { TooltipProvider } from '@Components/ui/tooltip';
import { cn } from '@Utils/cn';
import { useReducedMotion } from '@Utils/useReducedMotion';
import { toast } from '@Utils/toast';
import { updateApiData } from '@Utils/ApiData';

function formatTokens( n ) {
	if ( ! n ) {
		return '0';
	}
	if ( n >= 1e6 ) {
		return ( n / 1e6 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'M';
	}
	if ( n >= 1e3 ) {
		return ( n / 1e3 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'K';
	}
	return new Intl.NumberFormat().format( n );
}

export function AppShell( { children } ) {
	const dispatch = useDispatch();
	const location = useLocation();
	const reducedMotion = useReducedMotion();

	const homeSlug = useSelector( ( s ) => s.homeSlug ) || 'solvex-ai-blogger';
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const license = useSelector( ( s ) => s.license ) || '';
	const tokenTotal = useSelector( ( s ) => s.tokenTotal ) || 0;
	const tokenRemaining = useSelector( ( s ) => s.tokenRemaining ) || 0;
	const version = useSelector( ( s ) => s.version ) || '1.0.0';

	const [ refreshing, setRefreshing ] = useState( false );
	const abortRef = useRef( {} );

	const activePath = useMemo( () => {
		const q = new URLSearchParams( location.search );
		return q.get( 'path' ) || '';
	}, [ location.search ] );

	const tabs = useMemo(
		() => [
			{ to: '', label: __( 'Welcome', 'solvex-ai-blogger' ) },
			{ to: 'campaigns', label: __( 'Campaigns', 'solvex-ai-blogger' ) },
			{ to: 'settings', label: __( 'Settings', 'solvex-ai-blogger' ) },
		],
		[]
	);

	const isLicensed = licenseStatus === 'licensed';
	const tokensUsed = isLicensed ? tokenTotal - tokenRemaining : 0;
	const tokenProgress = tokenTotal > 0 ? Math.min( ( ( tokenTotal - tokenRemaining ) / tokenTotal ) * 100, 100 ) : 0;

	const refreshTokens = useCallback( async () => {
		if ( ! isLicensed || refreshing || ! license ) {
			return;
		}
		setRefreshing( true );
		try {
			const res = await fetch(
				`https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=${ encodeURIComponent( license ) }`,
				{ method: 'GET', headers: { 'Content-Type': 'application/json' } }
			);
			if ( ! res.ok ) {
				throw new Error( `HTTP ${ res.status }` );
			}
			const data = await res.json();
			if ( ! data?.success || ! data?.data ) {
				throw new Error( 'Invalid response' );
			}
			dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: data.data.total } );
			dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: data.data.remaining } );
			await updateApiData( 'tokenTotal', data.data.total, dispatch, abortRef );
			await updateApiData( 'tokenRemaining', data.data.remaining, dispatch, abortRef );
			toast.success( __( 'Tokens refreshed', 'solvex-ai-blogger' ) );
		} catch ( e ) {
			toast.error( __( 'Failed to refresh tokens', 'solvex-ai-blogger' ) );
		} finally {
			setRefreshing( false );
		}
	}, [ isLicensed, refreshing, license, dispatch ] );

	return (
		<div
			data-reduce-motion={ reducedMotion ? 'true' : 'false' }
			className="min-h-screen bg-background text-foreground"
		>
			<TooltipProvider delayDuration={ 200 }>
				<header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
					<div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-10">
						<div className="flex items-center gap-10">
							<Link
								to={ { search: `?page=${ homeSlug }` } }
								className="flex items-center gap-2.5 text-foreground no-underline hover:text-foreground"
								aria-label={ __( 'Solvex AI Blogger — go to welcome', 'solvex-ai-blogger' ) }
							>
								<div className="flex size-7 items-center justify-center rounded-md bg-brand">
									<Sparkles className="size-3.5 text-white" strokeWidth={ 2.5 } aria-hidden="true" />
								</div>
								<span className="text-[15px] font-semibold tracking-tight text-foreground">
									{ __( 'Solvex AI Blogger', 'solvex-ai-blogger' ) }
								</span>
							</Link>
							<nav
								className="flex items-center gap-1"
								aria-label={ __( 'Primary', 'solvex-ai-blogger' ) }
							>
								{ tabs.map( ( tab ) => {
									const isActive =
										tab.to === ''
											? activePath === '' || activePath === 'getting-started'
											: activePath === tab.to || activePath.startsWith( tab.to + '/' );
									return (
										<Link
											key={ tab.to || 'home' }
											to={ {
												search: `?page=${ homeSlug }${ tab.to ? '&path=' + tab.to : '' }`,
											} }
											className={ cn(
												'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
												isActive
													? 'bg-brand/10 text-brand'
													: 'text-muted-foreground hover:text-foreground'
											) }
											aria-current={ isActive ? 'page' : undefined }
										>
											{ tab.label }
										</Link>
									);
								} ) }
							</nav>
						</div>

						<div className="flex items-center gap-5">
							<div className="hidden flex-col items-end gap-1.5 sm:flex">
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										{ __( 'Tokens', 'solvex-ai-blogger' ) }
									</span>
									<span className="font-mono text-[11px] font-medium tabular-nums">
										{ isLicensed
											? `${ formatTokens( tokensUsed ) } / ${ formatTokens( tokenTotal ) }`
											: '— / —' }
									</span>
									<button
										onClick={ refreshTokens }
										disabled={ refreshing || ! isLicensed }
										type="button"
										className="text-muted-foreground transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
										aria-label={ __( 'Refresh tokens', 'solvex-ai-blogger' ) }
										title={ isLicensed
											? __( 'Refresh tokens', 'solvex-ai-blogger' )
											: __( 'Activate your license to use tokens', 'solvex-ai-blogger' ) }
									>
										<RefreshCw
											className={ cn( 'size-3', refreshing && 'animate-spin' ) }
											aria-hidden="true"
										/>
									</button>
								</div>
								<div className="h-1 w-36 overflow-hidden rounded-full bg-border">
									<div
										className="h-full bg-brand transition-all"
										style={ { width: `${ isLicensed ? tokenProgress : 0 }%` } }
										role="progressbar"
										aria-valuemin={ 0 }
										aria-valuemax={ 100 }
										aria-valuenow={ Math.round( isLicensed ? tokenProgress : 0 ) }
									/>
								</div>
							</div>
							<div className="hidden h-8 w-px bg-border sm:block" />
							<span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
								v{ version }
							</span>
						</div>
					</div>
				</header>
				<main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10">{ children }</main>
				<Toaster position="bottom-right" />
			</TooltipProvider>
		</div>
	);
}

export default AppShell;
