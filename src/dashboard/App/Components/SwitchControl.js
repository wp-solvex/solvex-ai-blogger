import { Switch } from '@headlessui/react';
import { forwardRef, useId } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';
import { __ } from '@wordpress/i18n';

/**
 * Enhanced Switch Control component with better accessibility and variants
 */
const SwitchControl = forwardRef( ( {
	checked = false,
	onChange,
	id,
	disabled = false,
	size = 'default',
	color = 'brand',
	label,
	description,
	error,
	required = false,
	'aria-label': ariaLabel,
	'aria-describedby': ariaDescribedBy,
	className = '',
}, ref ) => {
	const autoId = useId();
	const switchId = id || autoId;
	const descriptionId = description ? `${ switchId }-description` : undefined;
	const errorId = error ? `${ switchId }-error` : undefined;

	// Size variants
	const sizes = {
		small: {
			container: 'h-3 w-6',
			toggle: 'h-4 w-4',
			translate: checked ? 'translate-x-3' : 'translate-x-0',
		},
		default: {
			container: 'h-4 w-9',
			toggle: 'h-5 w-5',
			translate: checked ? 'translate-x-5' : 'translate-x-0',
		},
		large: {
			container: 'h-6 w-11',
			toggle: 'h-7 w-7',
			translate: checked ? 'translate-x-5' : 'translate-x-0',
		},
	};

	// Color variants
	const colors = {
		brand: {
			active: 'bg-brand focus:ring-brand',
			inactive: 'bg-slate-200',
		},
		indigo: {
			active: 'bg-indigo-600 focus:ring-indigo-600',
			inactive: 'bg-slate-200',
		},
		blue: {
			active: 'bg-blue-600 focus:ring-blue-600',
			inactive: 'bg-slate-200',
		},
		green: {
			active: 'bg-green-600 focus:ring-green-600',
			inactive: 'bg-slate-200',
		},
		red: {
			active: 'bg-red-600 focus:ring-red-600',
			inactive: 'bg-slate-200',
		},
	};

	const sizeConfig = sizes[ size ] || sizes.default;
	const colorConfig = colors[ color ] || colors.brand;

	// Build aria-describedby
	const describedBy = [
		ariaDescribedBy,
		descriptionId,
		errorId,
	].filter( Boolean ).join( ' ' ) || undefined;

	return (
		<div className={ `switch-control-wrapper ${ className }` }>
			{ label && (
				<label
					htmlFor={ switchId }
					className={ `block text-sm font-medium text-slate-700 mb-2 ${ required ? 'required' : '' }` }
				>
					{ label }
					{ required && (
						<span className="text-red-500 ml-1" aria-label={ __( 'Required', 'solvex-ai-blogger' ) }>
							*
						</span>
					) }
				</label>
			) }

			{ description && (
				<p
					id={ descriptionId }
					className="text-sm text-slate-600 mb-2"
				>
					{ description }
				</p>
			) }

			<Switch
				ref={ ref }
				id={ switchId }
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
				aria-label={ ariaLabel || label }
				aria-describedby={ describedBy }
				aria-required={ required }
				aria-invalid={ Boolean( error ) }
				className={ aiClassNames(
					// Base styles
					'group relative inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-none m-0 p-0 transition-colors duration-200 ease-in-out',
					// Size
					sizeConfig.container,
					// Color and state
					checked ? colorConfig.active : colorConfig.inactive,
					// Focus styles
					'focus:outline-none focus:ring-2 focus:ring-offset-2',
					// Disabled styles
					disabled ? 'opacity-50 cursor-not-allowed' : '',
					// Error styles
					error ? 'ring-2 ring-red-500 ring-offset-1' : ''
				) }
			>
				{ /* Background */ }
				<span
					aria-hidden="true"
					className="pointer-events-none absolute h-full w-full rounded-full bg-white opacity-0"
				/>

				{ /* Track */ }
				<span
					aria-hidden="true"
					className={ aiClassNames(
						'pointer-events-none absolute mx-auto rounded-full transition-colors duration-200 ease-in-out',
						sizeConfig.container,
						checked ? colorConfig.active.split( ' ' )[ 0 ] : 'bg-gray-200'
					) }
				/>

				{ /* Toggle */ }
				<span
					aria-hidden="true"
					className={ aiClassNames(
						'pointer-events-none absolute left-0 inline-block transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
						sizeConfig.toggle,
						sizeConfig.translate,
						// Add subtle scale on active for better feedback
						checked ? 'scale-110' : 'scale-100'
					) }
				/>
			</Switch>

			{ error && (
				<p
					id={ errorId }
					className="mt-1 text-sm text-red-600"
					role="alert"
					aria-live="polite"
				>
					{ error }
				</p>
			) }
		</div>
	);
} );

SwitchControl.displayName = 'SwitchControl';

export default SwitchControl;
