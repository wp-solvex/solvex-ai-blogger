import React, { useState, useCallback, memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { RangeControl } from '@wordpress/components';
import { Thermometer, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import InfoCard from '@Components/InfoCard';

// Enhanced safety filter component
const SafetyFilterControl = memo( ( {
	id,
	title,
	description,
	value,
	onChange,
	icon: Icon,
	disabled = false,
} ) => {
	const blockLabels = useMemo( () => [
		__( 'Off', 'solvex-ai-blogger' ),
		__( 'Block none', 'solvex-ai-blogger' ),
		__( 'Block few', 'solvex-ai-blogger' ),
		__( 'Block some', 'solvex-ai-blogger' ),
		__( 'Block most', 'solvex-ai-blogger' ),
	], [] );

	const getSeverityColor = ( severityValue ) => {
		switch ( severityValue ) {
			case 0: return 'text-gray-600 bg-gray-100';
			case 1: return 'text-green-600 bg-green-100';
			case 2: return 'text-yellow-600 bg-yellow-100';
			case 3: return 'text-orange-600 bg-orange-100';
			case 4: return 'text-red-600 bg-red-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	};

	const marks = useMemo( () => [
		{ value: 0, label: blockLabels[ 0 ] },
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 3, label: '3' },
		{ value: 4, label: '4' },
	], [ blockLabels ] );

	return (
		<div className="p-2 border border-gray-200 rounded-lg bg-white">
			{ /* Header with icon and title */ }
			<div className="flex items-center gap-3 mb-2">
				<div className={ `p-2 rounded-lg flex ${ getSeverityColor( value ) }` }>
					<Icon className="w-4 h-4" aria-hidden="true" />
				</div>
				<div className="flex-1 flex justify-between items-center">
					<h3 className="text-sm font-semibold text-gray-900 p- m-0">{ title }</h3>
					<div className={ `px-2 py-1 rounded-full text-xs font-medium ${ getSeverityColor( value ) }` }>
						{ blockLabels[ value ] || __( 'Unknown', 'solvex-ai-blogger' ) }
					</div>
				</div>
			</div>

			<p className="text-xs text-gray-600 mb-3">{ description }</p>

			{ /* Range control */ }
			<div className="mt-3">
				<RangeControl
					value={ value }
					onChange={ onChange }
					min={ 0 }
					max={ 4 }
					step={ 1 }
					withInputField={ false }
					disabled={ disabled }
					renderTooltipContent={ ( tooltipValue ) => (
						<span className="text-sm font-medium">
							{ blockLabels[ tooltipValue ] || '' }
						</span>
					) }
					marks={ marks }
					aria-labelledby={ `${ id }-label` }
					aria-describedby={ `${ id }-description` }
				/>
			</div>
		</div>
	);
} );

SafetyFilterControl.displayName = 'SafetyFilterControl';

// Enhanced temperature control component
const TemperatureControl = memo( ( { value, onChange, disabled = false } ) => {
	const getTemperatureLabel = ( temp ) => {
		if ( temp <= 0.3 ) {
			return __( 'Conservative', 'solvex-ai-blogger' );
		}
		if ( temp <= 0.7 ) {
			return __( 'Balanced', 'solvex-ai-blogger' );
		}
		if ( temp <= 1.2 ) {
			return __( 'Creative', 'solvex-ai-blogger' );
		}
		if ( temp <= 1.6 ) {
			return __( 'Very Creative', 'solvex-ai-blogger' );
		}
		return __( 'Experimental', 'solvex-ai-blogger' );
	};

	const getTemperatureColor = ( temp ) => {
		if ( temp <= 0.3 ) {
			return 'text-blue-600 bg-blue-100';
		}
		if ( temp <= 0.7 ) {
			return 'text-green-600 bg-green-100';
		}
		if ( temp <= 1.2 ) {
			return 'text-yellow-600 bg-yellow-100';
		}
		if ( temp <= 1.6 ) {
			return 'text-orange-600 bg-orange-100';
		}
		return 'text-red-600 bg-red-100';
	};

	return (
		<div className="p-2 border border-gray-200 rounded-lg bg-white">
			<div className="flex items-center gap-3 mb-3">
				<div className={ `p-2 rounded-lg flex ${ getTemperatureColor( value ) }` }>
					<Thermometer className="w-4 h-4" aria-hidden="true" />
				</div>
				<div className="flex-1">
					<h3 className="text-sm font-semibold text-gray-900">
						{ __( 'Creativity Temperature', 'solvex-ai-blogger' ) }
					</h3>
					<p className="text-xs text-gray-600">
						{ __( 'Controls randomness and creativity in content generation.', 'solvex-ai-blogger' ) }
					</p>
				</div>
				<div className={ `px-2 py-1 rounded-full text-xs font-medium ${ getTemperatureColor( value ) }` }>
					{ getTemperatureLabel( value ) } ({ value })
				</div>
			</div>

			<div className="mt-3">
				<RangeControl
					value={ value }
					onChange={ onChange }
					min={ 0 }
					max={ 2 }
					step={ 0.05 }
					disabled={ disabled }
					withInputField={ false }
					renderTooltipContent={ ( temp ) => (
						<span className="text-sm font-medium">
							{ getTemperatureLabel( temp ) } ({ temp })
						</span>
					) }
					marks={ [
						{ value: 0, label: '0' },
						{ value: 0.5, label: '0.5' },
						{ value: 1, label: '1' },
						{ value: 1.5, label: '1.5' },
						{ value: 2, label: '2' },
					] }
					aria-label={ __( 'Content creativity level', 'solvex-ai-blogger' ) }
				/>
			</div>

			{ /* Temperature guide */ }
			<div className="mt-3 text-xs text-gray-500 space-y-1">
				<div className="flex justify-between">
					<span>{ __( 'More predictable', 'solvex-ai-blogger' ) }</span>
					<span>{ __( 'More creative', 'solvex-ai-blogger' ) }</span>
				</div>
			</div>
		</div>
	);
} );

TemperatureControl.displayName = 'TemperatureControl';

// Main Advanced Settings component
const AdvancedSettings = memo( () => {
	const dispatch = useDispatch();
	const [ isAdvancedOpen, setIsAdvancedOpen ] = useState( false );

	// Redux selectors
	const temperature = useSelector( ( state ) => state.temperature );
	const harassment = useSelector( ( state ) => state.harassment );
	const hate = useSelector( ( state ) => state.hate );
	const sexuallyExplicit = useSelector( ( state ) => state.sexuallyExplicit );
	const dangerousContent = useSelector( ( state ) => state.dangerousContent );

	// Handlers
	const handleTemperatureChange = useCallback( ( value ) => {
		const clampedValue = Math.max( 0, Math.min( 2, parseFloat( value ) || 1.0 ) );
		dispatch( { type: 'UPDATE_TEMPERATURE', payload: clampedValue } );
	}, [ dispatch ] );

	const handleHarassmentChange = useCallback( ( value ) => {
		const clampedValue = Math.max( 0, Math.min( 4, parseInt( value ) ?? 2 ) );
		dispatch( { type: 'UPDATE_HARASSMENT', payload: clampedValue } );
	}, [ dispatch ] );

	const handleHateChange = useCallback( ( value ) => {
		const clampedValue = Math.max( 0, Math.min( 4, parseInt( value ) ?? 2 ) );
		dispatch( { type: 'UPDATE_HATE', payload: clampedValue } );
	}, [ dispatch ] );

	const handleSexuallyExplicitChange = useCallback( ( value ) => {
		const clampedValue = Math.max( 0, Math.min( 4, parseInt( value ) ?? 2 ) );
		dispatch( { type: 'UPDATE_SEXUALLY_EXPLICIT', payload: clampedValue } );
	}, [ dispatch ] );

	const handleDangerousContentChange = useCallback( ( value ) => {
		const clampedValue = Math.max( 0, Math.min( 4, parseInt( value ) ?? 2 ) );
		dispatch( { type: 'UPDATE_DANGEROUS_CONTENT', payload: clampedValue } );
	}, [ dispatch ] );

	return (
		<div className="space-y-4">
			{ /* Accordion Header */ }
			<div className="border border-gray-200 rounded-lg bg-white">
				<button
					type="button"
					onClick={ () => setIsAdvancedOpen( ! isAdvancedOpen ) }
					className={ `${ isAdvancedOpen ? '' : 'rounded-b-lg' } w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset` }
					aria-expanded={ isAdvancedOpen }
					aria-controls="advanced-settings-content"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-orange-100 rounded-lg">
							<Thermometer className="w-5 h-5 text-orange-600" aria-hidden="true" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2 mt-0">
								{ __( 'Advanced AI Settings', 'solvex-ai-blogger' ) }
							</h3>
							<p className="text-sm text-gray-600">
								{ __( 'Configure creativity temperature and content safety filters.', 'solvex-ai-blogger' ) }
							</p>
						</div>
					</div>
					<div className="flex-shrink-0">
						{ isAdvancedOpen ? (
							<ChevronUp className="w-5 h-5 text-gray-500" />
						) : (
							<ChevronDown className="w-5 h-5 text-gray-500" />
						) }
					</div>
				</button>

				{ /* Accordion Content */ }
				{ isAdvancedOpen && (
					<div
						id="advanced-settings-content"
						className="px-4 pb-4 space-y-6 border border-solid border-gray-200 rounded-b-lg"
					>
						{ /* Temperature control */ }
						<div className="pt-4">
							<TemperatureControl
								value={ temperature }
								onChange={ handleTemperatureChange }
							/>
						</div>

						{ /* Safety filters */ }
						<div className="space-y-4">
							<h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
								{ __( 'Content Safety Filters', 'solvex-ai-blogger' ) }
							</h4>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<SafetyFilterControl
									id="harassment"
									title={ __( 'Harassment Filter', 'solvex-ai-blogger' ) }
									description={ __( 'Blocks harassing or bullying content.', 'solvex-ai-blogger' ) }
									value={ harassment }
									onChange={ handleHarassmentChange }
									icon={ Shield }
								/>

								<SafetyFilterControl
									id="hate"
									title={ __( 'Hate Speech Filter', 'solvex-ai-blogger' ) }
									description={ __( 'Blocks hateful or discriminatory content.', 'solvex-ai-blogger' ) }
									value={ hate }
									onChange={ handleHateChange }
									icon={ AlertTriangle }
								/>

								<SafetyFilterControl
									id="sexually-explicit"
									title={ __( 'Adult Content Filter', 'solvex-ai-blogger' ) }
									description={ __( 'Blocks sexually explicit content.', 'solvex-ai-blogger' ) }
									value={ sexuallyExplicit }
									onChange={ handleSexuallyExplicitChange }
									icon={ Shield }
								/>

								<SafetyFilterControl
									id="dangerous-content"
									title={ __( 'Dangerous Content Filter', 'solvex-ai-blogger' ) }
									description={ __( 'Blocks potentially harmful instructions.', 'solvex-ai-blogger' ) }
									value={ dangerousContent }
									onChange={ handleDangerousContentChange }
									icon={ AlertTriangle }
								/>
							</div>

							{ /* Safety info box */ }
							<InfoCard
								icon={ Shield }
								title={ __( 'Safety Filter Guidelines', 'solvex-ai-blogger' ) }
								description={ __( 'Higher filter levels provide stronger content moderation but may be more restrictive. Adjust based on your content requirements and audience.', 'solvex-ai-blogger' ) }
								colorScheme="green"
								ariaLabel={ __( 'Safety filter configuration guidelines', 'solvex-ai-blogger' ) }
							/>
						</div>
					</div>
				) }
			</div>
		</div>
	);
} );

AdvancedSettings.displayName = 'AdvancedAISettings';

export default AdvancedSettings;
