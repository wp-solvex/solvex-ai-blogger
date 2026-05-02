import { useMemo } from 'react';

/**
 * Trim text content by word count with enhanced functionality
 *
 * @param {string} text      - The text to trim
 * @param {number} wordLimit - Maximum number of words to display
 * @param {string} suffix    - Suffix to add when text is trimmed
 * @return {string} Trimmed text
 */
const TrimTextByWords = ( text, wordLimit = 40, suffix = '...' ) => {
	// Input validation
	if ( typeof text !== 'string' ) {
		return '';
	}

	if ( ! text.trim() ) {
		return '';
	}

	// Split by whitespace and filter out empty strings
	const words = text.trim().split( /\s+/ ).filter( Boolean );

	// Return original text if within limit
	if ( words.length <= wordLimit ) {
		return text;
	}

	// Join the limited words and add suffix
	return words.slice( 0, wordLimit ).join( ' ' ) + suffix;
};

/**
 * Enhanced TrimWordsContent component with better performance and accessibility
 *
 * @param {Object} props           - Component props
 * @param {string} props.content   - The content to trim
 * @param {number} props.count     - Number of words to display (default: 40)
 * @param {string} props.suffix    - Suffix when trimmed (default: '...')
 * @param {string} props.className - CSS class name
 * @param {string} props.title     - Title attribute for accessibility
 * @param {string} props.ariaLabel - ARIA label for screen readers
 * @return {JSX.Element} Trimmed content component
 */
const TrimWordsContent = ( {
	content = '',
	count = 40,
	suffix = '...',
	className = '',
	title = '',
	ariaLabel = '',
} ) => {
	// Memoize the trimmed content to prevent unnecessary recalculations
	const trimmedContent = useMemo( () => {
		return TrimTextByWords( content, count, suffix );
	}, [ content, count, suffix ] );

	// Determine if content was actually trimmed
	const isTrimmed = content.length > 0 && trimmedContent !== content;

	// Build accessibility attributes
	const accessibilityProps = {
		title: title || ( isTrimmed ? content : undefined ),
		'aria-label': ariaLabel || ( isTrimmed ? `Trimmed text. Full content: ${ content }` : undefined ),
	};

	return (
		<span
			className={ className }
			{ ...accessibilityProps }
		>
			{ trimmedContent }
		</span>
	);
};

/**
 * Hook version for use in other components
 *
 * @param {string} content - The content to trim
 * @param {number} count   - Number of words to display
 * @param {string} suffix  - Suffix when trimmed
 * @return {string} Trimmed content
 */
export const useTrimmedContent = ( content, count = 40, suffix = '...' ) => {
	return useMemo( () => {
		return TrimTextByWords( content, count, suffix );
	}, [ content, count, suffix ] );
};

/**
 * Utility function to get word count from text
 *
 * @param {string} text - Text to count words in
 * @return {number} Number of words
 */
export const getWordCount = ( text ) => {
	if ( typeof text !== 'string' || ! text.trim() ) {
		return 0;
	}
	return text.trim().split( /\s+/ ).filter( Boolean ).length;
};

/**
 * Utility function to trim by character count while preserving word boundaries
 *
 * @param {string} text      - Text to trim
 * @param {number} charLimit - Character limit
 * @param {string} suffix    - Suffix when trimmed
 * @return {string} Trimmed text
 */
export const trimTextByChars = ( text, charLimit = 200, suffix = '...' ) => {
	if ( typeof text !== 'string' || ! text.trim() ) {
		return '';
	}

	if ( text.length <= charLimit ) {
		return text;
	}

	// Find the last space before the character limit to avoid cutting words
	const trimmed = text.substring( 0, charLimit );
	const lastSpace = trimmed.lastIndexOf( ' ' );

	// If no space found, just cut at the limit
	const cutPoint = lastSpace > 0 ? lastSpace : charLimit;

	return text.substring( 0, cutPoint ) + suffix;
};

export { TrimWordsContent, TrimTextByWords };
