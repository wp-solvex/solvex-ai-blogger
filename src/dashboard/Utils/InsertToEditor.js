/**
 * Insert To Editor Utilities.
 *
 * Handles inserting server-generated Gutenberg markup into WordPress editor
 * with proper validation and image placeholder counting.
 *
 * @package
 * @since x.x.x
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * Counts occurrences of {{WP_AIB_IMAGE}} placeholders in markup.
 *
 * @param {string} markup - Gutenberg markup to analyze
 * @return {number} Number of image placeholders found
 */
const countImagePlaceholders = ( markup ) => {
	if ( ! markup || typeof markup !== 'string' ) {
		return 0;
	}

	// Count all occurrences of {{WP_AIB_IMAGE}}
	const matches = markup.match( /\{\{WP_AIB_IMAGE\}\}/g );
	return matches ? matches.length : 0;
};

/**
 * Validates image placeholder count matches requested count.
 *
 * @param {string} markup         - Gutenberg markup
 * @param {number} requestedCount - Requested image count
 * @return {Object} Validation result
 */
const validateImagePlaceholders = ( markup, requestedCount ) => {
	const actualCount = countImagePlaceholders( markup );

	return {
		valid: actualCount === requestedCount,
		actualCount,
		requestedCount,
		mismatch: actualCount !== requestedCount,
		missing: Math.max( 0, requestedCount - actualCount ),
		extra: Math.max( 0, actualCount - requestedCount ),
	};
};

/**
 * Creates a warning message for image placeholder mismatch.
 *
 * @param {Object} validation - Validation result
 * @return {string} Warning message
 */
const createMismatchWarning = ( validation ) => {
	if ( validation.valid ) {
		return '';
	}

	if ( validation.missing > 0 ) {
		return `Warning: Expected ${ validation.requestedCount } image placeholders, but found only ${ validation.actualCount }. ${ validation.missing } image(s) may be missing.`;
	}

	if ( validation.extra > 0 ) {
		return `Warning: Expected ${ validation.requestedCount } image placeholders, but found ${ validation.actualCount }. ${ validation.extra } extra placeholder(s) detected.`;
	}

	return 'Warning: Image placeholder count mismatch.';
};

/**
 * Inserts content into WordPress Classic Editor.
 *
 * @param {string} content - HTML content to insert
 * @return {boolean} Success status
 */
const insertIntoClassicEditor = ( content ) => {
	// Check if tinyMCE is available
	if ( typeof window.tinyMCE === 'undefined' ) {
		return false;
	}

	const editor = window.tinyMCE.get( 'content' );

	if ( ! editor ) {
		return false;
	}

	// Insert content at cursor position
	editor.execCommand( 'mceInsertContent', false, content );

	return true;
};

/**
 * Inserts content into WordPress Block Editor (Gutenberg).
 *
 * @param {string} markup - Gutenberg markup to insert
 * @return {boolean} Success status
 */
const insertIntoBlockEditor = ( markup ) => {
	// Check if wp.data is available
	if ( typeof window.wp === 'undefined' || ! window.wp.data ) {
		return false;
	}

	try {
		const { dispatch } = window.wp.data;
		const { parse } = window.wp.blocks;

		// Parse the markup into blocks
		const blocks = parse( markup );

		if ( ! blocks || blocks.length === 0 ) {
			console.error( 'Failed to parse blocks from markup' );
			return false;
		}

		// Get the editor store
		const editorStore = dispatch( 'core/block-editor' ) || dispatch( 'core/editor' );

		if ( ! editorStore ) {
			console.error( 'Block editor store not available' );
			return false;
		}

		// Insert blocks at the end
		editorStore.insertBlocks( blocks );

		return true;
	} catch ( error ) {
		console.error( 'Failed to insert blocks:', error );
		return false;
	}
};

/**
 * Detects which WordPress editor is active.
 *
 * @return {string} 'block' | 'classic' | 'unknown'
 */
const detectEditor = () => {
	// Check for Block Editor
	if ( typeof window.wp !== 'undefined' && window.wp.data && window.wp.blocks ) {
		return 'block';
	}

	// Check for Classic Editor
	if ( typeof window.tinyMCE !== 'undefined' ) {
		return 'classic';
	}

	return 'unknown';
};

