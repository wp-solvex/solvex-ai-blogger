/**
 * Block Preview Component - Safe text-only rendering of AI-generated blocks.
 *
 * Renders a preview list of blocks[] with NO raw HTML injection.
 * All content is extracted as plain text for security.
 *
 * @package
 * @since x.x.x
 */

import React from 'react';

/**
 * Strips HTML tags and returns plain text.
 *
 * @param {string} html - HTML string to strip
 * @return {string} Plain text
 */
const stripHtml = ( html ) => {
	if ( ! html || typeof html !== 'string' ) {
		return '';
	}

	// Create temporary element
	const tmp = document.createElement( 'div' );
	tmp.innerHTML = html;

	// Extract text content
	return tmp.textContent || tmp.innerText || '';
};

/**
 * Truncates text to specified length with ellipsis.
 *
 * @param {string} text      - Text to truncate
 * @param {number} maxLength - Maximum length
 * @return {string} Truncated text
 */
const truncateText = ( text, maxLength ) => {
	if ( ! text || text.length <= maxLength ) {
		return text;
	}

	return text.substring( 0, maxLength ).trim() + '...';
};

/**
 * Counts items in a list innerHTML (newline-separated).
 *
 * @param {string} innerHTML - List innerHTML
 * @return {number} Item count
 */
const countListItems = ( innerHTML ) => {
	if ( ! innerHTML ) {
		return 0;
	}

	const text = stripHtml( innerHTML );
	const items = text.split( '\n' ).filter( ( item ) => item.trim().length > 0 );

	return items.length;
};

/**
 * Preview component for a single heading block.
 *
 * @param {Object} props       - Component props
 * @param {Object} props.block - The heading block
 * @return {JSX.Element} Heading preview
 */
const HeadingBlockPreview = ( { block } ) => {
	const level = block.attrs?.level || 2;
	const text = stripHtml( block.innerHTML || '' );

	return (
		<div className="block-preview block-preview-heading">
			<span className="block-type-badge block-type-heading">
				H{ level }
			</span>
			<span className="block-content">
				{ text || '(Empty heading)' }
			</span>
		</div>
	);
};

/**
 * Preview component for a single paragraph block.
 *
 * @param {Object} props       - Component props
 * @param {Object} props.block - The paragraph block
 * @return {JSX.Element} Paragraph preview
 */
const ParagraphBlockPreview = ( { block } ) => {
	const text = stripHtml( block.innerHTML || '' );
	const preview = truncateText( text, 160 );

	return (
		<div className="block-preview block-preview-paragraph">
			<span className="block-type-badge block-type-paragraph">
				¶
			</span>
			<span className="block-content">
				{ preview || '(Empty paragraph)' }
			</span>
		</div>
	);
};

/**
 * Preview component for a single list block.
 *
 * @param {Object} props       - Component props
 * @param {Object} props.block - The list block
 * @return {JSX.Element} List preview
 */
const ListBlockPreview = ( { block } ) => {
	const itemCount = countListItems( block.innerHTML || '' );
	const isOrdered = block.attrs?.ordered || false;
	const listType = isOrdered ? 'Ordered' : 'Unordered';

	// Get first item as preview
	const text = stripHtml( block.innerHTML || '' );
	const items = text.split( '\n' ).filter( ( item ) => item.trim().length > 0 );
	const firstItem = items[ 0 ] || '';
	const preview = truncateText( firstItem, 80 );

	return (
		<div className="block-preview block-preview-list">
			<span className="block-type-badge block-type-list">
				{ isOrdered ? '1.' : '•' }
			</span>
			<span className="block-content">
				<strong>{ listType } List ({ itemCount } items)</strong>
				{ preview && (
					<span className="block-preview-text">
						<br />
						{ preview }
						{ itemCount > 1 && ' ...' }
					</span>
				) }
			</span>
		</div>
	);
};

/**
 * Preview component for a single quote block.
 *
 * @param {Object} props       - Component props
 * @param {Object} props.block - The quote block
 * @return {JSX.Element} Quote preview
 */
const QuoteBlockPreview = ( { block } ) => {
	const text = stripHtml( block.innerHTML || '' );
	const firstLine = text.split( '\n' )[ 0 ] || '';
	const preview = truncateText( firstLine, 100 );

	return (
		<div className="block-preview block-preview-quote">
			<span className="block-type-badge block-type-quote">
				{ '"' }
			</span>
			<span className="block-content block-content-quote">
				{ preview || '(Empty quote)' }
			</span>
		</div>
	);
};

