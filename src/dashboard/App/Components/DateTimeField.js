import { forwardRef, useCallback, useState, useId, useEffect } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * DateTimeField component for campaign start date selection with custom 15-minute intervals
 */
const DateTimeField = forwardRef( ( {
	id,
	name,
	value,
	defaultValue = '',
	onChange,
	onBlur,
	onFocus,
	disabled = false,
	required = false,
	readOnly = false,
	error = '',
	helperText = '',
	className = '',
	placeholder = '', // eslint-disable-line
	'aria-label': ariaLabel,
	'aria-describedby': ariaDescribedBy,
	...props
}, ref ) => {
	const autoId = useId();
	const inputId = id || autoId;
	const [ isFocused, setIsFocused ] = useState( false );
	const [ selectedDate, setSelectedDate ] = useState( '' );
	const [ selectedTime, setSelectedTime ] = useState( '' );

	// Helper text ID for ARIA
	const helperTextId = helperText ? `${ inputId }-helper` : undefined;
	const errorTextId = error ? `${ inputId }-error` : undefined;

	// Build aria-describedby
	const describedBy = [
		ariaDescribedBy,
		helperTextId,
		errorTextId,
	].filter( Boolean ).join( ' ' ) || undefined;

	// Generate time options in 5-minute intervals
	const generateTimeOptions = useCallback( () => {
		const options = [];
		for ( let hour = 0; hour < 24; hour++ ) {
			for ( let minute = 0; minute < 60; minute += 5 ) {
				const hourStr = String( hour ).padStart( 2, '0' );
				const minuteStr = String( minute ).padStart( 2, '0' );
				const timeValue = `${ hourStr }:${ minuteStr }`;
				const displayTime = new Date( `1970-01-01T${ timeValue }` ).toLocaleTimeString( [], {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				} );
				options.push( { value: timeValue, label: displayTime } );
			}
		}
		return options;
	}, [] );

	// Get minimum date (today)
	const getMinDate = useCallback( () => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String( today.getMonth() + 1 ).padStart( 2, '0' );
		const day = String( today.getDate() ).padStart( 2, '0' );
		return `${ year }-${ month }-${ day }`;
	}, [] );

	// Get minimum time for today
	const getMinTimeForToday = useCallback( () => {
		const now = new Date();
		const currentHour = now.getHours();
		const currentMinutes = now.getMinutes();

		// Round up to next 5-minute interval
		let nextInterval = Math.ceil( currentMinutes / 5 ) * 5;
		let hour = currentHour;

		if ( nextInterval >= 60 ) {
			nextInterval = 0;
			hour += 1;
		}

		if ( hour >= 24 ) {
			return null; // No valid time today
		}

		return `${ String( hour ).padStart( 2, '0' ) }:${ String( nextInterval ).padStart( 2, '0' ) }`;
	}, [] );

	// Parse initial value
	const parseInitialValue = useCallback( ( val ) => {
		if ( ! val ) {
			return { date: '', time: '' };
		}

		try {
			const dateObj = new Date( val );
			if ( isNaN( dateObj.getTime() ) ) {
				return { date: '', time: '' };
			}

			const year = dateObj.getFullYear();
			const month = String( dateObj.getMonth() + 1 ).padStart( 2, '0' );
			const day = String( dateObj.getDate() ).padStart( 2, '0' );
			const hours = dateObj.getHours();
			const minutes = dateObj.getMinutes();

			// Round minutes to nearest 5-minute interval
			const roundedMinutes = Math.round( minutes / 5 ) * 5;
			const finalHours = roundedMinutes === 60 ? hours + 1 : hours;
			const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;

			const hoursStr = String( finalHours ).padStart( 2, '0' );
			const minutesStr = String( finalMinutes ).padStart( 2, '0' );

			return {
				date: `${ year }-${ month }-${ day }`,
				time: `${ hoursStr }:${ minutesStr }`,
			};
		} catch ( e ) {
			return { date: '', time: '' };
		}
	}, [] );

	// Initialize and sync state from value prop
	useEffect( () => {
		const parsed = parseInitialValue( value || defaultValue );
		if ( parsed.date || parsed.time ) {
			setSelectedDate( parsed.date );
			setSelectedTime( parsed.time );
		}
	}, [ value, defaultValue, parseInitialValue ] );

	// Handle date change
	const handleDateChange = useCallback( ( event ) => {
		const newDate = event.target.value;
		setSelectedDate( newDate );

		// If selecting today, validate the current time
		const today = getMinDate();
		if ( newDate === today && selectedTime ) {
			const minTime = getMinTimeForToday();
			if ( minTime && selectedTime < minTime ) {
				setSelectedTime( minTime );
			}
		}

		// Combine date and time and notify parent
		if ( newDate && selectedTime ) {
			const combinedDateTime = `${ newDate }T${ selectedTime }`;
			const isoString = new Date( combinedDateTime ).toISOString();

			const customEvent = {
				target: {
					name: name || inputId,
					value: isoString,
				},
			};
			onChange?.( customEvent );
		}
	}, [ selectedTime, getMinDate, getMinTimeForToday, name, inputId, onChange ] );

	// Handle time change
	const handleTimeChange = useCallback( ( event ) => {
		const newTime = event.target.value;

		// Validate time if selecting today
		const today = getMinDate();
		if ( selectedDate === today ) {
			const minTime = getMinTimeForToday();
			if ( minTime && newTime < minTime ) {
				return; // Don't allow past times for today
			}
		}

		setSelectedTime( newTime );

		// Combine date and time and notify parent
		if ( selectedDate && newTime ) {
			const combinedDateTime = `${ selectedDate }T${ newTime }`;
			const isoString = new Date( combinedDateTime ).toISOString();

			const customEvent = {
				target: {
					name: name || inputId,
					value: isoString,
				},
			};
			onChange?.( customEvent );
		}
	}, [ selectedDate, getMinDate, getMinTimeForToday, name, inputId, onChange ] );

	// Get available time options based on selected date
	const getAvailableTimeOptions = useCallback( () => {
		const allOptions = generateTimeOptions();
		const today = getMinDate();

		// If disabled (view mode) or not today, show all options
		if ( disabled || selectedDate !== today ) {
			return allOptions;
		}

		// For today in edit mode, filter out past times
		const minTime = getMinTimeForToday();
		if ( ! minTime ) {
			return []; // No valid times for today
		}

		return allOptions.filter( ( option ) => option.value >= minTime );
	}, [ selectedDate, generateTimeOptions, getMinDate, getMinTimeForToday, disabled ] );

	// Enhanced focus handlers
	const handleFocus = useCallback( ( event ) => {
		setIsFocused( true );
		onFocus?.( event );
	}, [ onFocus ] );

	const handleBlur = useCallback( ( event ) => {
		setIsFocused( false );
		onBlur?.( event );
	}, [ onBlur ] );

	// State-based styles
	const getStateStyles = () => {
		if ( error ) {
			return 'outline-red-300 focus:outline-red-600 text-red-900';
		}
		return '';
	};

	// Base input classes with consistent height
	const inputClasses = `block w-full h-10 rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 transition-colors duration-200 mt-[10px] ${
		readOnly
			? 'bg-gray-50 outline-gray-200 cursor-default'
			: 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600'
	} ${
		disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
	} ${
		getStateStyles()
	} ${
		isFocused && ! readOnly ? 'ring-2 ring-indigo-500 ring-opacity-20' : ''
	}`;

	const timeOptions = getAvailableTimeOptions();

	return (
		<div className={ `datetime-field-wrapper ${ className }` }>
			<div className="grid grid-cols-2 gap-3">
				{ /* Date Input */ }
				<div>
					<label htmlFor={ `${ inputId }-date` } className="block text-sm font-normal text-gray-600 mb-1 whitespace-nowrap">
						{ __( 'Date', 'solvex-ai-blogger' ) }
					</label>
					<input
						id={ `${ inputId }-date` }
						type="date"
						value={ selectedDate }
						min={ getMinDate() }
						onChange={ handleDateChange }
						onFocus={ handleFocus }
						onBlur={ handleBlur }
						disabled={ disabled }
						required={ required }
						readOnly={ readOnly }
						className={ inputClasses }
						aria-describedby={ describedBy }
						aria-invalid={ Boolean( error ) }
					/>
				</div>

				{ /* Time Select */ }
				<div>
					<label htmlFor={ `${ inputId }-time` } className="block text-sm font-normal text-gray-600 mb-1 whitespace-nowrap">
						{ __( 'Time', 'solvex-ai-blogger' ) }
					</label>
					<select
						id={ `${ inputId }-time` }
						value={ selectedTime }
						onChange={ handleTimeChange }
						onFocus={ handleFocus }
						onBlur={ handleBlur }
						disabled={ disabled || ! selectedDate || timeOptions.length === 0 }
						required={ required }
						className={ inputClasses }
						aria-describedby={ describedBy }
						aria-invalid={ Boolean( error ) }
					>
						<option value="">{ __( 'Select time', 'solvex-ai-blogger' ) }</option>
						{ timeOptions.map( ( option ) => (
							<option key={ option.value } value={ option.value }>
								{ option.label }
							</option>
						) ) }
					</select>
				</div>
			</div>

			{ helperText && (
				<p
					id={ helperTextId }
					className="mt-2 text-sm text-gray-600"
				>
					{ helperText }
				</p>
			) }

			{ error && (
				<p
					id={ errorTextId }
					className="mt-2 text-sm text-red-600"
					role="alert"
					aria-live="polite"
				>
					{ error }
				</p>
			) }

			{ /* Hidden input for form compatibility */ }
			<input
				ref={ ref }
				type="hidden"
				name={ name || inputId }
				value={ selectedDate && selectedTime ? new Date( `${ selectedDate }T${ selectedTime }` ).toISOString() : '' }
				{ ...props }
			/>
		</div>
	);
} );

DateTimeField.displayName = 'DateTimeField';

export default DateTimeField;
