/**
 * Image Search Terms Editor Component.
 *
 * Displays imageSearchTerms as editable chips with optional POST back to server.
 *
 * @package
 * @since x.x.x
 */

import React, { useState, useRef, useEffect } from 'react';

/**
 * Single editable chip component.
 *
 * @param {Object}   props            - Component props
 * @param {string}   props.term       - Search term
 * @param {number}   props.index      - Term index
 * @param {Function} props.onEdit     - Edit callback
 * @param {Function} props.onDelete   - Delete callback
 * @param {boolean}  [props.disabled] - Disabled state
 * @return {JSX.Element} Editable chip
 */
const EditableChip = ( { term, index, onEdit, onDelete, disabled = false } ) => {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editValue, setEditValue ] = useState( term );
	const inputRef = useRef( null );

	// Focus input when entering edit mode
	useEffect( () => {
		if ( isEditing && inputRef.current ) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [ isEditing ] );

	/**
	 * Handles save action.
	 */
	const handleSave = () => {
		const trimmed = editValue.trim();

		if ( ! trimmed ) {
			// Empty value - cancel edit
			setEditValue( term );
			setIsEditing( false );
			return;
		}

		if ( trimmed !== term ) {
			onEdit( index, trimmed );
		}

		setIsEditing( false );
	};

	/**
	 * Handles cancel action.
	 */
	const handleCancel = () => {
		setEditValue( term );
		setIsEditing( false );
	};

	/**
	 * Handles key press in edit mode.
	 *
	 * @param {Object} e
	 */
	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleSave();
		} else if ( e.key === 'Escape' ) {
			e.preventDefault();
			handleCancel();
		}
	};

	if ( isEditing ) {
		return (
			<div className="image-search-term-chip editing">
				<input
					ref={ inputRef }
					type="text"
					value={ editValue }
					onChange={ ( e ) => setEditValue( e.target.value ) }
					onKeyDown={ handleKeyDown }
					onBlur={ handleSave }
					disabled={ disabled }
					className="chip-edit-input"
					maxLength={ 100 }
				/>
			</div>
		);
	}

	return (
		<div className="image-search-term-chip">
			<span className="chip-text" onClick={ () => ! disabled && setIsEditing( true ) }>
				{ term }
			</span>
			<button
				type="button"
				className="chip-edit-button"
				onClick={ () => setIsEditing( true ) }
				disabled={ disabled }
				aria-label="Edit term"
				title="Click to edit"
			>
				✏️
			</button>
			<button
				type="button"
				className="chip-delete-button"
				onClick={ () => onDelete( index ) }
				disabled={ disabled }
				aria-label="Delete term"
				title="Remove term"
			>
				×
			</button>
		</div>
	);
};

/**
 * Image Search Terms editor component.
 *
 * @param {Object}   props                  - Component props
 * @param {string[]} props.terms            - Array of search terms
 * @param {Function} props.onChange         - Change callback (newTerms)
 * @param {Function} [props.onSave]         - Optional save callback (calls server)
 * @param {number}   [props.maxTerms]       - Maximum number of terms
 * @param {boolean}  [props.disabled]       - Disabled state
 * @param {boolean}  [props.showSaveButton] - Show save to server button
 * @return {JSX.Element} Image search terms editor
 */
