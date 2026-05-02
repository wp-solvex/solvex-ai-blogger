import React, { useState, useRef, useCallback, memo } from 'react';
import { __ } from '@wordpress/i18n';
import { ArrowRight, Key, CheckCircle2, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateApiData } from '@Utils/ApiData';
import DynamicCard from '@Components/DynamicCard';
import apiFetch from '@wordpress/api-fetch';

// Enhanced license input component
const LicenseInput = memo( ( { value, onChange, error, disabled, processing } ) => {
	const [ isFocused, setIsFocused ] = useState( false );

	const handleFocus = useCallback( () => setIsFocused( true ), [] );
	const handleBlur = useCallback( () => setIsFocused( false ), [] );

	return (
		<div className="space-y-2">
			<label
				htmlFor="wpsolvex-autoaiblogger-license"
				className="flex items-center text-[13px] font-semibold text-gray-900 relative"
			>
				<Key className="w-3.5 h-3.5 text-gray-600 mr-1.5" aria-hidden="true" />
				{ __( 'License Key', 'solvex-ai-blogger' ) }
				<span className="text-red-500 ml-[2px]" aria-label={ __( 'Required', 'solvex-ai-blogger' ) }>*</span>
			</label>

			<div className="relative">
				<input
					id="wpsolvex-autoaiblogger-license"
					type="text"
					value={ value }
					onChange={ ( e ) => onChange( e.target.value ) }
					onFocus={ handleFocus }
					onBlur={ handleBlur }
					disabled={ disabled }
					placeholder={ __( 'Enter your license key here…', 'solvex-ai-blogger' ) }
					className={ `
						w-full pl-3.5 pr-9 py-2.5 text-[13px] border rounded-lg transition-all duration-200
						${ error
			? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 bg-white focus:border-indigo-500 focus:ring-indigo-500'
		}
						${ isFocused ? 'shadow-md' : 'shadow-sm' }
						${ disabled ? 'bg-gray-100 cursor-not-allowed' : '' }
						focus:outline-none focus:ring-2 focus:ring-opacity-50
						placeholder:text-gray-400
					` }
					aria-describedby={ error ? 'license-error' : undefined }
					aria-invalid={ !! error }
				/>

				{ /* Status indicator */ }
				<div className="absolute right-2.5 top-2.5">
					{ processing ? (
						<Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" aria-hidden="true" />
					) : error ? (
						<AlertCircle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
					) : value && ! error ? (
						<CheckCircle2 className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
					) : null }
				</div>
			</div>

			{ error && (
				<p id="license-error" className="text-[11px] text-red-600 flex items-center gap-1 force-mt-1">
					<AlertCircle className="w-2.5 h-2.5" />
					{ error }
				</p>
			) }
		</div>
	);
} );

LicenseInput.displayName = 'LicenseInput';

// Enhanced submit button
const SubmitButton = memo( ( { onClick, disabled, loading, children } ) => {
	const handleClick = useCallback( ( e ) => {
		e.preventDefault();
		if ( ! disabled && ! loading ) {
			onClick();
		}
	}, [ onClick, disabled, loading ] );

	return (
		<button
			type="submit"
			onClick={ handleClick }
			disabled={ disabled || loading }
			className="
				group inline-flex items-center gap-2.5 px-7 py-3.5
				bg-gradient-to-r from-indigo-600 to-purple-600
				text-white font-semibold rounded-xl shadow-lg text-[13px]
				hover:from-indigo-700 hover:to-purple-700
				focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
				transform transition-all duration-200 hover:scale-105 hover:shadow-xl
				disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
			"
			aria-label={ __( 'Activate license and continue', 'solvex-ai-blogger' ) }
		>
			{ loading ? (
				<Loader2 className="w-4.5 h-4.5 animate-spin" aria-hidden="true" />
			) : (
				<span>{ children }</span>
			) }
			{ ! loading && (
				<ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
			) }
		</button>
	);
} );

SubmitButton.displayName = 'LicenseSubmitButton';

