import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelector } from 'react-redux';
import SettingsContainer from '@Components/SettingsContainer';
import SettingLabel from '@Components/SettingLabel';
import DynamicCard from '@Components/DynamicCard';
import { Key, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { updateApiData } from '@Utils/ApiData';

// Enhanced license activation form
const LicenseForm = memo( ( {
	licenseKey,
	setLicenseKey,
	activated,
	processing,
	tokenLoading,
	activationText,
	deactivationText,
	onActivate,
	onDeactivate,
	noLicenseKeyUrl,
} ) => {
	const handleKeyPress = useCallback( ( e ) => {
		if ( e.key === 'Enter' && ! activated && licenseKey.trim() && ! processing ) {
			e.preventDefault();
			onActivate();
		}
	}, [ activated, licenseKey, processing, onActivate ] );

	return (
		<div className="space-y-4">
			<SettingLabel
				forId="license-key"
				title={ __( 'License Key', 'solvex-ai-blogger' ) }
				description={ ! activated ? __( 'Enter your license key to unlock premium features', 'solvex-ai-blogger' ) : undefined }
			/>

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
						disabled={ activated }
						onChange={ ( e ) => setLicenseKey( e.target.value.trim() ) }
						onKeyPress={ handleKeyPress }
						placeholder={
							activated
								? __( 'License is active', 'solvex-ai-blogger' )
								: __( 'Enter your license key…', 'solvex-ai-blogger' )
						}
						className={ `
							block w-full !pl-12 !pr-12 py-2.5 text-sm
							border border-gray-300 rounded-lg
							bg-white text-gray-900
							placeholder:text-gray-400
							focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
							transition-colors duration-200
							${ activated ? 'bg-gray-50 text-gray-500' : '' }
							${ processing ? 'opacity-70' : '' }
						` }
						aria-describedby={ activated ? 'license-status' : 'license-help' }
					/>

					{ /* Status indicator */ }
					<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
						{ activated && (
							<CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
						) }
					</div>
				</div>

				{ activated && ! tokenLoading ? (
					<button
						type="button"
						onClick={ onDeactivate }
						disabled={ processing }
						className={ `
							inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
							bg-white !border-2 !border-red-500 rounded-lg
							text-red-700 hover:text-red-900 hover:bg-red-50
							focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
							transition-all duration-200
							${ processing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer' }
						` }
						style={ {
							border: '2px solid #ef4444',
							borderColor: '#ef4444 !important',
						} }
						aria-label={ __( 'Deactivate license', 'solvex-ai-blogger' ) }
					>
						{ processing && <Loader2 className="w-4 h-4 animate-spin" /> }
						{ deactivationText }
					</button>
				) : (
					<button
						type="button"
						onClick={ onActivate }
						disabled={ ! licenseKey.trim() || processing || tokenLoading }
						className={ `
							inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
							bg-brand text-white rounded-lg
							hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
							transition-all duration-200 transform hover:scale-105
							${ ( ! licenseKey.trim() || processing || tokenLoading ) ? 'opacity-70 cursor-not-allowed hover:scale-100' : 'cursor-pointer shadow-sm' }
							${ tokenLoading ? 'bg-green-600 hover:bg-green-700' : '' }
						` }
						aria-label={ __( 'Activate license', 'solvex-ai-blogger' ) }
					>
						{ ( processing || tokenLoading ) && <Loader2 className="w-4 h-4 animate-spin" style={ { outline: 'none' } } tabIndex="-1" /> }
						{ ! processing && ! tokenLoading && <Shield className="w-4 h-4" style={ { outline: 'none' } } tabIndex="-1" /> }
						{ activationText }
					</button>
				) }
			</div>

			{ ! activated &&
				<DynamicCard
					heading={ __( 'No License Key?', 'solvex-ai-blogger' ) }
					subHeading={ __( 'Get started with free credits today.', 'solvex-ai-blogger' ) }
					linkText={ __( 'Get Free Credits', 'solvex-ai-blogger' ) }
					linkUrl={ noLicenseKeyUrl }
					colorScheme="brand"
					size="medium"
					ariaLabel={ __( 'Get free credits - opens in new tab', 'solvex-ai-blogger' ) }
				/>
			}

			{ /* Token loading indicator */ }
			{ tokenLoading && (
				<div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
					<Loader2 className="w-5 h-5 animate-spin text-green-600" />
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium text-green-800">
							{ __( 'Fetching your token data…', 'solvex-ai-blogger' ) }
						</p>
						<p className="text-xs text-green-600">
							{ __( 'This may take a few seconds', 'solvex-ai-blogger' ) }
						</p>
					</div>
				</div>
			) }
		</div>
	);
} );

LicenseForm.displayName = 'LicenseForm';

// Main License component.
const License = memo( () => {
	const dispatch = useDispatch();
	const abortControllerRef = useRef( {} );

	// Redux selectors with fallbacks.
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';
	const noLicenseKeyUrl = useSelector( ( state ) => state.noLicenseKeyUrl ) || '#';
	const licensingNonce = useSelector( ( state ) => state.licensingNonce ) || '';
	const ajaxUrl = useSelector( ( state ) => state.ajaxUrl ) || '';

	// Local state
	const [ processing, setProcessing ] = useState( false );
	const [ tokenLoading, setTokenLoading ] = useState( false );
	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ activationText, setActivationText ] = useState( __( 'Activate', 'solvex-ai-blogger' ) );
	const [ deactivationText, setDeactivationText ] = useState( __( 'Deactivate', 'solvex-ai-blogger' ) );

	// Computed values
	const activated = useMemo( () => licenseStatus === 'licensed', [ licenseStatus ] );

	// Cleanup effect
	useEffect( () => {
		return () => {
			// Cancel any ongoing requests
			Object.values( abortControllerRef.current ).forEach( ( controller ) => {
				if ( controller && typeof controller.abort === 'function' ) {
					controller.abort();
				}
			} );
		};
	}, [] );

	// Enhanced license activation with better error handling
	const activateLicense = useCallback( async () => {
		if ( ! licenseKey.trim() || processing ) {
			return;
		}

		setActivationText( __( 'Activating…', 'solvex-ai-blogger' ) );
		setProcessing( true );

		// Create abort controller for this request
		const abortController = new AbortController();
		abortControllerRef.current.activation = abortController;

		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_activate_license' );
			formData.append( 'license_key', licenseKey );
			formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', licensingNonce );

			const response = await apiFetch( {
				url: ajaxUrl,
				method: 'POST',
				body: formData,
				signal: abortController.signal,
			} );

			if ( ! response.success ) {
				throw new Error( response?.data?.message || __( 'License activation failed', 'solvex-ai-blogger' ) );
			}

			// Update license status
			dispatch( {
				type: 'UPDATE_LICENSE_STATUS',
				payload: 'licensed',
			} );

			// Also update the license key in Redux for token fetching
			dispatch( {
				type: 'UPDATE_LICENSE',
				payload: licenseKey,
			} );

			console.log( 'License key set in Redux:', licenseKey );

			// Show token loading state
			setTokenLoading( true );

			// Fetch token data immediately after successful activation
			try {
				const tokenResponse = await fetch( `https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=${ licenseKey }`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					signal: abortController.signal,
				} );

				if ( tokenResponse.ok ) {
					const tokenData = await tokenResponse.json();

					if ( tokenData && tokenData.success && tokenData.data ) {
						// Update Redux store with token data
						dispatch( {
							type: 'UPDATE_TOKEN_TOTAL',
							payload: tokenData.data.total,
						} );
						dispatch( {
							type: 'UPDATE_TOKEN_REMAINING',
							payload: tokenData.data.remaining,
						} );

						// Update API data in database
						await updateApiData( 'tokenTotal', tokenData.data.total, dispatch, abortControllerRef );
						await updateApiData( 'tokenRemaining', tokenData.data.remaining, dispatch, abortControllerRef );

						console.log( 'Token data fetched and updated:', tokenData.data );
						setActivationText( __( 'License Activated & Tokens Updated!', 'solvex-ai-blogger' ) );
					}
				} else {
					console.warn( 'Failed to fetch token data after license activation' );
					setActivationText( __( 'License Activated (Token fetch failed)', 'solvex-ai-blogger' ) );
				}
			} catch ( tokenError ) {
				// Don't fail the license activation if token fetch fails
				console.warn( 'Token data fetch error after license activation:', tokenError );
				setActivationText( __( 'License Activated (Token fetch failed)', 'solvex-ai-blogger' ) );
			} finally {
				setTokenLoading( false );
			}

			setLicenseKey( '' );

			const notificationPayload = {
				message: __( 'License activated successfully!', 'solvex-ai-blogger' ),
				type: 'success',
				duration: 4000,
			};

			console.log( 'Dispatching notification:', notificationPayload );
			dispatch( {
				type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
				payload: notificationPayload,
			} );
		} catch ( error ) {
			if ( error.name === 'AbortError' ) {
				return;
			}

			console.error( 'License activation error:', error );

			setActivationText( __( 'Activate', 'solvex-ai-blogger' ) );
			dispatch( {
				type: 'UPDATE_LICENSE_STATUS',
				payload: 'unlicensed',
			} );
			dispatch( {
				type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
				payload: {
					message: error.message || __( 'Failed to activate license', 'solvex-ai-blogger' ),
					type: 'error',
					duration: 5000,
				},
			} );
		} finally {
			setProcessing( false );
			delete abortControllerRef.current.activation;
		}
	}, [ licenseKey, processing, dispatch ] );

	// Enhanced license deactivation
	const deactivateLicense = useCallback( async () => {
		if ( processing ) {
			return;
		}

		setDeactivationText( __( 'Deactivating…', 'solvex-ai-blogger' ) );
		setProcessing( true );

		// Create abort controller for this request
		const abortController = new AbortController();
		abortControllerRef.current.deactivation = abortController;

		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_deactivate_license' );
			formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', licensingNonce );

			const response = await apiFetch( {
				url: ajaxUrl,
				method: 'POST',
				body: formData,
				signal: abortController.signal,
			} );

			if ( response.success ) {
				setLicenseKey( '' );
				dispatch( {
					type: 'UPDATE_LICENSE_STATUS',
					payload: 'unlicensed',
				} );
				dispatch( {
					type: 'UPDATE_LICENSE',
					payload: '',
				} );

				setDeactivationText( __( 'Deactivated', 'solvex-ai-blogger' ) );
				setActivationText( __( 'Activate', 'solvex-ai-blogger' ) );
			}

			dispatch( {
				type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
				payload: {
					message: response?.data?.message || __( 'License deactivated', 'solvex-ai-blogger' ),
					type: 'success',
					duration: 3000,
				},
			} );
		} catch ( error ) {
			if ( error.name === 'AbortError' ) {
				return;
			}

			console.error( 'Deactivation error:', error );
			setDeactivationText( __( 'Deactivate', 'solvex-ai-blogger' ) );
		} finally {
			setProcessing( false );
			delete abortControllerRef.current.deactivation;
		}
	}, [ processing, dispatch ] );

	// Reset button states when activation status changes
	useEffect( () => {
		if ( activated && ! processing && ! tokenLoading ) {
			// Only show "Activated" and "Deactivate" when completely done
			setActivationText( __( 'Activated', 'solvex-ai-blogger' ) );
			setDeactivationText( __( 'Deactivate', 'solvex-ai-blogger' ) );
		} else if ( ! activated && ! processing ) {
			// Reset to initial state when not activated and not processing
			setActivationText( __( 'Activate', 'solvex-ai-blogger' ) );
			setDeactivationText( __( 'Deactivated', 'solvex-ai-blogger' ) );
		}
		// Don't change text during processing or token loading
	}, [ activated, processing, tokenLoading ] );

	return (
		<div className="space-y-6 min-h-full">
			{ /* Settings container */ }
			<SettingsContainer
				element={
					<LicenseForm
						licenseKey={ licenseKey }
						setLicenseKey={ setLicenseKey }
						activated={ activated }
						processing={ processing }
						tokenLoading={ tokenLoading }
						activationText={ activationText }
						deactivationText={ deactivationText }
						onActivate={ activateLicense }
						onDeactivate={ deactivateLicense }
						noLicenseKeyUrl={ noLicenseKeyUrl }
					/>
				}
				className="bg-white shadow-sm rounded-lg border border-gray-200"
			/>

			{ /* Screen reader status */ }
			<div className="sr-only" aria-live="polite">
				{ activated
					? __( 'License is active', 'solvex-ai-blogger' )
					: __( 'No active license', 'solvex-ai-blogger' )
				}
			</div>
		</div>
	);
} );

License.displayName = 'LicenseSettings';

export default License;
