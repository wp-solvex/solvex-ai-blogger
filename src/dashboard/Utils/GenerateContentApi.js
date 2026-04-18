/**
 * API utility for generating AI content.
 *
 * @package
 * @since x.x.x
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * Error class for insufficient tokens.
 */
class InsufficientTokensError extends Error {
	/**
	 * @param {string} message   - Error message
	 * @param {Object} tokenData - Token data
	 */
	constructor( message, tokenData ) {
		super( message );
		this.name = 'InsufficientTokensError';
		this.code = 'insufficient_tokens';
		this.status = 402;
		this.tokenData = tokenData;
	}
}

/**
 * Error class for API errors.
 */
class ApiRequestError extends Error {
	/**
	 * @param {string} message - Error message
	 * @param {number} status  - HTTP status code
	 * @param {string} code    - Error code
	 * @param {*}      data    - Additional error data
	 */
	constructor( message, status, code, data ) {
		super( message );
		this.name = 'ApiRequestError';
		this.status = status;
		this.code = code;
		this.data = data;
	}
}

/**
 * Delays execution for exponential backoff.
 *
 * @param {number} ms - Milliseconds to delay
 * @return {Promise<void>}
 */
const delay = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) );

/**
 * Validates the title parameter.
 *
 * @param {string} title - The title to validate
 * @throws {Error} If title is invalid
 */
const validateTitle = ( title ) => {
	if ( ! title || typeof title !== 'string' ) {
		throw new Error( 'Title is required and must be a string' );
	}

	if ( title.trim().length === 0 ) {
		throw new Error( 'Title cannot be empty' );
	}

	if ( title.length > 500 ) {
		throw new Error( 'Title is too long (max 500 characters)' );
	}
};

/**
 * Validates and normalizes options.
 *
 * @param {Object} options - The options to validate
 * @return {Object} Normalized options
 */
const validateAndNormalizeOptions = ( options = {} ) => {
	const normalized = { ...options };

	// Validate numeric fields
	if ( normalized.image_count !== undefined ) {
		normalized.image_count = Math.max( 0, Math.min( 10, Number( normalized.image_count ) ) );
	}

	if ( normalized.temperature !== undefined ) {
		normalized.temperature = Math.max( 0, Math.min( 1, Number( normalized.temperature ) ) );
	}

	// Validate safety levels (0-4)
	const safetyFields = [ 'harassment', 'hate', 'sexually_explicit', 'dangerous_content' ];
	safetyFields.forEach( ( field ) => {
		if ( normalized[ field ] !== undefined ) {
			normalized[ field ] = Math.max( 0, Math.min( 4, Math.floor( Number( normalized[ field ] ) ) ) );
		}
	} );

	return normalized;
};

/**
 * Makes a single API request attempt.
 *
 * @param {string}      title   - Blog post title
 * @param {Object}      options - Generation options
 * @param {AbortSignal} signal  - AbortController signal
 * @return {Promise<Object>} - The API response
 */
const makeApiRequest = async ( title, options, signal ) => {
	const endpoint = '/wp-json/wp-ai-blogger/v1/generate-content-from-title';

	const requestBody = {
		title,
		site_title: options.site_title || '',
		site_purpose: options.site_purpose || '',
		site_description: options.site_description || '',
		image_count: options.image_count || 0,
		temperature: options.temperature !== undefined ? options.temperature : 0.3,
		harassment: options.harassment !== undefined ? options.harassment : 2,
		hate: options.hate !== undefined ? options.hate : 2,
		sexually_explicit: options.sexually_explicit !== undefined ? options.sexually_explicit : 2,
		dangerous_content: options.dangerous_content !== undefined ? options.dangerous_content : 2,
		license: options.license || ( typeof solvex_aib_localized_data !== 'undefined' && solvex_aib_localized_data?.license_key ) || '',
	};

	// Validate license
	if ( ! requestBody.license ) {
		throw new ApiRequestError( 'License key is required', 400, 'missing_license', null );
	}

	const response = await apiFetch( {
		path: endpoint,
		method: 'POST',
		data: requestBody,
		signal,
		parse: true,
	} );

	return response;
};

/**
 * Determines if an error is retryable (5xx server error).
 *
 * @param {Error} error - The error to check
 * @return {boolean} True if retryable
 */