const LicenseStep = memo( () => {
	const abortControllerRef = useRef( {} );
	const dispatch = useDispatch();
	const navigate = useNavigate();

	// Redux state
	const reduxLicense = useSelector( ( state ) => state.license );
	const ajaxUrl = useSelector( ( state ) => state.ajaxUrl ) || '';
	const licensingNonce = useSelector( ( state ) => state.licensingNonce );
	const licenseStatusFromRedux = useSelector( ( state ) => state.licenseStatus );
	const noLicenseKeyUrl = useSelector( ( state ) => state.noLicenseKeyUrl ) || '#';

	// Component state
	const [ license, setLicense ] = useState( () => {
		// Ensure we always have a string value
		const initialLicense = reduxLicense || '';
		return typeof initialLicense === 'string' ? initialLicense : '';
	} );
	const [ licenseStatus, setLicenseStatus ] = useState( licenseStatusFromRedux );
	const [ processing, setProcessing ] = useState( false );
	const [ error, setError ] = useState( '' );

	// Enhanced token fetching in background
	const fetchTokenDataInBackground = useCallback( async ( licenseKey ) => {
		try {
			console.log( 'Fetching token data in background for license:', licenseKey.substring( 0, 8 ) + '...' );

			const tokenResponse = await fetch( `https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=${ licenseKey }`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
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

					// Show success notification
					dispatch( {
						type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
						payload: {
							message: __( 'License activated and token data updated successfully!', 'solvex-ai-blogger' ),
							type: 'success',
							duration: 4000,
						},
					} );
				} else {
					console.warn( 'Invalid token data response:', tokenData );
					dispatch( {
						type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
						payload: {
							message: __( 'License activated but failed to fetch token data', 'solvex-ai-blogger' ),
							type: 'warning',
							duration: 4000,
						},
					} );
				}
			} else {
				console.warn( 'Failed to fetch token data, status:', tokenResponse.status );
				dispatch( {
					type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
					payload: {
						message: __( 'License activated but token fetch failed', 'solvex-ai-blogger' ),
						type: 'warning',
						duration: 4000,
					},
				} );
			}
		} catch ( tokenError ) {
			console.error( 'Token data fetch error:', tokenError );
			dispatch( {
				type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
				payload: {
					message: __( 'License activated but token fetch failed', 'solvex-ai-blogger' ),
					type: 'warning',
					duration: 4000,
				},
			} );
		}
	}, [ dispatch ] );

	// Enhanced license activation
	const activateLicense = useCallback( async () => {
		// Ensure license is a string and not empty
		const licenseValue = typeof license === 'string' ? license.trim() : '';
		if ( ! licenseValue || processing ) {
			return false;
		}

		// Validate nonce is available
		if ( ! licensingNonce ) {
			console.error( 'LicenseStep: No licensing nonce available', { licensingNonce } );
			setError( __( 'Security verification failed. Please refresh the page and try again.', 'solvex-ai-blogger' ) );
			return false;
		}

		setProcessing( true );
		setError( '' );

		// Debug logging
		if ( process.env.NODE_ENV === 'development' ) {
			console.log( 'LicenseStep: Activating license', {
				licenseValue: licenseValue.substring( 0, 8 ) + '...',
				licensingNonce: licensingNonce.substring( 0, 8 ) + '...',
				ajaxUrl,
			} );
		}

		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_activate_license' );
			formData.append( 'license_key', licenseValue );
			formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', licensingNonce );

			const response = await apiFetch( {
				url: ajaxUrl,
				method: 'POST',
				body: formData,
				timeout: 30000,
			} );

			if ( response.success ) {
				// Update Redux state
				dispatch( {
					type: 'UPDATE_LICENSE_STATUS',
					payload: 'licensed',
				} );
				dispatch( { type: 'UPDATE_LICENSE', payload: licenseValue } );

				setLicenseStatus( 'licensed' );

				// Update API data
				await updateApiData( 'license', licenseValue, dispatch, abortControllerRef );

				// Fetch token data in background after successful activation
				fetchTokenDataInBackground( licenseValue );

				return true;
			}
			// Handle specific error types
			const errorMessage = response.data?.message || response.message || '';
			console.error( 'License activation failed:', response );

			if ( errorMessage.includes( 'nonce' ) || errorMessage.includes( 'security' ) ) {
				setError( __( 'Security verification failed. Please refresh the page and try again.', 'solvex-ai-blogger' ) );
			} else if ( errorMessage.includes( 'license' ) || errorMessage.includes( 'key' ) ) {
				setError( __( 'Invalid license key. Please check your license key and try again.', 'solvex-ai-blogger' ) );
			} else {
				setError( errorMessage || __( 'License activation failed. Please check your license key.', 'solvex-ai-blogger' ) );
			}
			return false;
		} catch ( failureError ) {
			console.error( 'License activation error:', failureError );
			setError( __( 'Connection failed. Please check your internet connection and try again.', 'solvex-ai-blogger' ) );
			return false;
		} finally {
			setProcessing( false );
		}
	}, [ license, processing, licensingNonce, dispatch, ajaxUrl ] );

	// Enhanced form submission
	const handleSubmit = useCallback( async () => {
		// Ensure license is a string and not empty
		const licenseValue = typeof license === 'string' ? license.trim() : '';
		if ( ! licenseValue ) {
			setError( __( 'License key is required.', 'solvex-ai-blogger' ) );
			return;
		}

		const success = await activateLicense();
		if ( success ) {
			// Scroll to top before navigating
			window.scrollTo( { top: 0, behavior: 'smooth' } );

			// Small delay for better UX
			setTimeout( () => {
				navigate( `?step=optin` );
			}, 1000 );
		}
	}, [ license, activateLicense, navigate ] );

	// Handle license input change
	const handleLicenseChange = useCallback( ( value ) => {
		// Ensure we always set a string value
		const stringValue = typeof value === 'string' ? value : '';
		setLicense( stringValue );
		if ( error ) {
			setError( '' );
		} // Clear error when user types
	}, [ error ] );

	// Button text logic
	const getButtonText = () => {
		if ( processing ) {
			return licenseStatus === 'licensed' ? __( 'Proceeding…', 'solvex-ai-blogger' ) : __( 'Activating…', 'solvex-ai-blogger' );
		}
		return __( 'Activate & Continue', 'solvex-ai-blogger' );
	};

	return (
		<main
			className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex justify-center p-5"
			role="main"
			aria-labelledby="license-heading"
		>
			<div className="w-full max-w-2xl">
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
					{ /* Header */ }
					<div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-center">
						<div className="mb-2.5">
							<span className="inline-flex items-center px-3.5 py-1.5 bg-white bg-opacity-20 text-white text-[13px] font-medium rounded-full tracking-wide uppercase">
								<Shield className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
								{ __( 'Step 3 of 5', 'solvex-ai-blogger' ) }
							</span>
						</div>
						<h1 id="license-heading" className="text-2xl md:text-[27px] font-bold text-white mb-3.5">
							{ __( 'Activate Your License', 'solvex-ai-blogger' ) }
						</h1>
						<p className="text-indigo-100 text-base mt-3.5">
							{ __( 'Connect your site to unlock AI-powered content generation with your license key.', 'solvex-ai-blogger' ) }
						</p>
					</div>

					{ /* Form */ }
					<div className="p-5 md:p-7">
						<form className="space-y-5" onSubmit={ ( e ) => {
							e.preventDefault(); handleSubmit();
						} }>
							<LicenseInput
								value={ license }
								onChange={ handleLicenseChange }
								error={ error }
								disabled={ processing }
								processing={ processing }
							/>

							<DynamicCard
								heading={ __( 'No License Key?', 'solvex-ai-blogger' ) }
								subHeading={ __( 'Get started with free credits today..', 'solvex-ai-blogger' ) }
								linkText={ __( 'Claim Free Credits', 'solvex-ai-blogger' ) }
								linkUrl={ noLicenseKeyUrl }
								colorScheme="brand"
								size="medium"
								ariaLabel={ __( 'Get free credits - opens in new tab', 'solvex-ai-blogger' ) }
							/>

							{ /* Success message */ }
							{ licenseStatus === 'licensed' && ! error && (
								<div className="p-3.5 bg-green-50 border border-green-200 rounded-lg">
									<div className="flex items-center gap-1.5">
										<CheckCircle2 className="w-4.5 h-4.5 text-green-600" aria-hidden="true" />
										<p className="text-green-800 font-medium text-[13px]">
											{ __( 'License activated successfully!', 'solvex-ai-blogger' ) }
										</p>
									</div>
								</div>
							) }

							{ /* Submit button */ }
							<div className="flex justify-center pt-5 m-0">
								<SubmitButton
									onClick={ handleSubmit }
									disabled={ ! ( typeof license === 'string' && license.trim() ) }
									loading={ processing }
								>
									{ getButtonText() }
								</SubmitButton>
							</div>
						</form>

						{ /* Additional info */ }
						<div className="mt-7 text-center">
							<p className="text-[13px] text-gray-600 leading-relaxed">
								{ __( 'Your license key connects your site to our AI services and allocates content generation tokens. ', 'solvex-ai-blogger' ) }
								<a
									href={ noLicenseKeyUrl }
									target="_blank"
									rel="noopener noreferrer"
									className="text-indigo-600 hover:text-indigo-700 underline"
								>
									{ __( 'Learn more about licensing', 'solvex-ai-blogger' ) }
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>

			{ /* Screen reader announcements */ }
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{ processing && __( 'Activating your license…', 'solvex-ai-blogger' ) }
				{ licenseStatus === 'licensed' && __( 'License activated successfully. Proceeding to next step.', 'solvex-ai-blogger' ) }
				{ error && __( 'License activation failed:', 'solvex-ai-blogger' ) + ` ${ error }` }
			</div>
		</main>
	);
} );

LicenseStep.displayName = 'WizardLicenseStep';

export default LicenseStep;
