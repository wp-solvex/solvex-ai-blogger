import { forwardRef } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';

/**
 * Enhanced SettingDescription component with better typography and accessibility
 */
const SettingDescription = forwardRef( ( {
	description,
	children,
	size = 'default',
	color = 'muted',
	className = '',
	id,
	'aria-live': ariaLive,
	...props
}, ref ) => {
	// Use children if provided, otherwise fall back to description
	const content = children || description;

	// Early return if no content
	if ( ! content ) {
		return null;
	}

	// Size variants
	const sizes = {
		small: 'text-xs leading-4',
		default: 'text-sm leading-5',
		large: 'text-base leading-6',
	};

	// Color variants
	const colors = {
		muted: 'text-slate-500',
		default: 'text-slate-600',
		dark: 'text-slate-700',
		light: 'text-slate-400',
		primary: 'text-indigo-600',
		error: 'text-red-600',
		success: 'text-green-600',
		warning: 'text-yellow-600',
	};

	// Combine classes
	const descriptionClasses = aiClassNames(
		// Base classes
		'font-normal m-0 p-0 setting-description',
		// Size
		sizes[ size ] || sizes.default,
		// Color
		colors[ color ] || colors.muted,
		// Custom className
		className
	);

	return (
		<p
			ref={ ref }
			id={ id }
			className={ descriptionClasses }
			aria-live={ ariaLive }
			{ ...props }
		>
			{ content }
		</p>
	);
} );

SettingDescription.displayName = 'SettingDescription';

export default SettingDescription;
