import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { ArrowRight, AlertCircle, CheckCircle2, User, Globe, FileText, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateApiData } from '@Utils/ApiData';

// Enhanced form field component.
const FormField = memo( ( {
	id,
	label,
	type = 'text',
	value,
	onChange,
	error,
	placeholder,
	maxLength,
	rows,
	icon: Icon,
	required = false,
	description,
} ) => {
	const [ isFocused, setIsFocused ] = useState( false );
	const [ charCount, setCharCount ] = useState( value?.length || 0 );

	const handleChange = useCallback( ( e ) => {
		const newValue = e.target.value;
		onChange( newValue );
		setCharCount( newValue.length );
	}, [ onChange ] );

	const handleFocus = useCallback( () => setIsFocused( true ), [] );
	const handleBlur = useCallback( () => setIsFocused( false ), [] );

	const fieldClasses = `
		w-full pl-3.5 !pr-9 py-2.5 text-[13px] border rounded-lg transition-all duration-200
		${ error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 bg-white focus:border-purple-500 focus:ring-purple-500' }
		${ isFocused ? 'shadow-md' : 'shadow-sm' } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder:text-gray-400
	`;

	return (
		<div className="space-y-2">
			<label
				htmlFor={ id }
				className="flex items-center text-[13px] font-semibold text-gray-900 relative"
			>
				{ Icon && <Icon className="w-3.5 h-3.5 text-gray-600 mr-2" aria-hidden="true" /> }
				{ label }
				{ required && <span className="text-red-500 ml-[2px]" aria-label={ __( 'Required', 'solvex-ai-blogger' ) }>*</span> }
			</label>

			<div className="relative">
				{ type === 'textarea' ? (
					<textarea
						id={ id }
						value={ value }
						onChange={ handleChange }
						onFocus={ handleFocus }
						onBlur={ handleBlur }
						placeholder={ placeholder }
						maxLength={ maxLength }
						rows={ rows || 4 }
						className={ fieldClasses }
						aria-describedby={ error ? `${ id }-error` : undefined }
						aria-invalid={ !! error }
					/>
				) : (
					<input
						id={ id }
						type={ type }
						value={ value }
						onChange={ handleChange }
						onFocus={ handleFocus }
						onBlur={ handleBlur }
						placeholder={ placeholder }
						maxLength={ maxLength }
						className={ fieldClasses }
						aria-describedby={ error ? `${ id }-error` : undefined }
						aria-invalid={ !! error }
					/>
				) }

				{ /* Status indicator */ }
				<div className="absolute right-2.5 top-2.5">
					{ error ? (
						<AlertCircle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
					) : value && ! error ? (
						<CheckCircle2 className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
					) : null }
				</div>
			</div>

			{ /* Character count */ }
			{ maxLength && (
				<div className="flex justify-between items-center text-[11px]">
					{
						description && (
							<p className="text-gray-400">{ description }</p>
						)
					}
					<span className={ `${ charCount > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400' }` }>
						{ charCount }/{ maxLength }
					</span>
				</div>
			) }

			{ /* Error message without character count */ }
			{ error && ! maxLength && (
				<p id={ `${ id }-error` } className="text-[11px] text-red-600 flex items-center gap-1">
					<AlertCircle className="w-2.5 h-2.5" />
					{ error }
				</p>
			) }
		</div>
	);
} );

FormField.displayName = 'PersonaFormField';