const isRetryableError = ( error ) => {
	// Check for 5xx status codes
	if ( error.status >= 500 && error.status < 600 ) {
		return true;
	}

	// Check for network errors
	if ( error.name === 'TypeError' && error.message.includes( 'network' ) ) {
		return true;
	}

	// Check for timeout errors
	if ( error.code === 'ETIMEDOUT' || error.message.includes( 'timeout' ) ) {
		return true;
	}

	return false;
};

/**
 * Generates blog post content from a title using AI.
 *
 * This function calls the server's generate-content-from-title endpoint with:
 * - Exponential backoff retry (3 attempts) for 5xx errors
 * - AbortController support for cancellation
 * - Distinct handling of 402 insufficient_tokens errors
 * - Comprehensive error handling and validation
 *
 * @param {string}          title             - The blog post title
 * @param {Object}          [options={}]      - Generation options
 * @param {AbortController} [abortController] - Optional AbortController for cancellation
 * @return {Promise<Object>} - The generated content response
 * @throws {InsufficientTokensError} When tokens are insufficient (402)
 * @throws {ApiRequestError} For other API errors
 * @throws {Error} For validation errors
 *
 * @example
 * // Basic usage
 * try {
 *   const result = await callGenerateContent('10 Tips for Better Sleep', {
 *     site_title: 'Health Blog',
 *     image_count: 2
 *   });
 *   console.log(result.blocks);
 * } catch (error) {
 *   if (error instanceof InsufficientTokensError) {
 *     alert('Please top up your tokens to continue');
 *   } else {
 *     console.error('Generation failed:', error.message);
 *   }
 * }
 *
 * @example
 * // With cancellation
 * const controller = new AbortController();
 * const promise = callGenerateContent('My Title', {}, controller);
 *
 * // Later, to cancel:
 * controller.abort();
 */
const callGenerateContent = async ( title, options = {}, abortController = null ) => {
	// Validate inputs
	validateTitle( title );
	const normalizedOptions = validateAndNormalizeOptions( options );

	// Create AbortController if not provided
	const controller = abortController || new AbortController();
	const { signal } = controller;

	// Retry configuration
	const maxRetries = 3;
	const baseDelay = 1000; // 1 second

	let lastError;

	for ( let attempt = 1; attempt <= maxRetries; attempt++ ) {
		try {
			// Make the API request
			const response = await makeApiRequest( title, normalizedOptions, signal );

			// Validate response structure
			if ( ! response || typeof response !== 'object' ) {
				throw new ApiRequestError(
					'Invalid response format from server',
					500,
					'invalid_response',
					response
				);
			}

			if ( ! Array.isArray( response.blocks ) ) {
				throw new ApiRequestError(
					'Response missing required blocks array',
					500,
					'missing_blocks',
					response
				);
			}

			// Success - return the response
			return response;
		} catch ( error ) {
			// Handle abort
			if ( error.name === 'AbortError' ) {
				throw new Error( 'Content generation was cancelled' );
			}

			// Handle insufficient tokens (402) - don't retry
			if ( error.data && error.data.code === 'insufficient_tokens' ) {
				throw new InsufficientTokensError(
					error.message || 'Insufficient tokens to generate content. Please top up your tokens to continue.',
					error.data.token_data || { total: 0, remaining: 0 }
				);
			}

			// Store error for potential final throw
			lastError = error;

			// Check if error is retryable
			if ( ! isRetryableError( error ) ) {
				// Non-retryable error - throw immediately
				if ( error instanceof ApiRequestError ) {
					throw error;
				}

				throw new ApiRequestError(
					error.message || 'Content generation failed',
					error.status || 500,
					error.code || 'generation_failed',
					error.data || null
				);
			}

			// Don't retry on last attempt
			if ( attempt === maxRetries ) {
				break;
			}

			// Calculate exponential backoff delay
			const delayMs = baseDelay * Math.pow( 2, attempt - 1 );

			console.warn( `API request failed (attempt ${ attempt }/${ maxRetries }), retrying in ${ delayMs }ms...`, error );

			// Wait before retrying
			await delay( delayMs );
		}
	}

	// All retries exhausted - throw the last error
	throw new ApiRequestError(
		lastError.message || 'Content generation failed after multiple retries',
		lastError.status || 500,
		lastError.code || 'max_retries_exceeded',
		lastError.data || null
	);
};

export { callGenerateContent, InsufficientTokensError, ApiRequestError };
