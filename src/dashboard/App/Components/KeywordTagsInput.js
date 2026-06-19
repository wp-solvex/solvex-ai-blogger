import React, { useMemo, useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';

/**
 * Recommended maximum number of keywords before we nudge the user.
 *
 * @type {number}
 */
const RECOMMENDED_MAX = 5;

/**
 * Parse a comma-separated keyword string into a de-duplicated array.
 *
 * De-duplication is case-insensitive and keeps the first occurrence's casing.
 *
 * @param {string} str The comma-separated keywords.
 * @return {string[]} The cleaned, unique keyword list.
 */
export const parseKeywords = ( str ) => {
	if ( ! str || typeof str !== 'string' ) {
		return [];
	}

	const seen = new Set();
	const out = [];

	str.split( ',' ).forEach( ( raw ) => {
		const keyword = raw.trim();
		if ( ! keyword ) {
			return;
		}
		const key = keyword.toLowerCase();
		if ( seen.has( key ) ) {
			return;
		}
		seen.add( key );
		out.push( keyword );
	} );

	return out;
};

/**
 * Merge two keyword strings into a single de-duplicated comma-separated string.
 *
 * @param {string} existing The existing keywords.
 * @param {string} incoming The keywords to merge in.
 * @return {string} The merged, de-duplicated comma-separated string.
 */
export const mergeKeywords = ( existing, incoming ) => {
	return parseKeywords( `${ existing || '' },${ incoming || '' }` ).join( ', ' );
};

/**
 * Controlled tag/chip input for campaign keywords.
 *
 * The first keyword is treated as the primary keyword (positional). Supports
 * add via Enter/comma, remove via the × button or Backspace, case-insensitive
 * de-duplication, promoting a keyword to primary, and a soft 5-keyword notice.
 *
 * @param {Object}   props            Component props.
 * @param {string}   props.value      Comma-separated keywords.
 * @param {Function} props.onChange   Called with the updated comma-separated string.
 * @param {boolean}  [props.disabled] Render read-only when true.
 * @param {boolean}  [props.hasError] Apply error styling when true.
 * @return {JSX.Element} The keyword tags input.
 */
const KeywordTagsInput = ( { value, onChange, disabled = false, hasError = false } ) => {
	const tags = useMemo( () => parseKeywords( value ), [ value ] );
	const [ inputValue, setInputValue ] = useState( '' );

	const commit = useCallback( ( arr ) => {
		onChange( arr.join( ', ' ) );
	}, [ onChange ] );

	const addKeyword = useCallback( ( raw ) => {
		const parts = String( raw ).split( ',' ).map( ( p ) => p.trim() ).filter( Boolean );
		if ( parts.length === 0 ) {
			setInputValue( '' );
			return;
		}

		const next = [ ...tags ];
		parts.forEach( ( keyword ) => {
			if ( ! next.some( ( t ) => t.toLowerCase() === keyword.toLowerCase() ) ) {
				next.push( keyword );
			}
		} );

		commit( next );
		setInputValue( '' );
	}, [ tags, commit ] );

	const removeKeyword = useCallback( ( index ) => {
		commit( tags.filter( ( _, i ) => i !== index ) );
	}, [ tags, commit ] );

	const makePrimary = useCallback( ( index ) => {
		if ( index <= 0 ) {
			return;
		}
		const next = [ ...tags ];
		const [ moved ] = next.splice( index, 1 );
		next.unshift( moved );
		commit( next );
	}, [ tags, commit ] );

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' || e.key === ',' ) {
			e.preventDefault();
			addKeyword( inputValue );
		} else if ( e.key === 'Backspace' && inputValue === '' && tags.length > 0 ) {
			e.preventDefault();
			removeKeyword( tags.length - 1 );
		}
	};

	const overLimit = tags.length > RECOMMENDED_MAX;

	const containerClasses = `flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200 outline outline-1 -outline-offset-1 ${
		hasError
			? 'bg-red-50 outline-red-300 focus-within:outline-red-500'
			: disabled
				? 'bg-gray-50 outline-gray-200'
				: 'bg-white outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-brand'
	}`;

	return (
		<div>
			<div className={ containerClasses }>
				{ tags.map( ( tag, index ) => {
					const isPrimary = index === 0;
					return (
						<span
							key={ `${ tag }-${ index }` }
							className="group relative inline-flex items-center gap-1.5 rounded-md bg-brand-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-brand-700"
						>
							<span className="max-w-[16rem] truncate">{ tag }</span>

							{ isPrimary && (
								<span className="inline-flex items-center rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
									{ __( 'Primary', 'solvex-ai-blogger' ) }
								</span>
							) }

							{ ! disabled && (
								<button
									type="button"
									onClick={ () => removeKeyword( index ) }
									aria-label={ __( 'Remove keyword', 'solvex-ai-blogger' ) + `: ${ tag }` }
									className="inline-flex flex-shrink-0 cursor-pointer items-center justify-center text-brand-500 transition-colors hover:text-brand-900"
								>
									<X className="h-4 w-4" strokeWidth={ 2.5 } aria-hidden="true" />
								</button>
							) }

							{ ! isPrimary && ! disabled && (
								<span className="absolute bottom-full left-1/2 z-20 hidden -translate-x-1/2 pb-1.5 group-hover:block group-focus-within:block">
									<span className="relative block">
										<button
											type="button"
											onClick={ () => makePrimary( index ) }
											className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-brand px-2.5 py-1 text-[10px] font-semibold text-white shadow-md ring-1 ring-black/10 transition-colors hover:bg-brand-700"
										>
											{ __( 'Make Primary', 'solvex-ai-blogger' ) }
										</button>
										<span
											className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2"
											style={ {
												borderLeft: '5px solid transparent',
												borderRight: '5px solid transparent',
												borderTop: '5px solid #9138c8',
											} }
											aria-hidden="true"
										/>
									</span>
								</span>
							) }
						</span>
					);
				} ) }

				{ ! disabled && (
					<input
						type="text"
						value={ inputValue }
						onChange={ ( e ) => setInputValue( e.target.value ) }
						onKeyDown={ handleKeyDown }
						onBlur={ () => addKeyword( inputValue ) }
						className="gsc-tag-input min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
						placeholder={ tags.length === 0 ? __( 'Type a keyword and press Enter', 'solvex-ai-blogger' ) : '' }
					/>
				) }
			</div>

			{ overLimit && (
				<p className="text-xs text-amber-600" style={ { marginTop: '5px' } }>
					{ __( 'For best results, keep it to 5 keywords or fewer, more can dilute SEO targeting and content focus.', 'solvex-ai-blogger' ) }
				</p>
			) }
		</div>
	);
};

export default KeywordTagsInput;
