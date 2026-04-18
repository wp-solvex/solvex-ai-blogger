import React, { memo } from 'react';

/**
 * Reusable InfoCard component for displaying informational content with optional lists
 *
 * @param {Object}          props                      - Component props
 * @param {React.Component} props.icon                 - Icon component to display
 * @param {string}          props.title                - Card title
 * @param {string}          [props.description]        - Optional description text
 * @param {Array<string>}   [props.items]              - Optional array of list items
 * @param {string}          [props.colorScheme='blue'] - Color scheme (blue, green, yellow, red, indigo, orange)
 * @param {string}          [props.className]          - Additional CSS classes
 * @param {Object}          [props.ariaLabel]          - Accessibility label
 */
const InfoCard = memo( ( {
	icon: Icon,
	title,
	description,
	items = [],
	colorScheme = 'blue',
	className = '',
	ariaLabel,
} ) => {
	// Color scheme mappings
	const colorClasses = {
		blue: {
			bg: 'bg-brand-50',
			border: 'border-brand-200',
			iconColor: 'text-brand-600',
			titleColor: 'text-brand-900',
			textColor: 'text-brand-700',
		},
		green: {
			bg: 'bg-green-50',
			border: 'border-green-200',
			iconColor: 'text-green-600',
			titleColor: 'text-green-900',
			textColor: 'text-green-700',
		},
		yellow: {
			bg: 'bg-yellow-50',
			border: 'border-yellow-200',
			iconColor: 'text-yellow-600',
			titleColor: 'text-yellow-900',
			textColor: 'text-yellow-700',
		},
		red: {
			bg: 'bg-red-50',
			border: 'border-red-200',
			iconColor: 'text-red-600',
			titleColor: 'text-red-900',
			textColor: 'text-red-700',
		},
		indigo: {
			bg: 'bg-indigo-50',
			border: 'border-indigo-200',
			iconColor: 'text-indigo-600',
			titleColor: 'text-indigo-900',
			textColor: 'text-indigo-700',
		},
		orange: {
			bg: 'bg-orange-50',
			border: 'border-orange-200',
			iconColor: 'text-orange-600',
			titleColor: 'text-orange-900',
			textColor: 'text-orange-700',
		},
	};

	const colors = colorClasses[ colorScheme ] || colorClasses.blue;

	return (
		<div
			className={ `p-4 ${ colors.bg } border ${ colors.border } rounded-lg ${ className }` }
			role="region"
			aria-label={ ariaLabel }
		>
			<div className="flex items-start gap-3">
				<Icon className={ `w-5 h-5 ${ colors.iconColor } flex-shrink-0` } aria-hidden="true" />
				<div className="flex-1">
					<h4 className={ `text-sm font-medium ${ colors.titleColor } mb-1 mt-0` }>
						{ title }
					</h4>

					{ description && (
						<p className={ `text-sm ${ colors.textColor } mb-2` }>
							{ description }
						</p>
					) }

					{ items.length > 0 && (
						<ul className={ `text-sm ${ colors.textColor } space-y-1 list-disc list-inside mt-2` }>
							{ items.map( ( item, index ) => (
								<li key={ index }>{ item }</li>
							) ) }
						</ul>
					) }
				</div>
			</div>
		</div>
	);
} );

InfoCard.displayName = 'InfoCard';

export default InfoCard;
