import { forwardRef } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';

/**
 * Enhanced SettingsContainer component with better layout and accessibility
 */
const SettingsContainer = forwardRef( ( {
	title,
	description,
	element,
	children,
	variant = 'default',
	spacing = 'default',
	shadow = true,
	border = true,
	className = '',
	headerClassName = '',
	contentClassName = '',
	titleLevel = 2,
	id,
	'aria-labelledby': ariaLabelledBy,
	'aria-describedby': ariaDescribedBy,
	...props
}, ref ) => {
	// Use children if provided, otherwise fall back to element
	const content = children || element;

	// Early return if no content
	if ( ! content ) {
		return null;
	}

	// Variant styles
	const variants = {
		default: 'bg-white',
		muted: 'bg-slate-50',
		bordered: 'bg-white border-2',
		elevated: 'bg-white shadow-lg',
		transparent: 'bg-transparent',
	};

	// Spacing variants
	const spacings = {
		none: 'p-0',
		small: 'p-3',
		default: 'p-6',
		large: 'p-8',
		xl: 'p-10',
	};

	// Generate IDs for accessibility
	const containerId = id || `settings-container-${ Math.random().toString( 36 ).substr( 2, 9 ) }`;
	const titleId = title ? `${ containerId }-title` : undefined;
	const descriptionId = description ? `${ containerId }-description` : undefined;

	// Determine title tag
	const TitleTag = `h${ Math.min( Math.max( titleLevel, 1 ), 6 ) }`;

	// Container classes
	const containerClasses = aiClassNames(
		// Base classes
		'settings-container rounded-md flex flex-col',
		// Variant
		variants[ variant ] || variants.default,
		// Shadow
		shadow && variant !== 'elevated' ? 'shadow-sm' : '',
		// Border
		border && ! variants[ variant ]?.includes( 'border' ) ? 'border border-slate-200' : '',
		// Custom className
		className
	);

	// Header classes
	const headerClasses = aiClassNames(
		'flex flex-col gap-2 mb-4',
		headerClassName
	);

	// Content classes
	const contentClasses = aiClassNames(
		'flex flex-col gap-4',
		spacings[ spacing ] || spacings.default,
		contentClassName
	);

	return (
		<section
			ref={ ref }
			id={ containerId }
			className="settings-section"
			aria-labelledby={ ariaLabelledBy || titleId }
			aria-describedby={ ariaDescribedBy || descriptionId }
			{ ...props }
		>
			{ ( title || description ) && (
				<header className={ headerClasses }>
					{ title && (
						<TitleTag
							id={ titleId }
							className="text-base font-semibold text-slate-900 leading-7 p-0 m-0"
						>
							{ title }
						</TitleTag>
					) }

					{ description && (
						<p
							id={ descriptionId }
							className="text-sm text-slate-500 leading-6 m-0"
						>
							{ description }
						</p>
					) }
				</header>
			) }

			<div className={ containerClasses }>
				<div className={ contentClasses }>
					{ content }
				</div>
			</div>
		</section>
	);
} );

SettingsContainer.displayName = 'SettingsContainer';

export default SettingsContainer;
