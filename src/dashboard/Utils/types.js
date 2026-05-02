/**
 * Type definitions for the AI Content Generation API.
 *
 * @package
 * @since x.x.x
 */

/**
 * @typedef {Object} HeadingBlock
 * @property {'core/heading'}          blockName    - Block type identifier
 * @property {2|3|4|5|6}               headingLevel - Heading level (H2-H6)
 * @property {string}                  innerHTML    - HTML content of the heading
 * @property {Record<string, unknown>} [attrs]      - Additional block attributes
 */

/**
 * @typedef {Object} ParagraphBlock
 * @property {'core/paragraph'}        blockName - Block type identifier
 * @property {string}                  innerHTML - HTML content of the paragraph
 * @property {Record<string, unknown>} [attrs]   - Additional block attributes
 */

/**
 * @typedef {Object} ListBlock
 * @property {'core/list'}             blockName - Block type identifier
 * @property {string}                  innerHTML - HTML content of the list
 * @property {Record<string, unknown>} [attrs]   - Additional block attributes
 */

/**
 * @typedef {Object} QuoteBlock
 * @property {'core/quote'}            blockName - Block type identifier
 * @property {string}                  innerHTML - HTML content of the quote
 * @property {Record<string, unknown>} [attrs]   - Additional block attributes
 */

/**
 * @typedef {Object} ImagePlaceholderBlock
 * @property {'core/image_placeholder'} blockName - Block type identifier
 * @property {Record<string, unknown>}  [attrs]   - Additional block attributes
 */

/**
 * @typedef {HeadingBlock|ParagraphBlock|ListBlock|QuoteBlock|ImagePlaceholderBlock} Block
 * Union type for all supported block types
 */

/**
 * @typedef {Object} ImageData
 * @property {number} [id]            - WordPress attachment ID
 * @property {number} [attachment_id] - Alternative attachment ID field
 * @property {string} [src]           - Image source URL
 * @property {string} [alt]           - Image alt text
 */

/**
 * @typedef {Object} TokenData
 * @property {number} total     - Total tokens available
 * @property {number} remaining - Remaining tokens
 */

/**
 * @typedef {Object} GenerateContentResponse
 * @property {Block[]}     blocks             - Array of content blocks
 * @property {string[]}    [imageSearchTerms] - Optional image search terms
 * @property {TokenData}   [token_data]       - Optional token usage data
 * @property {ImageData[]} [images]           - Optional image data
 */

/**
 * @typedef {Object} GenerateContentOptions
 * @property {string} [site_title]          - Site title for context
 * @property {string} [site_purpose]        - Site purpose for context
 * @property {string} [site_description]    - Site description for context
 * @property {number} [image_count=0]       - Number of images to generate
 * @property {number} [temperature=0.3]     - AI temperature (0-1)
 * @property {number} [harassment=2]        - Harassment safety level (0-4)
 * @property {number} [hate=2]              - Hate speech safety level (0-4)
 * @property {number} [sexually_explicit=2] - Sexually explicit safety level (0-4)
 * @property {number} [dangerous_content=2] - Dangerous content safety level (0-4)
 * @property {string} [license]             - License key for authentication
 */

/**
 * @typedef {Object} InsufficientTokensError
 * @property {string}    code         - Error code ('insufficient_tokens')
 * @property {string}    message      - Error message
 * @property {number}    status       - HTTP status code (402)
 * @property {TokenData} [token_data] - Token information
 */

/**
 * @typedef {Object} ApiError
 * @property {string} code    - Error code
 * @property {string} message - Error message
 * @property {number} status  - HTTP status code
 * @property {*}      [data]  - Additional error data
 */

export {};
