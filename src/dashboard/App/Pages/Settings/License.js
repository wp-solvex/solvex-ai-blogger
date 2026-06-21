import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import apiFetch from '@wordpress/api-fetch';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Label } from '@Components/ui/label';
import { Button } from '@Components/ui/button';
import { Progress } from '@Components/ui/progress';
import { fetchAndStoreTokenData } from '@Utils/StoreConnect';
import { toast } from '@Utils/toast';
import { cn } from '@Utils/cn';
import useStoreConnect from '@DashboardApp/Hooks/useStoreConnect';

/**
 * Connected-state card — shows the connected account, plan and token balance,
 * with actions to switch accounts or disconnect.
 */
const ConnectedCard = memo( function ConnectedCard( {
	email,
	plan,
	tokenTotal,
	tokenRemaining,
	onSwitch,
	onDisconnect,
	isDisconnecting,
} ) {
	const pct =
		tokenTotal > 0
			? Math.max( 0, Math.min( 100, Math.round( ( tokenRemaining / tokenTotal ) * 100 ) ) )
			: 0;

	return (
		<div className="space-y-4 rounded-lg border border-success/30 bg-success/5 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
					<p className="truncate text-sm text-foreground">
						{ __( 'Connected as', 'solvex-ai-blogger' ) }{ ' ' }
						<strong>{ email || __( 'your account', 'solvex-ai-blogger' ) }</strong>
						{ plan ? ` — ${ plan }` : '' }
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					{ onSwitch && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={ onSwitch }
							className="text-brand hover:text-brand"
						>
							<RefreshCw className="size-3.5" aria-hidden="true" />
							{ __( 'Switch account', 'solvex-ai-blogger' ) }
						</Button>
					) }
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={ onDisconnect }
						disabled={ isDisconnecting }
						className="text-destructive hover:text-destructive"
					>
						{ isDisconnecting && (
							<Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
						) }
						{ __( 'Disconnect', 'solvex-ai-blogger' ) }
					</Button>
				</div>
			</div>

			{ tokenTotal > 0 && (
				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{ __( 'Tokens remaining', 'solvex-ai-blogger' ) }</span>
						<span>
							{ Number( tokenRemaining ).toLocaleString() } /{ ' ' }
							{ Number( tokenTotal ).toLocaleString() }
						</span>
					</div>
					<Progress value={ pct } aria-label={ __( 'Tokens remaining', 'solvex-ai-blogger' ) } />
				</div>
			) }
		</div>
	);
} );

ConnectedCard.displayName = 'ConnectedCard';

/**
 * Manual API-key form — kept as the fallback for users who already have a key,
 * and as the only path while Pro manages its own license.
 */
const ManualKeyForm = memo( function ManualKeyForm( {
	licenseKey,
	setLicenseKey,
	processing,
	tokenLoading,
	onActivate,
	noLicenseKeyUrl,
} ) {
	const busy = processing || tokenLoading;
	const handleKeyDown = useCallback(
		( e ) => {
			if ( e.key === 'Enter' && licenseKey.trim() && ! busy ) {
				e.preventDefault();
				onActivate();
			}
		},
		[ licenseKey, busy, onActivate ]
	);

	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<Label htmlFor="settings-license-key">
					{ __( 'License key', 'solvex-ai-blogger' ) }
				</Label>
				<div className="relative">
					<KeyRound
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<input
						id="settings-license-key"
						name="settings-license-key"
						type="text"
						value={ licenseKey }
						onChange={ ( e ) => setLicenseKey( e.target.value.trim() ) }
						onKeyDown={ handleKeyDown }
						placeholder={ __( 'Paste your license key', 'solvex-ai-blogger' ) }
						className={ cn(
							'flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 force-pl-9'
						) }
					/>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<a
					href={ noLicenseKeyUrl }
					target="_blank"
					rel="noopener noreferrer"
					className={ cn(
						'inline-flex items-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand-soft/40 px-3 py-2 text-xs font-medium text-brand no-underline transition-colors hover:bg-brand-soft/60'
					) }
				>
					<Gift className="size-3.5" aria-hidden="true" />
					{ __( "Don't have a key? Get free credits", 'solvex-ai-blogger' ) }
				</a>

				<Button
					type="button"
					variant="brand"
					onClick={ onActivate }
					disabled={ ! licenseKey.trim() || busy }
				>
					{ busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" /> }
					{ __( 'Activate', 'solvex-ai-blogger' ) }
				</Button>
			</div>

			{ tokenLoading && (
				<p className="text-xs text-muted-foreground">
					{ __( 'Fetching token data…', 'solvex-ai-blogger' ) }
				</p>
			) }
		</div>
	);
} );

ManualKeyForm.displayName = 'ManualKeyForm';

