import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelector } from 'react-redux';
import SettingsContainer from '@Components/SettingsContainer';
import SettingLabel from '@Components/SettingLabel';
import DynamicCard from '@Components/DynamicCard';
import { Key, Shield, CheckCircle2, Loader2, Link2, ChevronDown, RefreshCw } from 'lucide-react';
import { updateApiData } from '@Utils/ApiData';
import useStoreConnect from '@DashboardApp/Hooks/useStoreConnect';

/**
 * Connected-state card: shows the connected account, plan and token balance.
 */
const ConnectedCard = memo( ( { email, plan, tokenTotal, tokenRemaining, onSwitch, onDisconnect, isDisconnecting } ) => {
	const pct = tokenTotal > 0 ? Math.max( 0, Math.min( 100, Math.round( ( tokenRemaining / tokenTotal ) * 100 ) ) ) : 0;

	return (
		<div className="space-y-4">
			<div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2 min-w-0">
						<CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
						<p className="text-sm text-green-900 truncate">
							{ __( 'Connected as', 'solvex-ai-blogger' ) }{ ' ' }
							<strong>{ email || __( 'your account', 'solvex-ai-blogger' ) }</strong>
							{ plan ? ` — ${ plan }` : '' }
						</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{ onSwitch && (
							<button
								type="button"
								onClick={ onSwitch }
								className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
							>
								<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
								{ __( 'Switch Account', 'solvex-ai-blogger' ) }
							</button>
						) }
						<button
							type="button"
							onClick={ onDisconnect }
							disabled={ isDisconnecting }
							className={ `inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 ${ isDisconnecting ? 'opacity-60 cursor-not-allowed' : '' }` }
						>
							{ isDisconnecting && <Loader2 className="w-3.5 h-3.5 animate-spin" /> }
							{ __( 'Disconnect', 'solvex-ai-blogger' ) }
						</button>
					</div>
				</div>

				{ tokenTotal > 0 && (
					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs text-green-800">
							<span>{ __( 'Tokens remaining', 'solvex-ai-blogger' ) }</span>
							<span>{ Number( tokenRemaining ).toLocaleString() } / { Number( tokenTotal ).toLocaleString() }</span>
						</div>
						<div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
							<div className="h-full bg-green-500 rounded-full" style={ { width: `${ pct }%` } } />
						</div>
					</div>
				) }
			</div>
		</div>
	);
} );

ConnectedCard.displayName = 'ConnectedCard';

/**
 * Manual API-key form (kept as a fallback for users who already have a key).
 */
const ManualKeyForm = memo( ( { licenseKey, setLicenseKey, processing, tokenLoading, onActivate, noLicenseKeyUrl } ) => {
	const handleKeyPress = useCallback( ( e ) => {
		if ( e.key === 'Enter' && licenseKey.trim() && ! processing ) {
			e.preventDefault();
			onActivate();
		}
	}, [ licenseKey, processing, onActivate ] );

	return (
		<div className="space-y-4">
			<div className="flex gap-3">
				<div className="relative flex-1">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Key className="h-4 w-4 text-gray-400" aria-hidden="true" />
					</div>
					<input
						id="license-key"
						name="license-key"
						type="text"
						value={ licenseKey }
						onChange={ ( e ) => setLicenseKey( e.target.value.trim() ) }
						onKeyPress={ handleKeyPress }
						placeholder={ __( 'Enter your API key…', 'solvex-ai-blogger' ) }
						className="block w-full !pl-12 !pr-12 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
					/>
				</div>
				<button
					type="button"
					onClick={ onActivate }
					disabled={ ! licenseKey.trim() || processing || tokenLoading }
					className={ `inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all duration-200 ${ ( ! licenseKey.trim() || processing || tokenLoading ) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer shadow-sm' }` }
					aria-label={ __( 'Activate license', 'solvex-ai-blogger' ) }
				>
					{ ( processing || tokenLoading ) && <Loader2 className="w-4 h-4 animate-spin" /> }
					{ ! processing && ! tokenLoading && <Shield className="w-4 h-4" /> }
					{ __( 'Activate', 'solvex-ai-blogger' ) }
				</button>
			</div>

			<DynamicCard
				heading={ __( 'No API Key?', 'solvex-ai-blogger' ) }
				subHeading={ __( 'Create a free account to get your key.', 'solvex-ai-blogger' ) }
				linkText={ __( 'Get Free Credits', 'solvex-ai-blogger' ) }
				linkUrl={ noLicenseKeyUrl }
				colorScheme="brand"
				size="medium"
				ariaLabel={ __( 'Get free credits - opens in new tab', 'solvex-ai-blogger' ) }
			/>
		</div>
	);
} );

ManualKeyForm.displayName = 'ManualKeyForm';

