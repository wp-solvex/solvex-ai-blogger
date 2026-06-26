import React, { useState, useCallback, memo } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import SettingField from '@Components/SettingField';
import SettingLabel from '@Components/SettingLabel';
import SettingInput from '@Components/SettingInput';
import InfoCard from '@Components/InfoCard';

// Enhanced main component
const Persona = memo( () => {
	const dispatch = useDispatch();
	const [ errors, setErrors ] = useState( {} );

	// Redux selectors - values are already initialized from menu.php through Redux store
	const siteTitle = useSelector( ( state ) => state.siteTitle );
	const siteFor = useSelector( ( state ) => state.siteFor );
	const siteDescription = useSelector( ( state ) => state.siteDescription );

	// Enhanced validation with better UX
	const validateSiteTitle = useCallback( ( value ) => {
		const trimmedValue = value.trim();
		if ( ! trimmedValue ) {
			setErrors( ( prev ) => ( { ...prev, siteTitle: __( 'Site title is required', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		if ( trimmedValue.length > 100 ) {
			setErrors( ( prev ) => ( { ...prev, siteTitle: __( 'Site title must be 100 characters or less', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		setErrors( ( prev ) => ( { ...prev, siteTitle: null } ) );
		return true;
	}, [] );

	const validateSiteFor = useCallback( ( value ) => {
		const trimmedValue = value.trim();
		if ( ! trimmedValue ) {
			setErrors( ( prev ) => ( { ...prev, siteFor: __( 'Site for is required', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		if ( trimmedValue.length < 10 ) {
			setErrors( ( prev ) => ( { ...prev, siteFor: __( 'Please provide a more detailed description (at least 10 characters)', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		if ( trimmedValue.length > 200 ) {
			setErrors( ( prev ) => ( { ...prev, siteFor: __( 'Description must be 200 characters or less', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		setErrors( ( prev ) => ( { ...prev, siteFor: null } ) );
		return true;
	}, [] );

	const validateSiteDescription = useCallback( ( value ) => {
		const trimmedValue = value.trim();
		if ( ! trimmedValue ) {
			setErrors( ( prev ) => ( { ...prev, siteDescription: __( 'Detailed site information is required', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		if ( trimmedValue.length < 20 ) {
			setErrors( ( prev ) => ( { ...prev, siteDescription: __( 'Please provide more detailed information (at least 20 characters)', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		if ( trimmedValue.length > 500 ) {
			setErrors( ( prev ) => ( { ...prev, siteDescription: __( 'Description must be 500 characters or less', 'solvex-ai-blogger' ) } ) );
			return false;
		}
		setErrors( ( prev ) => ( { ...prev, siteDescription: null } ) );
		return true;
	}, [] );

	// Optimized handlers - only update Redux state, let ContentHeader handle persistence.
	const handleSiteTitleChange = useCallback( ( e ) => {
		const value = e.target.value;
		dispatch( { type: 'UPDATE_SITE_TITLE', payload: value } );
		// Immediate validation for better UX.
		validateSiteTitle( value );
	}, [ dispatch, validateSiteTitle ] );

	const handleSiteForChange = useCallback( ( e ) => {
		const value = e.target.value;
		dispatch( { type: 'UPDATE_SITE_FOR', payload: value } );
		// Immediate validation for better UX.
		validateSiteFor( value );
	}, [ dispatch, validateSiteFor ] );

	const handleSiteDescriptionChange = useCallback( ( e ) => {
		const value = e.target.value;
		dispatch( { type: 'UPDATE_SITE_DESCRIPTION', payload: value } );
		// Immediate validation for better UX.
		validateSiteDescription( value );
	}, [ dispatch, validateSiteDescription ] );

	// Optimized character count with bounds checking.
	const descriptionCount = siteDescription.length;
	const maxDescriptionLength = 500;
	const descriptionProgress = Math.min( 100, ( descriptionCount / maxDescriptionLength ) * 100 );
	const isDescriptionNearLimit = descriptionProgress > 90;

	return (
		<div className="space-y-8">
			{ /* Site information section */ }
			<div className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<SettingField>
						<SettingLabel
							forId="name-of-the-blog"
							required={ true }
							title={ __( 'Site Title', 'solvex-ai-blogger' ) }
						/>

						<div className="relative">
							<SettingInput
								id="name-of-the-blog"
								value={ siteTitle }
								onChange={ handleSiteTitleChange }
								placeholder={ __( 'Enter your site title', 'solvex-ai-blogger' ) }
								maxLength={ 100 }
								aria-describedby="site-title-error"
								className={ `${ errors.siteTitle ? 'border-red-300 focus:ring-red-500' : '' }` }
								inputClassName={ '!pr-10' }
							/>
							{ /* Check mark indicator */ }
							<div className="absolute right-3 top-3">
								{ errors.siteTitle ? (
									<AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />
								) : siteTitle?.trim() && siteTitle.length >= 2 ? (
									<CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
								) : null }
							</div>
						</div>

						<p className="text-xs text-gray-500 mt-1 flex justify-between">
							{ errors.siteTitle ? (
								<p id="site-title-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
									{ errors.siteTitle }
								</p>
							) : <span> { __( 'The main title of your website or blog.', 'solvex-ai-blogger' ) } </span> }
							<span> { siteTitle.length }/100 </span>
						</p>
					</SettingField>

					<SettingField>
						<SettingLabel
							forId="blog-for"
							required={ true }
							title={ __( 'Site For', 'solvex-ai-blogger' ) }
						/>

						<div className="relative">
							<SettingInput
								id="blog-for"
								value={ siteFor }
								onChange={ handleSiteForChange }
								placeholder={ __( 'Brief description of your site', 'solvex-ai-blogger' ) }
								maxLength={ 200 }
								aria-describedby="site-for-error"
								className={ `${ errors.siteFor ? 'border-red-300 focus:ring-red-500' : '' }` }
								inputClassName={ '!pr-10' }
							/>
							{ /* Check mark indicator */ }
							<div className="absolute right-3 top-3">
								{ errors.siteFor ? (
									<AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />
								) : siteFor?.trim() && siteFor.length >= 10 ? (
									<CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
								) : null }
							</div>
						</div>

						<p className="text-xs text-gray-500 mt-1 flex justify-between">
							{ errors.siteFor ? (
								<p id="site-for-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
									{ errors.siteFor }
								</p>
							) : <span> { __( 'Who is your target audience?', 'solvex-ai-blogger' ) } </span> }
							<span> { siteFor.length }/200 </span>
						</p>
					</SettingField>
				</div>
			</div>

			{ /* Detailed site description */ }
			<div className="space-y-4">
				<SettingField>
					<SettingLabel
						forId="more-about-blog"
						title={ __( 'Detailed Site Information', 'solvex-ai-blogger' ) }
						required={ true }
					/>

					<div className="relative">
						<textarea
							id="more-about-blog"
							value={ siteDescription }
							onChange={ handleSiteDescriptionChange }
							className={ `block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm resize-vertical !pr-10 ${ errors.siteDescription ? 'border-red-300 focus:ring-red-500' : '' }` }
							rows={ 6 }
							maxLength={ maxDescriptionLength }
							placeholder={ __( 'Provide detailed information about your site, target audience, content style, and any specific requirements…', 'solvex-ai-blogger' ) }
							aria-describedby="description-count site-description-error"
						/>
						{ /* Check mark indicator */ }
						<div className="absolute top-3 right-3">
							{ errors.siteDescription ? (
								<AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />
							) : siteDescription?.trim() && siteDescription.length >= 20 ? (
								<CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
							) : null }
						</div>
						<div className={ `absolute bottom-2 right-3 text-xs px-1 bg-white rounded ${ isDescriptionNearLimit ? 'text-orange-600 font-medium' : 'text-gray-400' }` }>
							{ descriptionCount }/{ maxDescriptionLength }
						</div>
					</div>

					{ errors.siteDescription ? (
						<p id="site-description-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
							{ errors.siteDescription }
						</p>
					) : (
						<p id="description-count" className="text-xs text-gray-500 mt-1">
							{ __( 'This information helps AI generate more relevant and targeted content for your audience.', 'solvex-ai-blogger' ) }
						</p> ) }

				</SettingField>
			</div>

			{ /* Pro Tips section */ }
			<InfoCard
				icon={ Lightbulb }
				title={ __( 'Pro Tips for Better Results', 'solvex-ai-blogger' ) }
				items={ [
					__( 'Be specific about your target audience and industry.', 'solvex-ai-blogger' ),
					__( 'Include your brand voice and tone preferences.', 'solvex-ai-blogger' ),
					__( 'Mention any specific topics or keywords you focus on.', 'solvex-ai-blogger' ),
				] }
				colorScheme="blue"
				className="mt-6"
				ariaLabel={ __( 'Pro tips for better content generation results', 'solvex-ai-blogger' ) }
			/>

			{ /* Screen reader summary */ }
			<div className="sr-only" aria-live="polite">
				{ __( 'Persona settings configuration completed', 'solvex-ai-blogger' ) }
			</div>
		</div>
	);
} );

Persona.displayName = 'PersonaSettings';

export default Persona;
