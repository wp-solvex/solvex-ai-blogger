import { forwardRef } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';
import { __ } from '@wordpress/i18n';

/**
 * Enhanced SettingLabel component with better accessibility and customization
 */
const SettingLabel = forwardRef( ( {
	htmlFor,
	forId, // Legacy prop for backward compatibility
	title,
	children,
	required = false,
	optional = false,
	size = 'default',
	weight = 'medium',
	color = 'default',
	className = '',
	disabled = false,
	tooltip,
	helpText,
	'aria-label': ariaLabel,
	...props
}, ref ) => {
	// Use children if provided, otherwise fall back to title
	const labelContent = children || title;

	// Early return if no content
	if ( ! labelContent ) {
		return null;
	}

	// Use htmlFor if provided, otherwise fall back to forId for backward compatibility
	const labelFor = htmlFor || forId;

	// Size variants
	const sizes = {
		small: 'text-xs',
		default: 'text-sm',
		large: 'text-base',
		xl: 'text-lg',
	};

	// Weight variants
	const weights = {
		normal: 'font-normal',
		medium: 'font-medium',
		semibold: 'font-semibold',
		bold: 'font-bold',
	};

	// Color variants
	const colors = {
		default: 'text-slate-700',
		muted: 'text-slate-500',
		dark: 'text-slate-900',
		light: 'text-slate-400',
		primary: 'text-indigo-700',
		error: 'text-red-700',
		success: 'text-green-700',
		warning: 'text-yellow-700',
	};

	// Combine classes
	const labelClasses = aiClassNames(
		// Base classes
		'block setting-label',
		// Size
		sizes[ size ] || sizes.default,
		// Weight
		weights[ weight ] || weights.medium,
		// Color
		colors[ color ] || colors.default,
		// Disabled state
		disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
		// Custom className
		className
	);

	return (
		<div className="setting-label-wrapper">
			<label
				ref={ ref }
				htmlFor={ labelFor }
				className={ labelClasses }
				aria-label={ ariaLabel }
				{ ...props }
			>
				<span className="flex items-center">
					{ labelContent }

					{ required && (
						<span
							className="ml-[2px] text-red-500"
							aria-label={ __( 'Required field', 'solvex-ai-blogger' ) }
							title={ __( 'This field is required', 'solvex-ai-blogger' ) }
						>
							*
						</span>
					) }

					{ optional && ! required && (
						<span
							className="ml-1 text-slate-400 text-xs font-normal"
							aria-label={ __( 'Optional field', 'solvex-ai-blogger' ) }
						>
							({ __( 'optional', 'solvex-ai-blogger' ) })
						</span>
					) }

					{ tooltip && (
						<span
							className="ml-2 inline-flex items-center justify-center w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help"
							title={ tooltip }
							aria-label={ tooltip }
						>
							<svg
								className="w-3 h-3 flex"
								fill="currentColor"
								viewBox="0 0 20 20"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
									clipRule="evenodd"
								/>
							</svg>
						</span>
					) }
				</span>
			</label>

			{ helpText && (
				<p className="mt-1 text-xs text-slate-500">
					{ helpText }
				</p>
			) }
		</div>
	);
} );

SettingLabel.displayName = 'SettingLabel';

export default SettingLabel;
