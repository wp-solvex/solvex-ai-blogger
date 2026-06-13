import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { __ } from '@wordpress/i18n';
import { ArrowRight, Key, CheckCircle2, AlertCircle, Link2, Loader2, Gift } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateApiData } from '@Utils/ApiData';
import apiFetch from '@wordpress/api-fetch';
import useStoreConnect from '@DashboardApp/Hooks/useStoreConnect';
import { fetchAndStoreTokenData } from '@Utils/StoreConnect';

// API Key input component
const ApiKeyInput = memo( ( { value, onChange, error, disabled, processing } ) => {
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
				{ __( 'API Connection Key', 'solvex-ai-blogger' ) }
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
					autoComplete="off"
					placeholder={ __( 'Paste your API connection key here…', 'solvex-ai-blogger' ) }
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

ApiKeyInput.displayName = 'ApiKeyInput';

const LicenseStep = memo( () => {
	const abortControllerRef = useRef( {} );
	const dispatch = useDispatch();
	const navigate = useNavigate();

	// Redux state
	const reduxLicense = useSelector( ( state ) => state.license );
	const ajaxUrl = useSelector( ( state ) => state.ajaxUrl ) || '';
	const licensingNonce = useSelector( ( state ) => state.licensingNonce );
	const licenseStatusFromRedux = useSelector( ( state ) => state.license_status );
	const noLicenseKeyUrl = useSelector( ( state ) => state.noLicenseKeyUrl ) || 'https://wpaiblogger.com/register/';

	// Component state
	const [ license, setLicense ] = useState( () => {
		const initialLicense = reduxLicense || '';
		return typeof initialLicense === 'string' ? initialLicense : '';
	} );
	const [ licenseStatus, setLicenseStatus ] = useState( licenseStatusFromRedux );
	const [ processing, setProcessing ] = useState( false );
	const [ error, setError ] = useState( '' );

	// One-click connect.
	const { isConnecting, connect } = useStoreConnect();
	const [ connectInitiated, setConnectInitiated ] = useState( false );

	const handleConnect = useCallback( () => {
		setConnectInitiated( true );
		connect();
	}, [ connect ] );

	// When the connect popup completes, advance to the next onboarding step.
	useEffect( () => {
		if ( connectInitiated && licenseStatusFromRedux === 'licensed' ) {
			window.scrollTo( { top: 0, behavior: 'smooth' } );
			const timer = setTimeout( () => navigate( '?step=persona-form' ), 1200 );
			return () => clearTimeout( timer );
		}
	}, [ connectInitiated, licenseStatusFromRedux, navigate ] );

	// Token fetching in background (shared with the Settings activation path).
	const fetchTokenDataInBackground = useCallback( async ( licenseKey ) => {
		const ok = await fetchAndStoreTokenData( licenseKey, dispatch );
		dispatch( {
			type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
			payload: ok
				? { message: __( 'Connected successfully! Token data updated.', 'solvex-ai-blogger' ), type: 'success', duration: 4000 }
				: { message: __( 'Connected but token fetch failed', 'solvex-ai-blogger' ), type: 'warning', duration: 4000 },
		} );
	}, [ dispatch ] );

	// License activation
	const activateLicense = useCallback( async () => {
		const licenseValue = typeof license === 'string' ? license.trim() : '';
		if ( ! licenseValue || processing ) {
			return false;
		}

		if ( ! licensingNonce ) {
			setError( __( 'Security verification failed. Please refresh the page and try again.', 'solvex-ai-blogger' ) );
			return false;
		}

		setProcessing( true );
		setError( '' );

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
				dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'licensed' } );
				dispatch( { type: 'UPDATE_LICENSE', payload: licenseValue } );
				setLicenseStatus( 'licensed' );
				await updateApiData( 'license', licenseValue, dispatch, abortControllerRef );
				fetchTokenDataInBackground( licenseValue );
				return true;
			}

			const errorMessage = response.data?.message || response.message || '';
			if ( errorMessage.includes( 'nonce' ) || errorMessage.includes( 'security' ) ) {
				setError( __( 'Security verification failed. Please refresh the page and try again.', 'solvex-ai-blogger' ) );
			} else if ( errorMessage.includes( 'license' ) || errorMessage.includes( 'key' ) ) {
				setError( __( 'Invalid API key. Please check your key and try again.', 'solvex-ai-blogger' ) );
			} else {
				setError( errorMessage || __( 'Connection failed. Please check your API key.', 'solvex-ai-blogger' ) );
			}
			return false;
		} catch ( failureError ) {
			console.error( 'Connection error:', failureError );
			setError( __( 'Connection failed. Please check your internet connection and try again.', 'solvex-ai-blogger' ) );
			return false;
		} finally {
			setProcessing( false );
		}
	}, [ license, processing, licensingNonce, dispatch, ajaxUrl ] );

	// Form submission
	const handleSubmit = useCallback( async () => {
		const licenseValue = typeof license === 'string' ? license.trim() : '';
		if ( ! licenseValue ) {
			setError( __( 'API connection key is required.', 'solvex-ai-blogger' ) );
			return;
		}

		const success = await activateLicense();
		if ( success ) {
			window.scrollTo( { top: 0, behavior: 'smooth' } );
			setTimeout( () => {
				navigate( `?step=persona-form` );
			}, 1000 );
		}
	}, [ license, activateLicense, navigate ] );

	// Handle input change
	const handleLicenseChange = useCallback( ( value ) => {
		const stringValue = typeof value === 'string' ? value : '';
		setLicense( stringValue );
		if ( error ) {
			setError( '' );
		}
	}, [ error ] );

	return (
		<main
			className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex justify-center p-5"
			role="main"
			aria-labelledby="license-heading"
		>
			<div className="w-full max-w-4xl">
				{ /* Header */ }
				<div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-center rounded-t-2xl">
					<div className="mb-2.5">
						<span className="inline-flex items-center px-3.5 py-1.5 bg-white bg-opacity-20 text-white text-[13px] font-medium rounded-full tracking-wide uppercase">
							<Link2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
							{ __( 'Step 2 of 3', 'solvex-ai-blogger' ) }
						</span>
					</div>
					<h1 id="license-heading" className="text-2xl md:text-[27px] font-bold text-white mb-3.5">
						{ __( 'Connect Your Account', 'solvex-ai-blogger' ) }
					</h1>
					<p className="text-indigo-100 text-base mt-3.5">
						{ __( 'Link your site to access your free tokens and AI models.', 'solvex-ai-blogger' ) }
					</p>
				</div>

				{ /* Two-column layout */ }
				<div className="bg-white rounded-b-2xl shadow-xl border border-gray-200 border-t-0 overflow-hidden">
					<div className="p-5 md:p-7">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">

							{ /* Left Column — New Users (Primary Path) */ }
							<div className="p-6 bg-gradient-to-br from-brand-50 to-indigo-50 border-2 border-brand-200 rounded-xl flex flex-col items-center text-center">
								<div className="p-3 bg-brand-100 rounded-full mb-4">
									<Gift className="w-8 h-8 text-brand-600" aria-hidden="true" />
								</div>
								<h2 className="text-lg font-bold text-gray-900 mb-2">
									{ __( 'New here?', 'solvex-ai-blogger' ) }
								</h2>
								<p className="text-[13px] text-gray-600 mb-6 mt-0 leading-relaxed">
									{ __( 'Connect in one click — we create your free account and set up your 240,000 monthly free tokens automatically. No key to copy.', 'solvex-ai-blogger' ) }
								</p>
								<button
									type="button"
									onClick={ handleConnect }
									disabled={ isConnecting }
									className="
										group w-full inline-flex items-center justify-center gap-2.5 px-7 py-3
										bg-gradient-to-r from-indigo-600 to-purple-600
										!text-white font-semibold rounded-xl shadow-lg text-[13px]
										hover:from-indigo-700 hover:to-purple-700 hover:!text-white
										focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
										transform transition-all duration-200 hover:scale-105 hover:shadow-xl
										disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none my-[10px]
									"
									aria-label={ __( 'Connect to wpaiblogger.com', 'solvex-ai-blogger' ) }
								>
									{ isConnecting ? (
										<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
									) : (
										<>
											<span>{ __( 'Connect to wpaiblogger.com', 'solvex-ai-blogger' ) }</span>
											<Link2 className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
										</>
									) }
								</button>
								<p className="text-[11px] text-gray-500 mt-3">
									{ __( 'Free forever • No credit card •', 'solvex-ai-blogger' ) }{ ' ' }
									<a href={ noLicenseKeyUrl } target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
										{ __( 'register manually', 'solvex-ai-blogger' ) }
									</a>
								</p>
							</div>

							{ /* Right Column — Existing Users */ }
							<div className="p-6 bg-gray-50 border border-gray-200 rounded-xl flex flex-col">
								<div className="flex items-center gap-2 mb-4">
									<Key className="w-5 h-5 text-gray-600" aria-hidden="true" />
									<h2 className="text-lg font-bold text-gray-900">
										{ __( 'Already have a key?', 'solvex-ai-blogger' ) }
									</h2>
								</div>
								<p className="text-[13px] text-gray-600 mb-5">
									{ __( 'Paste your API connection key below to connect your site.', 'solvex-ai-blogger' ) }
								</p>

								<form className="space-y-4 flex-1 flex flex-col" onSubmit={ ( e ) => {
									e.preventDefault(); handleSubmit();
								} }>
									<ApiKeyInput
										value={ license }
										onChange={ handleLicenseChange }
										error={ error }
										disabled={ processing }
										processing={ processing }
									/>

									{ /* Success message */ }
									{ licenseStatus === 'licensed' && ! error && (
										<div className="p-3.5 bg-green-50 border border-green-200 rounded-lg">
											<div className="flex items-center gap-1.5">
												<CheckCircle2 className="w-4.5 h-4.5 text-green-600" aria-hidden="true" />
												<p className="text-green-800 font-medium text-[13px]">
													{ __( 'Connected successfully!', 'solvex-ai-blogger' ) }
												</p>
											</div>
										</div>
									) }

									<div className="mt-auto pt-2">
										<button
											type="submit"
											onClick={ ( e ) => { e.preventDefault(); handleSubmit(); } }
											disabled={ ! ( typeof license === 'string' && license.trim() ) || processing }
											className="
												group w-full inline-flex items-center justify-center gap-2.5 px-7 py-3
												bg-gradient-to-r from-indigo-600 to-purple-600
												text-white font-semibold rounded-xl shadow-lg text-[13px]
												hover:from-indigo-700 hover:to-purple-700
												focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
												transform transition-all duration-200 hover:scale-105 hover:shadow-xl
												disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
											"
											aria-label={ __( 'Connect your site', 'solvex-ai-blogger' ) }
										>
											{ processing ? (
												<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
											) : (
												<>
													<span>{ processing ? __( 'Connecting…', 'solvex-ai-blogger' ) : __( 'Connect Site', 'solvex-ai-blogger' ) }</span>
													<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
												</>
											) }
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>

			{ /* Screen reader announcements */ }
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{ processing && __( 'Connecting your site…', 'solvex-ai-blogger' ) }
				{ licenseStatus === 'licensed' && __( 'Site connected successfully. Proceeding to next step.', 'solvex-ai-blogger' ) }
				{ error && __( 'Connection failed:', 'solvex-ai-blogger' ) + ` ${ error }` }
			</div>
		</main>
	);
} );

LicenseStep.displayName = 'WizardLicenseStep';

export default LicenseStep;