const SettingsLicense = memo( function SettingsLicense() {
	const dispatch = useDispatch();
	const abortRef = useRef( {} );

	// Redux selectors.
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const connectedEmail = useSelector( ( s ) => s.connectedEmail ) || '';
	const plan = useSelector( ( s ) => s.plan ) || '';
	const tokenTotal = useSelector( ( s ) => s.tokenTotal ) || 0;
	const tokenRemaining = useSelector( ( s ) => s.tokenRemaining ) || 0;
	const noLicenseKeyUrl = useSelector( ( s ) => s.noLicenseKeyUrl ) || '#';
	const licensingNonce = useSelector( ( s ) => s.licensingNonce ) || '';
	const ajaxUrl = useSelector( ( s ) => s.ajaxUrl ) || '';
	const proAvailable = useSelector( ( s ) => s.proAvailable ) || false;

	const { isConnecting, isDisconnecting, connect, switchAccount, disconnect } = useStoreConnect();

	// Local state for the manual fallback path.
	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ processing, setProcessing ] = useState( false );
	const [ tokenLoading, setTokenLoading ] = useState( false );
	const [ showManual, setShowManual ] = useState( false );

	const activated = useMemo( () => licenseStatus === 'licensed', [ licenseStatus ] );

	useEffect( () => {
		return () => {
			Object.values( abortRef.current ).forEach( ( ctrl ) => {
				if ( ctrl?.abort ) {
					ctrl.abort();
				}
			} );
		};
	}, [] );

	// Manual activation (fallback) — existing activate AJAX + token fetch.
	const activateLicense = useCallback( async () => {
		if ( ! licenseKey.trim() || processing ) {
			return;
		}
		setProcessing( true );
		const ctrl = new AbortController();
		abortRef.current.activate = ctrl;

		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_activate_license' );
			formData.append( 'license_key', licenseKey );
			formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', licensingNonce );

			const response = await apiFetch( {
				url: ajaxUrl,
				method: 'POST',
				body: formData,
				signal: ctrl.signal,
			} );
			if ( ! response?.success ) {
				throw new Error(
					response?.data?.message || __( 'License activation failed', 'solvex-ai-blogger' )
				);
			}

			dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'licensed' } );
			dispatch( { type: 'UPDATE_LICENSE', payload: licenseKey } );

			setTokenLoading( true );
			try {
				await fetchAndStoreTokenData( licenseKey, dispatch, ctrl.signal );
			} finally {
				setTokenLoading( false );
			}

			setLicenseKey( '' );
			setShowManual( false );
			toast.success( __( 'License activated', 'solvex-ai-blogger' ) );
		} catch ( error ) {
			if ( error?.name === 'AbortError' ) {
				return;
			}
			dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'unlicensed' } );
			toast.error( error?.message || __( 'License activation failed', 'solvex-ai-blogger' ) );
		} finally {
			setProcessing( false );
			delete abortRef.current.activate;
		}
	}, [ licenseKey, processing, licensingNonce, ajaxUrl, dispatch ] );

	return (
		<div className="space-y-8">
			<section>
				<header className="mb-5">
					<h2 className="text-xl font-semibold tracking-tight">
						{ __( 'License', 'solvex-ai-blogger' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ activated
							? __(
								'Your account is connected. Manage your connection and token balance below.',
								'solvex-ai-blogger'
							)
							: __(
								'Connect your free account to unlock campaigns and token-backed generations.',
								'solvex-ai-blogger'
							) }
					</p>
				</header>

				<div className="space-y-4 rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02]">
					{ activated ? (
						<ConnectedCard
							email={ connectedEmail }
							plan={ plan }
							tokenTotal={ tokenTotal }
							tokenRemaining={ tokenRemaining }
							onSwitch={ proAvailable ? undefined : switchAccount }
							onDisconnect={ disconnect }
							isDisconnecting={ isDisconnecting }
						/>
					) : proAvailable ? (
						// Pro is active — it manages its own license; manual key form only.
						<ManualKeyForm
							licenseKey={ licenseKey }
							setLicenseKey={ setLicenseKey }
							processing={ processing }
							tokenLoading={ tokenLoading }
							onActivate={ activateLicense }
							noLicenseKeyUrl={ noLicenseKeyUrl }
						/>
					) : (
						<div className="space-y-4">
							{ /* Primary action: one-click connect. */ }
							<Button
								type="button"
								variant="brand"
								size="lg"
								onClick={ () => connect() }
								disabled={ isConnecting }
								className="w-full"
							>
								{ isConnecting ? (
									<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								) : (
									<Link2 className="size-4" aria-hidden="true" />
								) }
								{ isConnecting
									? __( 'Connecting…', 'solvex-ai-blogger' )
									: __( 'Connect your free account', 'solvex-ai-blogger' ) }
							</Button>

							{ /* Secondary: collapsible manual key entry. */ }
							<button
								type="button"
								onClick={ () => setShowManual( ( v ) => ! v ) }
								className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
								aria-expanded={ showManual }
							>
								<ChevronDown
									className={ cn(
										'size-3.5 transition-transform',
										showManual && 'rotate-180'
									) }
									aria-hidden="true"
								/>
								{ __( 'Already have a key? Enter it manually', 'solvex-ai-blogger' ) }
							</button>

							{ showManual && (
								<div className="border-t border-border pt-4">
									<ManualKeyForm
										licenseKey={ licenseKey }
										setLicenseKey={ setLicenseKey }
										processing={ processing }
										tokenLoading={ tokenLoading }
										onActivate={ activateLicense }
										noLicenseKeyUrl={ noLicenseKeyUrl }
									/>
								</div>
							) }
						</div>
					) }
				</div>

				<div className="sr-only" aria-live="polite">
					{ activated
						? __( 'Connected', 'solvex-ai-blogger' )
						: __( 'Not connected', 'solvex-ai-blogger' ) }
				</div>
			</section>
		</div>
	);
} );

SettingsLicense.displayName = 'SettingsLicense';

export default SettingsLicense;