// Enhanced submit button component
const SubmitButton = ( { onClick, loading, disabled, children } ) => {
	return (
		<button
			type="submit"
			onClick={ onClick }
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
			aria-label={ __( 'Continue to next step', 'solvex-ai-blogger' ) }
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
};

SubmitButton.displayName = 'PersonaSubmitButton';

const PersonaFormStep = memo( () => {
	const abortControllerRef = useRef( {} );
	const dispatch = useDispatch();
	const navigate = useNavigate();

	// Redux selectors - should be populated from localized data
	const reduxSiteTitle = useSelector( ( state ) => state?.siteTitle || '' );
	const reduxSiteFor = useSelector( ( state ) => state?.siteFor || '' );
	const reduxSiteDescription = useSelector( ( state ) => state?.siteDescription || '' );

	// Enhanced form state using Redux data directly
	const [ formData, setFormData ] = useState( {
		siteTitle: reduxSiteTitle,
		siteFor: reduxSiteFor,
		siteDescription: reduxSiteDescription,
	} );

	const [ errors, setErrors ] = useState( {} );
	const [ isSubmitting, setIsSubmitting ] = useState( false );

	// Sync form data with Redux state changes
	useEffect( () => {
		setFormData( ( prev ) => ( {
			...prev,
			siteTitle: reduxSiteTitle || prev.siteTitle,
			siteFor: reduxSiteFor || prev.siteFor,
			siteDescription: reduxSiteDescription || prev.siteDescription,
		} ) );
	}, [ reduxSiteTitle, reduxSiteFor, reduxSiteDescription ] );

	// Cleanup function for abort controllers
	useEffect( () => {
		return () => {
			// Cancel any pending API requests when component unmounts
			Object.values( abortControllerRef.current ).forEach( ( controller ) => {
				if ( controller && typeof controller.abort === 'function' ) {
					controller.abort();
				}
			} );
		};
	}, [] );

	// Enhanced validation with better error messages
	const validateForm = useCallback( () => {
		const newErrors = {};

		// Validate siteTitle (required)
		const trimmedTitle = formData.siteTitle?.trim() || '';
		if ( ! trimmedTitle ) {
			newErrors.siteTitle = __( 'Site title is required', 'solvex-ai-blogger' );
		} else if ( trimmedTitle.length < 3 ) {
			newErrors.siteTitle = __( 'Site title must be at least 3 characters', 'solvex-ai-blogger' );
		} else if ( trimmedTitle.length > 100 ) {
			newErrors.siteTitle = __( 'Site title must be less than 100 characters', 'solvex-ai-blogger' );
		}

		// Validate siteFor (required)
		const trimmedFor = formData.siteFor?.trim() || '';
		if ( ! trimmedFor ) {
			newErrors.siteFor = __( 'Site purpose is required', 'solvex-ai-blogger' );
		} else if ( trimmedFor.length < 3 ) {
			newErrors.siteFor = __( 'Site purpose must be at least 3 characters', 'solvex-ai-blogger' );
		} else if ( trimmedFor.length > 200 ) {
			newErrors.siteFor = __( 'Site purpose must be less than 200 characters', 'solvex-ai-blogger' );
		}

		// Validate siteDescription (required)
		const trimmedDescription = formData.siteDescription?.trim() || '';
		if ( ! trimmedDescription ) {
			newErrors.siteDescription = __( 'Site description is required', 'solvex-ai-blogger' );
		} else if ( trimmedDescription.length < 10 ) {
			newErrors.siteDescription = __( 'Site description must be at least 10 characters', 'solvex-ai-blogger' );
		} else if ( trimmedDescription.length > 1000 ) {
			newErrors.siteDescription = __( 'Site description must be less than 1000 characters', 'solvex-ai-blogger' );
		}

		setErrors( newErrors );
		return Object.keys( newErrors ).length === 0;
	}, [ formData ] );

	// Form field handlers with enhanced validation
	const handleFieldChange = useCallback( ( field ) => ( value ) => {
		// Sanitize input value
		const sanitizedValue = typeof value === 'string' ? value : String( value || '' );

		setFormData( ( prev ) => ( { ...prev, [ field ]: sanitizedValue } ) );

		// Clear error when user starts typing and provide real-time validation
		if ( errors[ field ] ) {
			setErrors( ( prev ) => ( { ...prev, [ field ]: '' } ) );
		}

		// Real-time validation for better UX
		if ( field === 'siteTitle' && sanitizedValue.trim() && sanitizedValue.length >= 3 ) {
			setErrors( ( prev ) => ( { ...prev, siteTitle: '' } ) );
		}
		if ( field === 'siteFor' && sanitizedValue.trim() && sanitizedValue.trim().length >= 3 && sanitizedValue.length <= 200 ) {
			setErrors( ( prev ) => ( { ...prev, siteFor: '' } ) );
		}
		if ( field === 'siteDescription' && sanitizedValue.trim() && sanitizedValue.trim().length >= 10 && sanitizedValue.length <= 1000 ) {
			setErrors( ( prev ) => ( { ...prev, siteDescription: '' } ) );
		}
	}, [ errors ] );

	// Enhanced form submission
	const handleSubmit = useCallback( async ( e ) => {
		e.preventDefault();

		if ( ! validateForm() ) {
			return;
		}

		setIsSubmitting( true );

		try {
			// Update Redux state with validation
			if ( formData.siteTitle?.trim() ) {
				dispatch( { type: 'UPDATE_SITE_TITLE', payload: formData.siteTitle.trim() } );
			}
			if ( formData.siteFor?.trim() ) {
				dispatch( { type: 'UPDATE_SITE_FOR', payload: formData.siteFor.trim() } );
			}
			if ( formData.siteDescription?.trim() ) {
				dispatch( { type: 'UPDATE_SITE_DESCRIPTION', payload: formData.siteDescription.trim() } );
			}

			// Save settings sequentially to avoid race conditions and database conflicts
			const settingsToSave = [];

			if ( formData.siteTitle?.trim() ) {
				settingsToSave.push( { key: 'siteTitle', value: formData.siteTitle.trim(), label: 'site title' } );
			}
			if ( formData.siteFor?.trim() ) {
				settingsToSave.push( { key: 'siteFor', value: formData.siteFor.trim(), label: 'site purpose' } );
			}
			if ( formData.siteDescription?.trim() ) {
				settingsToSave.push( { key: 'siteDescription', value: formData.siteDescription.trim(), label: 'site description' } );
			}

			const saveResults = [];
			const totalSettings = settingsToSave.length;
			let currentIndex = 0;

			for ( const { key, value, label } of settingsToSave ) {
				currentIndex++;

				try {
					// Optional: Show progress feedback (you can remove this if not needed)
					console.log( `Saving ${ label } (${ currentIndex } of ${ totalSettings })...` );

					const result = await updateApiData( key, value, dispatch, abortControllerRef );
					saveResults.push( { key, success: true, result } );
				} catch ( error ) {
					console.error( `Failed to save ${ label }:`, error );
					saveResults.push( { key, success: false, error } );
					throw new Error( `Failed to save ${ label }` );
				}
			}

			// Check if any settings failed to save
			const failedSettings = saveResults.filter( ( result ) => ! result.success );
			if ( failedSettings.length > 0 ) {
				const failedKeys = failedSettings.map( ( result ) => result.key ).join( ', ' );
				throw new Error( `Failed to save some settings: ${ failedKeys }` );
			}

			// Scroll to top before completing
			window.scrollTo( { top: 0, behavior: 'smooth' } );

			// Complete onboarding — set userOnboarded and redirect to dashboard
			dispatch( { type: 'UPDATE_USER_ONBOARDED', payload: true } );
			await updateApiData( 'userOnboarded', true, dispatch, abortControllerRef );
		} catch ( error ) {
			console.error( 'Form submission error:', error );
			setErrors( { submit: __( 'Failed to save your information. Please try again.', 'solvex-ai-blogger' ) } );
		} finally {
			setIsSubmitting( false );
		}
	}, [ formData, validateForm, dispatch, navigate ] );

	// Form completion percentage
	// Check if form is valid for button state (only siteTitle is required)
	const isFormValid = useMemo( () => {
		const trimmedTitle = formData.siteTitle?.trim() || '';
		const trimmedFor = formData.siteFor?.trim() || '';
		const trimmedDescription = formData.siteDescription?.trim() || '';
		return trimmedTitle.length >= 3 && trimmedTitle.length <= 100
			&& trimmedFor.length >= 3 && trimmedFor.length <= 200
			&& trimmedDescription.length >= 10 && trimmedDescription.length <= 1000;
	}, [ formData.siteTitle, formData.siteFor, formData.siteDescription ] );

	return (
		<main
			className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-5"
			role="main"
			aria-labelledby="persona-heading"
		>
			<div className="w-full max-w-2xl">
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
					{ /* Header */ }
					<div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-center">
						<div className="mb-2.5">
							<span className="inline-flex items-center px-3.5 py-1.5 bg-white bg-opacity-20 text-white text-[13px] font-medium rounded-full tracking-wide uppercase">
								<User className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
								{ __( 'Step 3 of 3', 'solvex-ai-blogger' ) }
							</span>
						</div>
						<h1 id="persona-heading" className="text-2xl md:text-[27px] font-bold text-white mb-3.5">
							{ __( 'Quick Configuration', 'solvex-ai-blogger' ) }
						</h1>

					</div>

					{ /* Form */ }
					<form className="p-5 md:p-7" onSubmit={ handleSubmit } noValidate>
						<div className="space-y-5">
							<FormField
								id="wpsolvex-autoaiblogger-site-title"
								label={ __( 'Site Title', 'solvex-ai-blogger' ) }
								value={ formData.siteTitle }
								onChange={ handleFieldChange( 'siteTitle' ) }
								error={ errors.siteTitle }
								placeholder={ __( 'e.g., Tech Insights Blog, Travel Adventures', 'solvex-ai-blogger' ) }
								maxLength={ 100 }
								icon={ Globe }
								required
								description={ __( 'The main title of your website or blog.', 'solvex-ai-blogger' ) }
							/>

							<FormField
								id="wpsolvex-autoaiblogger-site-for"
								label={ __( 'Site Purpose', 'solvex-ai-blogger' ) }
								value={ formData.siteFor }
								onChange={ handleFieldChange( 'siteFor' ) }
								error={ errors.siteFor }
								placeholder={ __( 'e.g., technology enthusiasts, travel lovers', 'solvex-ai-blogger' ) }
								maxLength={ 200 }
								icon={ User }
								required
								description={ __( 'Who is your target audience?', 'solvex-ai-blogger' ) }
							/>

							<FormField
								id="wpsolvex-autoaiblogger-site-description"
								label={ __( 'Detailed Description', 'solvex-ai-blogger' ) }
								type="textarea"
								value={ formData.siteDescription }
								onChange={ handleFieldChange( 'siteDescription' ) }
								error={ errors.siteDescription }
								placeholder={ __( 'Describe your site: topics, style, audience, goals…', 'solvex-ai-blogger' ) }
								maxLength={ 1000 }
								rows={ 6 }
								icon={ FileText }
								required
								description={ __( 'Help AI understand your content need.', 'solvex-ai-blogger' ) }
							/>
						</div>

						{ /* Submit error */ }
						{ errors.submit && (
							<div className="mt-3.5 p-2.5 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-red-700 text-[13px] flex items-center gap-1.5">
									<AlertCircle className="w-3.5 h-3.5" />
									{ errors.submit }
								</p>
							</div>
						) }

						{ /* Submit button */ }
						<div className="flex justify-center pt-5">
							<SubmitButton
								onClick={ handleSubmit }
								loading={ isSubmitting }
								disabled={ ! isFormValid }
							>
								{ isSubmitting ? __( 'Finishing Setup…', 'solvex-ai-blogger' ) : __( 'Finish Setup & Go to Dashboard', 'solvex-ai-blogger' ) }
							</SubmitButton>
						</div>
					</form>
				</div>

				{ /* Help text */ }
				<div className="text-center mt-3.5">
					<p className="text-[13px] text-gray-600">
						{ __( 'Just a few details to guide the AI. You can always change this later in Settings.', 'solvex-ai-blogger' ) }
					</p>
				</div>
			</div>

			{ /* Screen reader announcements */ }
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{ isSubmitting && __( 'Saving your site information…', 'solvex-ai-blogger' ) }
				{ Object.keys( errors ).length > 0 && __( 'Please fix the form errors before continuing.', 'solvex-ai-blogger' ) }
			</div>
		</main>
	);
} );

PersonaFormStep.displayName = 'WizardPersonaFormStep';

export default PersonaFormStep;