/**
 * Inserts server-generated Gutenberg markup into the WordPress editor.
 *
 * This function:
 * 1. Uses server-generated markup (NO client-side HTML injection)
 * 2. Validates image placeholder count
 * 3. Detects and uses appropriate editor (Block or Classic)
 * 4. Returns validation warnings if any
 *
 * @param {Object} response                - API response from server
 * @param {number} [requestedImageCount=0] - Requested image count
 * @return {Object} Insert result
 */
const insertToEditor = ( response, requestedImageCount = 0 ) => {
	const result = {
		success: false,
		editor: 'unknown',
		validation: null,
		warning: null,
		error: null,
	};

	// Validate response
	if ( ! response || ! response.post_content ) {
		result.error = 'Invalid response: missing post_content';
		return result;
	}

	const { post_content: markup } = response;

	// Validate image placeholders
	result.validation = validateImagePlaceholders( markup, requestedImageCount );

	if ( result.validation.mismatch ) {
		result.warning = createMismatchWarning( result.validation );
	}

	// Detect editor
	result.editor = detectEditor();

	// Insert based on editor type
	switch ( result.editor ) {
		case 'block':
			result.success = insertIntoBlockEditor( markup );
			break;

		case 'classic':
			result.success = insertIntoClassicEditor( markup );
			break;

		default:
			result.error = 'No supported WordPress editor detected';
			result.success = false;
	}

	return result;
};

/**
 * Creates a post via AJAX using server-generated content.
 *
 * Alternative to direct editor insertion - creates a draft post.
 *
 * @param {string} title     - Post title
 * @param {Object} response  - API response
 * @param {Object} [options] - Additional options
 * @return {Promise<Object>} Created post data
 */
const createPostDraft = async ( title, response, options = {} ) => {
	if ( ! response || ! response.post_content ) {
		throw new Error( 'Invalid response: missing post_content' );
	}

	const formData = new FormData();
	formData.append( 'action', 'solvex_aib_create_post' );
	formData.append( 'security', options.nonce || solvex_aib_localized_data?.admin_nonce || '' );
	formData.append( 'title', title );
	formData.append( 'content', response.post_content );

	// Add images if available
	if ( response.images && response.images.length > 0 ) {
		formData.append( 'images', JSON.stringify( response.images ) );
	}

	try {
		const result = await apiFetch( {
			url: options.ajaxUrl || solvex_aib_localized_data?.ajax_url || '',
			method: 'POST',
			body: formData,
		} );

		if ( ! result.success ) {
			throw new Error( result.data?.message || 'Failed to create post' );
		}

		return result.data;
	} catch ( error ) {
		console.error( 'Failed to create post:', error );
		throw error;
	}
};

/**
 * Replaces image placeholders with actual image blocks.
 *
 * This should be called AFTER images are uploaded to media library.
 *
 * @param {string} markup - Gutenberg markup with {{WP_AIB_IMAGE}} placeholders
 * @param {Array}  images - Array of image data with attachment_id and src
 * @return {string} Markup with images inserted
 */
const replaceImagePlaceholders = ( markup, images ) => {
	if ( ! markup || ! images || images.length === 0 ) {
		return markup;
	}

	let updatedMarkup = markup;
	let imageIndex = 0;

	// Replace each {{WP_AIB_IMAGE}} with actual image block
	updatedMarkup = updatedMarkup.replace( /\{\{WP_AIB_IMAGE\}\}/g, () => {
		if ( imageIndex >= images.length ) {
			// No more images available
			return '<!-- wp:paragraph --><p><em>[Image unavailable]</em></p><!-- /wp:paragraph -->';
		}

		const image = images[ imageIndex++ ];
		const attachmentId = image.attachment_id || image.id || 0;
		const src = image.src || '';
		const alt = image.alt || '';

		// Build core/image block
		return `<!-- wp:image {"id":${ attachmentId }} -->\n` +
			   `<figure class="wp-block-image"><img src="${ src }" alt="${ alt }" class="wp-image-${ attachmentId }"/></figure>\n` +
			   `<!-- /wp:image -->`;
	} );

	return updatedMarkup;
};

export {
	insertToEditor,
	createPostDraft,
	countImagePlaceholders,
	validateImagePlaceholders,
	createMismatchWarning,
	replaceImagePlaceholders,
	detectEditor,
	insertIntoBlockEditor,
	insertIntoClassicEditor,
};
