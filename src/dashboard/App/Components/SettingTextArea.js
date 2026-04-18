import { forwardRef, useCallback, useState, useId, useMemo } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';
import { __ } from '@wordpress/i18n';

/**
 * Enhanced SettingTextArea component with better features and accessibility
 */
const SettingTextArea = forwardRef( ( {
	id,
	name,
	value,
	defaultValue = '',
	placeholder = '',
	rows = 3,
	cols,
	onChange,
	onBlur,
	onFocus,
	disabled = false,
	required = false,
	readOnly = false,
	error = '',
	success = false,
	helperText = '',
	maxLength,
	minLength,
	resize = 'vertical',
	autoGrow = false,
	showCharCount = false,
	className = '',
	textareaClassName = '',
	'aria-label': ariaLabel,
	'aria-describedby': ariaDescribedBy,
	...props
}, ref ) => {
	const autoId = useId();
	const textareaId = id || autoId;
	const [ isFocused, setIsFocused ] = useState( false );
	const [ currentValue, setCurrentValue ] = useState( value || defaultValue );

	// Helper text ID for ARIA
	const helperTextId = helperText ? `${ textareaId }-helper` : undefined;
	const errorTextId = error ? `${ textareaId }-error` : undefined;
	const charCountId = showCharCount ? `${ textareaId }-char-count` : undefined;

	// Build aria-describedby
	const describedBy = [
		ariaDescribedBy,
		helperTextId,
		errorTextId,
		charCountId,
	].filter( Boolean ).join( ' ' ) || undefined;

	// Enhanced change handler
	const handleChange = useCallback( ( event ) => {
		const newValue = event.target.value;
		setCurrentValue( newValue );
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

	// Resize options
	const resizeClasses = {
		none: 'resize-none',
		both: 'resize',
		horizontal: 'resize-x',
		vertical: 'resize-y',
	};

	// State-based styles
	const getStateStyles = () => {
		if ( error ) {
			return 'outline-red-300 focus:outline-red-600 text-red-900 placeholder:text-red-400';
		}
		if ( success ) {
			return 'outline-green-300 focus:outline-green-600 text-green-900';
		}
		return 'outline-gray-300 focus:outline-indigo-600';
	};

	// Character count
	const charCount = useMemo( () => {
		const current = currentValue?.length || 0;
		const max = maxLength || 0;
		const isOverLimit = max > 0 && current > max;

		return {
			current,
			max,
			isOverLimit,
			remaining: max > 0 ? max - current : null,
		};
	}, [ currentValue, maxLength ] );

	// Auto-grow functionality
	const autoGrowProps = autoGrow ? {
		style: { minHeight: `${ rows * 1.5 }rem` },
		onInput: ( e ) => {
			e.target.style.height = 'auto';
			e.target.style.height = `${ e.target.scrollHeight }px`;
		},
	} : {};

	// Combine classes
	const textareaClasses = aiClassNames(
		// Base classes
		'block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 transition-colors duration-200 sm:text-sm',
		// Resize
		resizeClasses[ resize ] || resizeClasses.vertical,
		// State styles
		getStateStyles(),
		// Disabled styles
		disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
		// ReadOnly styles
		readOnly ? 'bg-gray-50 cursor-default' : '',
		// Focus styles
		isFocused ? 'ring-2 ring-indigo-500 ring-opacity-20' : '',
		// Auto-grow
		autoGrow ? 'overflow-hidden' : '',
		// Custom className
		textareaClassName
	);

	return (
		<div className={ aiClassNames( 'setting-textarea-wrapper', className ) }>
			<textarea
				ref={ ref }
				id={ textareaId }
				name={ name || textareaId }
				rows={ rows }
				cols={ cols }
				value={ value }
				defaultValue={ value !== undefined ? undefined : defaultValue }
				placeholder={ placeholder }
				disabled={ disabled }
				required={ required }
				readOnly={ readOnly }
				maxLength={ maxLength }
				minLength={ minLength }
				className={ textareaClasses }
				onChange={ handleChange }
				onFocus={ handleFocus }
				onBlur={ handleBlur }
				aria-label={ ariaLabel }
				aria-describedby={ describedBy }
				aria-invalid={ Boolean( error ) }
				aria-required={ required }
				{ ...autoGrowProps }
				{ ...props }
			/>

			{ ( showCharCount || helperText || error ) && (
				<div className="mt-1 flex items-center justify-between">
					<div className="flex-1">
						{ helperText && (
							<p
								id={ helperTextId }
								className="text-sm text-gray-600"
							>
								{ helperText }
							</p>
						) }

						{ error && (
							<p
								id={ errorTextId }
								className="text-sm text-red-600"
								role="alert"
								aria-live="polite"
							>
								{ error }
							</p>
						) }
					</div>

					{ showCharCount && (
						<p
							id={ charCountId }
							className={ aiClassNames(
								'text-xs ml-2 tabular-nums',
								charCount.isOverLimit ? 'text-red-600' : 'text-gray-500'
							) }
							aria-live="polite"
						>
							{ charCount.max ? (
								<>
									{ charCount.current }/{ charCount.max }
									{ charCount.isOverLimit && (
										<span className="ml-1">
											({ charCount.remaining } { __( 'over limit', 'auto-ai-blogger' ) })
										</span>
									) }
								</>
							) : (
								charCount.current
							) }
						</p>
					) }
				</div>
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

SettingTextArea.displayName = 'SettingTextArea';

export default SettingTextArea;
