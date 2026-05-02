/**
 * Convert array of classes into a single string with improved performance.
 *
 * @param {...(string|Array|Object)} classes - Selectors to combine.
 * @return {string} The single-line selector string.
 *
 * @since 1.0.0
 */
export const wpAiClassNames = ( ...classes ) => {
	if ( classes.length === 0 ) {
		return '';
	}

	const result = [];

	for ( const cls of classes ) {
		if ( ! cls ) {
			continue;
		}

		const type = typeof cls;

		if ( type === 'string' ) {
			result.push( cls );
		} else if ( Array.isArray( cls ) ) {
			const nested = wpAiClassNames( ...cls );
			if ( nested ) {
				result.push( nested );
			}
		} else if ( type === 'object' ) {
			for ( const [ key, value ] of Object.entries( cls ) ) {
				if ( value ) {
					result.push( key );
				}
			}
		}
	}

	return result.join( ' ' );
};

/**
 * Enhanced function to check if an object is not empty with type safety.
 *
 * @param {*} obj - The object to check.
 * @return {boolean} Returns true if the object is not empty, otherwise returns false.
 *
 * @since 1.0.0
 */
export const isObjectNotEmpty = ( obj ) => {
	// Check for null, undefined, or non-object types
	if ( ! obj || typeof obj !== 'object' ) {
		return false;
	}

	// Handle arrays
	if ( Array.isArray( obj ) ) {
		return obj.length > 0;
	}

	// Check for plain objects only
	if ( Object.getPrototypeOf( obj ) !== Object.prototype && obj.constructor !== Object ) {
		return false;
	}

	// Check for enumerable properties
	return Object.keys( obj ).length > 0;
};

/**
 * Debounce function for performance optimization
 *
 * @param {Function} func  - Function to debounce
 * @param {number}   delay - Delay in milliseconds
 * @return {Function} Debounced function
 *
 * @since 1.0.0
 */
export const debounce = ( func, delay = 300 ) => {
	if ( typeof func !== 'function' ) {
		throw new Error( 'debounce: First argument must be a function' );
	}

	let timeoutId;

	return function ( ...args ) {
		clearTimeout( timeoutId );
		timeoutId = setTimeout( () => func.apply( this, args ), delay );
	};
};

/**
 * Throttle function for performance optimization
 *
 * @param {Function} func  - Function to throttle
 * @param {number}   delay - Delay in milliseconds
 * @return {Function} Throttled function
 *
 * @since 1.0.0
 */
export const throttle = ( func, delay = 100 ) => {
	if ( typeof func !== 'function' ) {
		throw new Error( 'throttle: First argument must be a function' );
	}

	let isThrottled = false;

	return function ( ...args ) {
		if ( ! isThrottled ) {
			func.apply( this, args );
			isThrottled = true;
			setTimeout( () => {
				isThrottled = false;
			}, delay );
		}
	};
};

/**
 * Safe JSON parser with fallback
 *
 * @param {string} jsonString   - JSON string to parse
 * @param {*}      defaultValue - Default value if parsing fails
 * @return {*} Parsed object or default value
 *
 * @since 1.0.0
 */
export const safeJsonParse = ( jsonString, defaultValue = null ) => {
	try {
		return JSON.parse( jsonString );
	} catch ( error ) {
		console.warn( 'Failed to parse JSON:', error );
		return defaultValue;
	}
};

/**
 * Enhanced multi-select custom styles with better accessibility and performance
 */
export const multiSelectCustomStyle = {
	control: ( provided, state ) => ( {
		...provided,
		cursor: 'pointer',
		fontSize: '0.875rem', // Tailwind Text-sm
		lineHeight: '1.25rem', // Tailwind Text-sm
		borderRadius: '0.375rem', // Tailwind Rounded-md
		color: '#64748b', // Tailwind Slate-500
		borderColor: state.isFocused ? '#2563eb' : '#dce0e6', // Focus state
		boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
		transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
		'&:hover': {
			borderColor: state.isFocused ? '#2563eb' : '#94a3b8',
		},
	} ),
	placeholder: ( provided ) => ( {
		...provided,
		color: '#1e293b', // Tailwind Slate-800
		opacity: 0.7,
	} ),
	multiValue: ( provided ) => ( {
		...provided,
		margin: '0',
		fontWeight: '600', // Tailwind Font-semibold
		borderRadius: '0.25rem', // Tailwind Rounded
		backgroundColor: '#f1f5f9', // Tailwind Slate-200
		marginRight: '2px',
		marginBottom: '2px',
		border: '1px solid #e2e8f0',
	} ),
	multiValueLabel: ( provided ) => ( {
		...provided,
		fontWeight: '600', // Tailwind Font-semibold
		color: '#0f172a', // Tailwind Slate-900
		padding: '2px 6px',
	} ),
	multiValueRemove: ( provided ) => ( {
		...provided,
		color: '#0f172a', // Tailwind Slate-900
		borderRadius: '0 0.25rem 0.25rem 0',
		'&:hover': {
			color: '#ffffff', // White text on hover
			backgroundColor: '#ef4444', // Tailwind Red-500
		},
		'&:focus': {
			outline: '2px solid #2563eb',
			outlineOffset: '1px',
		},
	} ),
	option: ( provided, state ) => ( {
		...provided,
		backgroundColor: state.isSelected
			? '#2563eb'
			: state.isFocused
				? '#f1f5f9'
				: 'white',
		color: state.isSelected ? 'white' : '#0f172a',
		cursor: 'pointer',
		'&:active': {
			backgroundColor: state.isSelected ? '#1d4ed8' : '#e2e8f0',
		},
	} ),
	menu: ( provided ) => ( {
		...provided,
		zIndex: 9999,
		boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
	} ),
};
