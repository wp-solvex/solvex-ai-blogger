// Import the apiFetch function from the '@wordpress/api-fetch' package.
import apiFetch from '@wordpress/api-fetch';

/**
 * Validates API input parameters.
 *
 * @param {string} key   - Settings key.
 * @param {*}      value - The value to validate.
 * @return {boolean} True if valid, false otherwise.
 */
const validateApiInput = ( key, value ) => {
	if ( typeof key !== 'string' || key.length === 0 ) {
		console.error( 'Invalid API key provided' );
		return false;
	}

	if ( value === undefined || value === null ) {
		console.error( 'Invalid API value provided' );
		return false;
	}

	return true;
};

/**
 * Creates a secure FormData object with authentication data.
 *
 * @param {string} action - WordPress action name.
 * @param {string} key    - Setting key.
 * @param {*}      value  - The data to send.
 * @param {Object} config - Configuration object with nonce and ajaxUrl.
 * @return {FormData} Configured FormData object.
 */
const createSecureFormData = ( action, key, value, config = {} ) => {
	const formData = new window.FormData();

	formData.append( 'action', action );
	formData.append( 'security', config.nonce || ( typeof solvex_aib_localized_data !== 'undefined' && solvex_aib_localized_data?.admin_nonce ) || '' );
	formData.append( 'key', key );

	// Properly serialize complex values
	const serializedValue = typeof value === 'object' ? JSON.stringify( value ) : String( value );
	formData.append( 'value', serializedValue );

	return formData;
};

/**
 * A simplified function to send form data via API fetch for admin use.
 * Focuses on basic security and reliability without complex abort controller management.
 *
 * @function
 *
 * @param {string}   key      - Settings key.
 * @param {*}        value    - The data to send.
 * @param {Function} dispatch - Redux dispatch function.
 * @param {Object}   config   - Configuration object with nonce and ajaxUrl.
 *
 * @return {Promise} Returns a promise representing the processed request.
 */
const updateApiData = async ( key, value, dispatch, config = {} ) => {
	// Validate inputs
	if ( ! validateApiInput( key, value ) ) {
		return Promise.reject( new Error( 'Invalid input parameters' ) );
	}

	if ( typeof dispatch !== 'function' ) {
		console.error( 'Dispatch function is required' );
		return Promise.reject( new Error( 'Invalid dispatch function' ) );
	}

	try {
		const formData = createSecureFormData( 'solvex_aib_update_admin_setting', key, value, config );

		const response = await apiFetch( {
			url: config.ajaxUrl || ( typeof solvex_aib_localized_data !== 'undefined' && solvex_aib_localized_data?.ajax_url ) || '',
			method: 'POST',
			body: formData,
			timeout: 30000, // 30 second timeout
		} );

		// Handle successful response
		if ( response?.success ) {
			return response;
		}
		// Log the full response for debugging
		console.error( 'Full API response:', response );
		throw new Error( response?.data?.message || 'API request failed' );
	} catch ( error ) {
		console.error( `API Error for key "${ key }":`, error.message );

		// Dispatch error state if provided
		if ( dispatch ) {
			dispatch( {
				type: 'SET_API_ERROR',
				payload: {
					key,
					error: error.message,
				},
			} );
		}

		return Promise.reject( error );
	}
};

/**
 * A function to create or update a campaign with enhanced error handling.
 *
 * @function
 *
 * @param {Object}  value              - The campaign data to send.
 * @param {boolean} isNew              - Is new campaign or not.
 * @param {Object}  abortControllerRef - The ref object to hold abort controller.
 * @param {Object}  config             - Configuration object with nonce and ajaxUrl.
 *
 * @return {Promise} Returns a promise representing the processed request.
 */
const updateCampaign = async ( value, isNew, abortControllerRef = null, config = {} ) => {
	// Validate campaign data.
	if ( ! value || typeof value !== 'object' ) {
		const error = new Error( 'Invalid campaign data provided' );
		console.error( error.message );
		return Promise.reject( error );
	}

	// Abort any previous request
	if ( abortControllerRef?.current?.campaign_details ) {
		abortControllerRef.current.campaign_details.abort();
	}

	// Create a new AbortController
	const abortController = new AbortController();
	if ( abortControllerRef?.current ) {
		abortControllerRef.current.campaign_details = abortController;
	}

	try {
		const action = isNew ? 'solvex_aib_create_campaign' : 'solvex_aib_update_campaign';
		const formData = createSecureFormData( action, 'campaign_details', value, config );

		const response = await apiFetch( {
			url: config.ajaxUrl || ( typeof solvex_aib_localized_data !== 'undefined' && solvex_aib_localized_data?.ajax_url ) || '',
			method: 'POST',
			body: formData,
			signal: abortController.signal,
			timeout: 30000, // 30 second timeout
		} );

		// Handle successful response
		if ( response?.success ) {
			// Instead of immediate reload, provide feedback first
			console.log( `Campaign ${ isNew ? 'created' : 'updated' } successfully` );
			console.log( 'Response data:', response.data );

			// Optional: dispatch success action for UI feedback
			// dispatch({ type: 'CAMPAIGN_SAVE_SUCCESS', payload: response.data });

			// Reload to show updated campaign list
			window.location.reload();

			return response;
		}

		console.error( 'Campaign operation failed:', response );
		throw new Error( response?.data?.message || `Failed to ${ isNew ? 'create' : 'update' } campaign` );
	} catch ( error ) {
		// Handle different types of errors
		if ( error.name === 'AbortError' ) {
			console.log( 'Campaign operation was aborted' );
			return Promise.reject( error );
		}

		console.error( 'Campaign Error:', error.message );
		console.error( 'Full error object:', error );

		// Show user-friendly error message
		if ( typeof window !== 'undefined' && window.alert ) {
			window.alert( `Error: ${ error.message }` );
		}

		return Promise.reject( error );
	}
};

export { updateApiData, updateCampaign };
