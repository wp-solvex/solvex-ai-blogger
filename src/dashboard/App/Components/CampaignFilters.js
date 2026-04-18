import React, { useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { ChevronDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';

/**
 * CampaignFilters component for sorting and searching campaigns
 *
 * @param {Object}   props                      - Component props
 * @param {string}   props.sortBy               - Current sort option
 * @param {Function} props.onSortChange         - Callback when sort option changes
 * @param {string}   props.searchTerm           - Current search term
 * @param {Function} props.onSearchChange       - Callback when search term changes
 * @param {boolean}  props.showSortDropdown     - Whether sort dropdown is open
 * @param {Function} props.onToggleSortDropdown - Callback to toggle sort dropdown
 * @param {Array}    props.sortOptions          - Array of sort options (optional, uses default if not provided)
 */
const CampaignFilters = ( {
	sortBy,
	onSortChange,
	searchTerm,
	onSearchChange,
	showSortDropdown,
	onToggleSortDropdown,
	sortOptions: customSortOptions,
} ) => {
	const sortDropdownRef = useRef( null );

	// Default sort options
	const defaultSortOptions = [
		{ value: 'latest', label: __( 'Default', 'auto-ai-blogger' ) },
		{ value: 'active', label: __( 'Active First', 'auto-ai-blogger' ) },
		{ value: 'inactive', label: __( 'Inactive First', 'auto-ai-blogger' ) },
		{
			value: 'name-asc',
			label: (
				<span className="flex items-center gap-2">
					{ __( 'Name', 'auto-ai-blogger' ) }
					<ArrowUp className="w-3 h-3" />
				</span>
			),
		},
		{
			value: 'name-desc',
			label: (
				<span className="flex items-center gap-2">
					{ __( 'Name', 'auto-ai-blogger' ) }
					<ArrowDown className="w-3 h-3" />
				</span>
			),
		},
		{
			value: 'start-date-asc',
			label: (
				<span className="flex items-center gap-2">
					{ __( 'Start Date', 'auto-ai-blogger' ) }
					<ArrowUp className="w-3 h-3" />
				</span>
			),
		},
		{
			value: 'start-date-desc',
			label: (
				<span className="flex items-center gap-2">
					{ __( 'Start Date', 'auto-ai-blogger' ) }
					<ArrowDown className="w-3 h-3" />
				</span>
			),
		},
		{
			value: 'end-date-asc',
			label: (
				<span className="flex items-center gap-2">
					{ __( 'Last Run', 'auto-ai-blogger' ) }
					<ArrowUp className="w-3 h-3" />
				</span>
			),
		},
		{
			value: 'end-date-desc',
			label: (
				<span className="flex items-center gap-2">
					{ __( 'Last Run', 'auto-ai-blogger' ) }
					<ArrowDown className="w-3 h-3" />
				</span>
			),
		},
	];

	const sortOptions = customSortOptions || defaultSortOptions;

	// Close dropdown when clicking outside
	useEffect( () => {
		const handleClickOutside = ( event ) => {
			if ( sortDropdownRef.current && ! sortDropdownRef.current.contains( event.target ) ) {
				if ( showSortDropdown ) {
					onToggleSortDropdown( false );
				}
			}
		};

		document.addEventListener( 'mousedown', handleClickOutside );
		return () => {
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	}, [ showSortDropdown, onToggleSortDropdown ] );

	const handleSortOptionClick = ( value ) => {
		onSortChange( value );
		onToggleSortDropdown( false );
	};

	return (
		<div className="flex items-center gap-3">
			{ /* Sort Dropdown */ }
			<div className="relative" ref={ sortDropdownRef }>
				<button
					type="button"
					onClick={ () => onToggleSortDropdown( ! showSortDropdown ) }
					className="flex items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-inset focus:ring-brand-600 border-none cursor-pointer outline-none transition-all duration-200"
					style={ { height: '38px' } }
				>
					{ sortOptions.find( ( option ) => option.value === sortBy )?.label || __( 'Sort', 'auto-ai-blogger' ) }
					<ChevronDown className={ `w-4 h-4 transition-transform duration-200 ${ showSortDropdown ? 'rotate-180' : '' }` } />
				</button>

				{ showSortDropdown && (
					<div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
						<div className="py-1">
							{ sortOptions.map( ( option ) => (
								<button
									key={ option.value }
									onClick={ () => handleSortOptionClick( option.value ) }
									className={ `block w-full text-left px-4 py-2 text-sm transition-colors duration-200 border-none bg-transparent cursor-pointer ${
										sortBy === option.value
											? 'bg-brand-50 text-brand-700 font-medium'
											: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
									}` }
								>
									{ option.label }
								</button>
							) ) }
						</div>
					</div>
				) }
			</div>

			{ /* Search Input */ }
			<div className="relative min-w-[240px]">
				<div className="absolute inset-y-0 left-0 flex items-center pointer-events-none" style={ { paddingLeft: '12px' } }>
					<Search className="h-4 w-4 text-gray-400" />
				</div>
				<input
					type="text"
					value={ searchTerm }
					onChange={ ( e ) => onSearchChange( e.target.value ) }
					placeholder={ __( 'Search campaigns…', 'auto-ai-blogger' ) }
					className="block w-full text-sm rounded-md bg-white placeholder-gray-400 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-inset focus:ring-brand-600 outline-none transition-all duration-200"
					style={ {
						height: '38px',
						paddingLeft: '40px',
						paddingRight: searchTerm ? '40px' : '12px',
					} }
				/>
				{ searchTerm && (
					<button
						type="button"
						onClick={ () => onSearchChange( '' ) }
						className="absolute inset-y-0 right-0 flex items-center cursor-pointer border-none bg-transparent text-gray-400 hover:text-gray-600 transition-colors duration-200"
						style={ { paddingRight: '12px' } }
					>
						<X className="h-4 w-4" />
					</button>
				) }
			</div>
		</div>
	);
};

export default CampaignFilters;
