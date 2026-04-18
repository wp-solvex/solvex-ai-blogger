import { forwardRef, useCallback, useState, useId } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';
import { __ } from '@wordpress/i18n';

/**
 * Enhanced SettingInput component with improved validation and accessibility
 */
const SettingInput = forwardRef( ( {
	id,
	name,
	value,
	defaultValue = '',
	type = 'text',
	placeholder = '',
	onChange,
	onBlur,
	onFocus,
	disabled = false,
	required = false,
	readOnly = false,
	error = '',
	success = false,
	helperText = '',
	size = 'default',
	variant = 'default',
	autoComplete,
	maxLength,
	minLength,
	pattern,
	className = '',
	inputClassName = '',
	'aria-label': ariaLabel,
	'aria-describedby': ariaDescribedBy,
	...props
}, ref ) => {
	const autoId = useId();
	const inputId = id || autoId;
	const [ isFocused, setIsFocused ] = useState( false );

	// Helper text ID for ARIA
	const helperTextId = helperText ? `${ inputId }-helper` : undefined;
	const errorTextId = error ? `${ inputId }-error` : undefined;

	// Build aria-describedby
	const describedBy = [
		ariaDescribedBy,
		helperTextId,
		errorTextId,
	].filter( Boolean ).join( ' ' ) || undefined;

	// Enhanced change handler
	const handleChange = useCallback( ( event ) => {
		onChange?.( event );
	}, [ onChange ] );

	// Enhanced focus handlers
	const handleFocus = useCallback( ( event ) => {
		setIsFocused( true );
		onFocus?.( event );
	}, [ onFocus ] );

	const handleBlur = useCallback( ( event ) => {
		setIsFocused( false );
		onBlur?.( event );
	}, [ onBlur ] );

	// Size variants
	const sizes = {
		small: 'px-2 py-1 text-sm',
		default: 'px-3 py-1.5 text-base sm:text-sm',
		large: 'px-4 py-2 text-lg',
	};

	// Variant styles
	const variants = {
		default: 'bg-white outline-gray-300 focus:outline-indigo-600',
		filled: 'bg-slate-50 outline-slate-200 focus:outline-indigo-600 focus:bg-white',
		borderless: 'bg-transparent outline-none border-b-2 border-gray-300 focus:border-indigo-600 rounded-none',
	};

	// State-based styles
	const getStateStyles = () => {
		if ( error ) {
			return 'outline-red-300 focus:outline-red-600 text-red-900 placeholder:text-red-400';
		}
		if ( success ) {
			return 'outline-green-300 focus:outline-green-600 text-green-900';
		}
		return '';
	};

	// Combine classes
	const inputClasses = aiClassNames(
		// Base classes
		'block w-full rounded-md outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 transition-colors duration-200',
		// Size
		sizes[ size ] || sizes.default,
		// Variant
		variants[ variant ] || variants.default,
		// State styles
		getStateStyles(),
		// Disabled styles
		disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
		// ReadOnly styles
		readOnly ? 'bg-gray-50 cursor-default' : '',
		// Focus styles
		isFocused ? 'ring-2 ring-indigo-500 ring-opacity-20' : '',
		// Custom className
		inputClassName
	);

	return (
		<div className={ aiClassNames( 'setting-input-wrapper', className ) }>
			<input
				ref={ ref }
				id={ inputId }
				name={ name || inputId }
				type={ type }
				value={ value }
				defaultValue={ value !== undefined ? undefined : defaultValue }
				placeholder={ placeholder }
				disabled={ disabled }
				required={ required }
				readOnly={ readOnly }
				autoComplete={ autoComplete }
				maxLength={ maxLength }
				minLength={ minLength }
				pattern={ pattern }
				className={ inputClasses }
				onChange={ handleChange }
				onFocus={ handleFocus }
				onBlur={ handleBlur }
				aria-label={ ariaLabel }
				aria-describedby={ describedBy }
				aria-invalid={ Boolean( error ) }
				aria-required={ required }
				{ ...props }
			/>

			{ helperText && (
				<p
					id={ helperTextId }
					className="mt-1 text-sm text-gray-600"
				>
					{ helperText }
				</p>
			) }

			{ error && (
				<p
					id={ errorTextId }
					className="mt-1 text-sm text-red-600"
					role="alert"
					aria-live="polite"
				>
					{ error }
				</p>
			) }

			{ success && (
				<p className="mt-1 text-sm text-green-600">
					<svg
						className="inline w-4 h-4 mr-1"
						fill="currentColor"
						viewBox="0 0 20 20"
						aria-hidden="true"
					>
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clipRule="evenodd"
						/>
					</svg>
					{ __( 'Valid input', 'auto-ai-blogger' ) }
				</p>
			) }
		</div>
	);
} );

SettingInput.displayName = 'SettingInput';

export default SettingInput;
