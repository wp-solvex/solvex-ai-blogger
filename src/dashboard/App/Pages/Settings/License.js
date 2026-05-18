import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import apiFetch from '@wordpress/api-fetch';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import { Label } from '@Components/ui/label';
import { updateApiData } from '@Utils/ApiData';
import { toast } from '@Utils/toast';
import { cn } from '@Utils/cn';

const SettingsLicense = memo( function SettingsLicense() {
	const dispatch = useDispatch();
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const noLicenseKeyUrl = useSelector( ( s ) => s.noLicenseKeyUrl ) || '#';
	const licensingNonce = useSelector( ( s ) => s.licensingNonce ) || '';
	const ajaxUrl = useSelector( ( s ) => s.ajaxUrl ) || '';
	const activated = licenseStatus === 'licensed';

	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ processing, setProcessing ] = useState( false );
	const [ tokenLoading, setTokenLoading ] = useState( false );
	const abortRef = useRef( {} );

	useEffect( () => {
		return () => {
			Object.values( abortRef.current ).forEach( ( ctrl ) => {
				if ( ctrl?.abort ) {
					ctrl.abort();
				}
			} );
		};
	}, [] );

	const activate = useCallback( async () => {
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
				throw new Error( response?.data?.message || __( 'License activation failed', 'solvex-ai-blogger' ) );
			}

			dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'licensed' } );
			dispatch( { type: 'UPDATE_LICENSE', payload: licenseKey } );

			setTokenLoading( true );
			try {
				const tokenResponse = await fetch(
					`https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=${ encodeURIComponent( licenseKey ) }`,
					{ method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal }
				);
				if ( tokenResponse.ok ) {
					const tokenData = await tokenResponse.json();
					if ( tokenData?.success && tokenData?.data ) {
						dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: tokenData.data.total } );
						dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: tokenData.data.remaining } );
						await updateApiData( 'tokenTotal', tokenData.data.total, dispatch );
						await updateApiData( 'tokenRemaining', tokenData.data.remaining, dispatch );
					}
				}
			} catch ( e ) {
				console.warn( 'Token fetch after activation failed:', e );
			} finally {
				setTokenLoading( false );
			}

			setLicenseKey( '' );
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

	const deactivate = useCallback( async () => {
		if ( processing ) {
			return;
		}
		setProcessing( true );
		const ctrl = new AbortController();
		abortRef.current.deactivate = ctrl;
		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_deactivate_license' );
			formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', licensingNonce );

			const response = await apiFetch( {
				url: ajaxUrl,
				method: 'POST',
				body: formData,
				signal: ctrl.signal,
			} );

			if ( response?.success ) {
				dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'unlicensed' } );
				dispatch( { type: 'UPDATE_LICENSE', payload: '' } );
				setLicenseKey( '' );
				toast.success( response?.data?.message || __( 'License deactivated', 'solvex-ai-blogger' ) );
			} else {
				toast.error( response?.data?.message || __( 'License deactivation failed', 'solvex-ai-blogger' ) );
			}
		} catch ( error ) {
			if ( error?.name === 'AbortError' ) {
				return;
			}
			toast.error( error?.message || __( 'License deactivation failed', 'solvex-ai-blogger' ) );
		} finally {
			setProcessing( false );
			delete abortRef.current.deactivate;
		}
	}, [ processing, licensingNonce, ajaxUrl, dispatch ] );

	const onSubmit = ( e ) => {
		e.preventDefault();
		if ( activated ) {
			deactivate();
		} else {
			activate();
		}
	};

	return (
		<div className="space-y-8">
			<section>
				<header className="mb-5">
					<h2 className="text-xl font-semibold tracking-tight">
						{ __( 'License', 'solvex-ai-blogger' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Activate your license to unlock campaigns and token-backed generations.', 'solvex-ai-blogger' ) }
					</p>
				</header>

				<form
					onSubmit={ onSubmit }
					className="space-y-4 rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02]"
				>
					<div className="space-y-1.5">
						<Label htmlFor="settings-license-key">
							{ __( 'License key', 'solvex-ai-blogger' ) }
						</Label>
						<div className="relative mt-3">
							<KeyRound
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
								aria-hidden="true"
							/>
							<input
								id="settings-license-key"
								type="text"
								value={ activated ? '••••••••••••' : licenseKey }
								onChange={ ( e ) => setLicenseKey( e.target.value.trim() ) }
								disabled={ activated || processing }
								placeholder={ __( 'Paste your license key', 'solvex-ai-blogger' ) }
								className={ cn(
									'flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 force-pl-9'
								) }
							/>
							{ activated && (
								<CheckCircle2
									className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[oklch(0.55_0.16_155)]"
									aria-hidden="true"
								/>
							) }
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3">
						<a
							href={ noLicenseKeyUrl }
							target="_blank"
							rel="noopener noreferrer"
							className={ cn(
								'inline-flex items-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand-soft/40 px-3 py-2 text-xs font-medium text-brand no-underline transition-colors hover:bg-brand-soft/60',
								activated && 'opacity-50 pointer-events-none'
							) }
						>
							<Gift className="size-3.5" aria-hidden="true" />
							{ __( "Don't have a key? Get free credits", 'solvex-ai-blogger' ) }
						</a>

						<button
							type="submit"
							disabled={ processing || tokenLoading || ( ! activated && ! licenseKey.trim() ) }
							className={ cn(
								'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all',
								activated
									? 'border border-destructive/40 bg-card text-destructive hover:bg-destructive/5'
									: 'bg-brand text-white hover:brightness-110',
								( processing || tokenLoading || ( ! activated && ! licenseKey.trim() ) ) && 'opacity-60 cursor-not-allowed'
							) }
						>
							{ ( processing || tokenLoading ) && (
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
							) }
							{ activated
								? __( 'Deactivate', 'solvex-ai-blogger' )
								: __( 'Activate', 'solvex-ai-blogger' ) }
						</button>
					</div>

					{ tokenLoading && (
						<p className="text-xs text-muted-foreground">
							{ __( 'Fetching token data…', 'solvex-ai-blogger' ) }
						</p>
					) }
				</form>
			</section>
		</div>
	);
} );

SettingsLicense.displayName = 'SettingsLicense';

export default SettingsLicense;