/**
 * Preview component for an image placeholder block.
 *
 * @param {Object} props       - Component props
 * @param {number} props.index - Image index
 * @return {JSX.Element} Image placeholder preview
 */
const ImagePlaceholderPreview = ( { index } ) => {
	return (
		<div className="block-preview block-preview-image-placeholder">
			<span className="block-type-badge block-type-image">
				📷
			</span>
			<span className="block-content">
				<span className="image-placeholder-tag">
					Image Placeholder #{ index + 1 }
				</span>
			</span>
		</div>
	);
};

/**
 * Main BlockPreview component - renders a list of blocks safely.
 *
 * @param {Object} props             - Component props
 * @param {Object} props.blocks      - Array of blocks to preview
 * @param {string} [props.className] - Additional CSS class
 * @return {JSX.Element} Block previews
 */
const BlockPreview = ( { blocks, className = '' } ) => {
	if ( ! blocks || ! Array.isArray( blocks ) || blocks.length === 0 ) {
		return (
			<div className={ `block-preview-empty ${ className }` }>
				<p>No content blocks to preview.</p>
			</div>
		);
	}

	// Track image placeholder indices
	let imagePlaceholderIndex = 0;

	return (
		<div className={ `block-preview-list ${ className }` }>
			{ blocks.map( ( block, index ) => {
				const key = `block-preview-${ index }`;

				// Render based on block type
				switch ( block.blockName ) {
					case 'core/heading':
						return <HeadingBlockPreview key={ key } block={ block } />;

					case 'core/paragraph':
						return <ParagraphBlockPreview key={ key } block={ block } />;

					case 'core/list':
						return <ListBlockPreview key={ key } block={ block } />;

					case 'core/quote':
						return <QuoteBlockPreview key={ key } block={ block } />;

					case 'core/image_placeholder':
						return (
							<ImagePlaceholderPreview
								key={ key }
								index={ imagePlaceholderIndex++ }
							/>
						);

					default:
						// Unknown block type - show type only
						return (
							<div key={ key } className="block-preview block-preview-unknown">
								<span className="block-type-badge block-type-unknown">
									?
								</span>
								<span className="block-content">
									Unknown block type: { block.blockName }
								</span>
							</div>
						);
				}
			} ) }
		</div>
	);
};

/**
 * Block statistics component - shows counts and metrics.
 *
 * @param {Object} props        - Component props
 * @param {Object} props.blocks - Array of blocks
 * @return {JSX.Element} Block statistics
 */
const BlockStatistics = ( { blocks } ) => {
	if ( ! blocks || ! Array.isArray( blocks ) ) {
		return null;
	}

	const stats = {
		total: blocks.length,
		headings: 0,
		paragraphs: 0,
		lists: 0,
		quotes: 0,
		imagePlaceholders: 0,
	};

	blocks.forEach( ( block ) => {
		switch ( block.blockName ) {
			case 'core/heading':
				stats.headings++;
				break;
			case 'core/paragraph':
				stats.paragraphs++;
				break;
			case 'core/list':
				stats.lists++;
				break;
			case 'core/quote':
				stats.quotes++;
				break;
			case 'core/image_placeholder':
				stats.imagePlaceholders++;
				break;
		}
	} );

	return (
		<div className="block-statistics">
			<div className="block-stat">
				<strong>Total Blocks:</strong> { stats.total }
			</div>
			{ stats.headings > 0 && (
				<div className="block-stat">
					<strong>Headings:</strong> { stats.headings }
				</div>
			) }
			{ stats.paragraphs > 0 && (
				<div className="block-stat">
					<strong>Paragraphs:</strong> { stats.paragraphs }
				</div>
			) }
			{ stats.lists > 0 && (
				<div className="block-stat">
					<strong>Lists:</strong> { stats.lists }
				</div>
			) }
			{ stats.quotes > 0 && (
				<div className="block-stat">
					<strong>Quotes:</strong> { stats.quotes }
				</div>
			) }
			{ stats.imagePlaceholders > 0 && (
				<div className="block-stat">
					<strong>Image Placeholders:</strong> { stats.imagePlaceholders }
				</div>
			) }
		</div>
	);
};

export {
	BlockPreview,
	BlockStatistics,
	HeadingBlockPreview,
	ParagraphBlockPreview,
	ListBlockPreview,
	QuoteBlockPreview,
	ImagePlaceholderPreview,
	stripHtml,
	truncateText,
	countListItems,
};