// Main License / API Key settings component.
const License = memo( () => {
	const dispatch = useDispatch();
	const abortControllerRef = useRef( {} );

	// Redux selectors.
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';
	const connectedEmail = useSelector( ( state ) => state.connectedEmail ) || '';
	const plan = useSelector( ( state ) => state.plan ) || '';
	const tokenTotal = useSelector( ( state ) => state.tokenTotal ) || 0;
	const tokenRemaining = useSelector( ( state ) => state.tokenRemaining ) || 0;
	const noLicenseKeyUrl = useSelector( ( state ) => state.noLicenseKeyUrl ) || '#';
	const licensingNonce = useSelector( ( state ) => state.licensingNonce ) || '';
	const ajaxUrl = useSelector( ( state ) => state.ajaxUrl ) || '';
	const proAvailable = useSelector( ( state ) => state.proAvailable ) || false;

	const { isConnecting, isDisconnecting, connect, switchAccount, disconnect } = useStoreConnect();

	// Local state for the manual fallback.
	const [ processing, setProcessing ] = useState( false );
	const [ tokenLoading, setTokenLoading ] = useState( false );
	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ showManual, setShowManual ] = useState( false );

	const activated = useMemo( () => licenseStatus === 'licensed', [ licenseStatus ] );

	useEffect( () => {
		return () => {
			Object.values( abortControllerRef.current ).forEach( ( controller ) => {
				if ( controller && typeof controller.abort === 'function' ) {
					controller.abort();
				}
			} );
		};
	}, [] );

	// Manual activation (fallback path) — reuses the existing activate AJAX + token fetch.
	const activateLicense = useCallback( async () => {
		if ( ! licenseKey.trim() || processing ) {
			return;
		}
		setProcessing( true );
		const abortController = new AbortController();
		abortControllerRef.current.activation = abortController;

		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_activate_license' );
			formData.append( 'license_key', licenseKey );
			formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', licensingNonce );

			const response = await apiFetch( { url: ajaxUrl, method: 'POST', body: formData, signal: abortController.signal } );

			if ( ! response.success ) {
				throw new Error( response?.data?.message || __( 'License activation failed', 'solvex-ai-blogger' ) );
			}

			dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'licensed' } );
			dispatch( { type: 'UPDATE_LICENSE', payload: licenseKey } );

			setTokenLoading( true );
			try {
				const tokenResponse = await fetch( `https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=${ encodeURIComponent( licenseKey ) }`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
					signal: abortController.signal,
				} );
				if ( tokenResponse.ok ) {
					const tokenData = await tokenResponse.json();
					if ( tokenData?.success && tokenData.data ) {
						dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: tokenData.data.total } );
						dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: tokenData.data.remaining } );
						await updateApiData( 'tokenTotal', tokenData.data.total, dispatch, abortControllerRef );
						await updateApiData( 'tokenRemaining', tokenData.data.remaining, dispatch, abortControllerRef );
					}
				}
			} catch ( tokenError ) {
				// Non-fatal.
			} finally {
				setTokenLoading( false );
			}

			setLicenseKey( '' );
			dispatch( { type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION', payload: { message: __( 'Connected successfully!', 'solvex-ai-blogger' ), type: 'success', duration: 4000 } } );
		} catch ( error ) {
			if ( error.name === 'AbortError' ) {
				return;
			}
			dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'unlicensed' } );
			dispatch( { type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION', payload: { message: error.message || __( 'Failed to activate license', 'solvex-ai-blogger' ), type: 'error', duration: 5000 } } );
		} finally {
			setProcessing( false );
			delete abortControllerRef.current.activation;
		}
	}, [ licenseKey, processing, licensingNonce, ajaxUrl, dispatch ] );

	return (
		<div className="space-y-6 min-h-full">
			<SettingsContainer
				element={
					<div className="space-y-4">
						<SettingLabel
							forId="license-key"
							title={ __( 'API Key', 'solvex-ai-blogger' ) }
							description={ ! activated ? __( 'Connect your site to wpaiblogger.com to claim your free tokens.', 'solvex-ai-blogger' ) : undefined }
						/>

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
							// Pro is active — it manages its own license; show the manual key form only.
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
								<button
									type="button"
									onClick={ () => connect() }
									disabled={ isConnecting }
									className={ `w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ${ isConnecting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer' }` }
								>
									{ isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" /> }
									{ isConnecting ? __( 'Connecting…', 'solvex-ai-blogger' ) : __( 'Connect to wpaiblogger.com', 'solvex-ai-blogger' ) }
								</button>

								{ /* Secondary: manual key entry (collapsible fallback). */ }
								<button
									type="button"
									onClick={ () => setShowManual( ( v ) => ! v ) }
									className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
									aria-expanded={ showManual }
								>
									<ChevronDown className={ `w-3.5 h-3.5 transition-transform ${ showManual ? 'rotate-180' : '' }` } />
									{ __( 'Already have a key? Enter it manually', 'solvex-ai-blogger' ) }
								</button>

								{ showManual && (
									<ManualKeyForm
										licenseKey={ licenseKey }
										setLicenseKey={ setLicenseKey }
										processing={ processing }
										tokenLoading={ tokenLoading }
										onActivate={ activateLicense }
										noLicenseKeyUrl={ noLicenseKeyUrl }
									/>
								) }
							</div>
						) }
					</div>
				}
				className="bg-white shadow-sm rounded-lg border border-gray-200"
			/>

			<div className="sr-only" aria-live="polite">
				{ activated ? __( 'Connected', 'solvex-ai-blogger' ) : __( 'Not connected', 'solvex-ai-blogger' ) }
			</div>
		</div>
	);
} );

License.displayName = 'LicenseSettings';

export default License;