const ImageSearchTermsEditor = ( {
	terms = [],
	onChange,
	onSave,
	maxTerms = 10,
	disabled = false,
	showSaveButton = false,
} ) => {
	const [ localTerms, setLocalTerms ] = useState( terms );
	const [ newTerm, setNewTerm ] = useState( '' );
	const [ hasChanges, setHasChanges ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );

	// Update local terms when props change
	useEffect( () => {
		setLocalTerms( terms );
		setHasChanges( false );
	}, [ terms ] );

	/**
	 * Handles term edit.
	 *
	 * @param {number} index
	 * @param {string} newValue
	 */
	const handleEdit = ( index, newValue ) => {
		const updated = [ ...localTerms ];
		updated[ index ] = newValue;
		setLocalTerms( updated );
		setHasChanges( true );
		onChange( updated );
	};

	/**
	 * Handles term deletion.
	 *
	 * @param {number} index
	 */
	const handleDelete = ( index ) => {
		const updated = localTerms.filter( ( _, i ) => i !== index );
		setLocalTerms( updated );
		setHasChanges( true );
		onChange( updated );
	};

	/**
	 * Handles adding a new term.
	 */
	const handleAdd = () => {
		const trimmed = newTerm.trim();

		if ( ! trimmed ) {
			return;
		}

		if ( localTerms.length >= maxTerms ) {
			alert( `Maximum ${ maxTerms } terms allowed.` );
			return;
		}

		if ( localTerms.includes( trimmed ) ) {
			alert( 'This term already exists.' );
			return;
		}

		const updated = [ ...localTerms, trimmed ];
		setLocalTerms( updated );
		setNewTerm( '' );
		setHasChanges( true );
		onChange( updated );
	};

	/**
	 * Handles key press in add input.
	 *
	 * @param {Object} e
	 */
	const handleAddKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			handleAdd();
		}
	};

	/**
	 * Handles save to server.
	 */
	const handleSaveToServer = async () => {
		if ( ! onSave || ! hasChanges ) {
			return;
		}

		setIsSaving( true );

		try {
			await onSave( localTerms );
			setHasChanges( false );
		} catch ( error ) {
			console.error( 'Failed to save terms:', error );
			alert( 'Failed to save terms. Please try again.' );
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<div className="image-search-terms-editor">
			<div className="search-terms-header">
				<h4>Image Search Terms</h4>
				{ localTerms.length > 0 && (
					<span className="terms-count">
						{ localTerms.length } { localTerms.length === 1 ? 'term' : 'terms' }
					</span>
				) }
			</div>

			{ localTerms.length > 0 ? (
				<div className="search-terms-list">
					{ localTerms.map( ( term, index ) => (
						<EditableChip
							key={ `term-${ index }` }
							term={ term }
							index={ index }
							onEdit={ handleEdit }
							onDelete={ handleDelete }
							disabled={ disabled || isSaving }
						/>
					) ) }
				</div>
			) : (
				<div className="search-terms-empty">
					<p>No image search terms available.</p>
				</div>
			) }

			{ localTerms.length < maxTerms && (
				<div className="search-terms-add">
					<input
						type="text"
						value={ newTerm }
						onChange={ ( e ) => setNewTerm( e.target.value ) }
						onKeyDown={ handleAddKeyDown }
						placeholder="Add new search term..."
						disabled={ disabled || isSaving }
						className="add-term-input"
						maxLength={ 100 }
					/>
					<button
						type="button"
						onClick={ handleAdd }
						disabled={ disabled || isSaving || ! newTerm.trim() }
						className="add-term-button"
					>
						Add Term
					</button>
				</div>
			) }

			{ showSaveButton && onSave && (
				<div className="search-terms-actions">
					<button
						type="button"
						onClick={ handleSaveToServer }
						disabled={ disabled || isSaving || ! hasChanges }
						className="save-terms-button"
					>
						{ isSaving ? 'Saving...' : 'Save Changes to Server' }
					</button>
					{ hasChanges && (
						<span className="unsaved-changes-indicator">
							Unsaved changes
						</span>
					) }
				</div>
			) }

			<div className="search-terms-help">
				<p>
					<small>
						These terms will be used to fetch images from Pixabay/Unsplash.
						Click a term to edit, or add new terms (max { maxTerms }).
					</small>
				</p>
			</div>
		</div>
	);
};

/**
 * Compact chip list component (read-only display).
 *
 * @param {Object}   props             - Component props
 * @param {string[]} props.terms       - Array of search terms
 * @param {string}   [props.className] - Additional CSS class
 * @return {JSX.Element} Compact chip list
 */
const ImageSearchTermsDisplay = ( { terms = [], className = '' } ) => {
	if ( ! terms || terms.length === 0 ) {
		return null;
	}

	return (
		<div className={ `image-search-terms-display ${ className }` }>
			<strong>Image Search Terms:</strong>
			<div className="terms-chips">
				{ terms.map( ( term, index ) => (
					<span key={ `term-${ index }` } className="term-chip">
						{ term }
					</span>
				) ) }
			</div>
		</div>
	);
};

export { ImageSearchTermsEditor, ImageSearchTermsDisplay, EditableChip };
