import { forwardRef, useMemo } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';

/**
 * Enhanced SettingField component with better layout options and accessibility
 */
const SettingField = forwardRef( ( {
	children,
	direction = 'column',
	gap = 'default',
	align = 'start',
	justify = 'start',
	wrap = false,
	className = '',
	disabled = false,
	error = false,
	required = false,
	role,
	'aria-label': ariaLabel,
	'aria-describedby': ariaDescribedBy,
	...props
}, ref ) => {
	// Early return if no children
	if ( ! children ) {
		return null;
	}

	// Gap variants
	const gaps = {
		none: 'gap-0',
		small: 'gap-1',
		default: 'gap-2',
		medium: 'gap-4',
		large: 'gap-6',
		xl: 'gap-8',
	};

	// Alignment variants
	const alignments = {
		start: 'items-start',
		center: 'items-center',
		end: 'items-end',
		stretch: 'items-stretch',
		baseline: 'items-baseline',
	};

	// Justify variants
	const justifications = {
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end',
		between: 'justify-between',
		around: 'justify-around',
		evenly: 'justify-evenly',
	};

	// Memoize classes for performance.
	const fieldClasses = useMemo( () => { // eslint-disable-line
		return aiClassNames(
			// Base classes
			'flex w-full setting-field',
			// Direction
			direction === 'column' ? 'flex-col' : 'flex-row',
			// Gap
			gaps[ gap ] || gaps.default,
			// Alignment
			direction === 'row' ? alignments[ align ] || alignments.start : '',
			// Justify
			direction === 'row' ? justifications[ justify ] || justifications.start : '',
			// Wrap
			wrap ? 'flex-wrap' : 'flex-nowrap',
			// States
			disabled ? 'opacity-60 pointer-events-none' : '',
			error ? 'border-red-300' : '',
			required ? 'required-field' : '',
			// Custom className
			className
		);
	}, [ direction, gap, align, justify, wrap, disabled, error, required, className ] );

	// Determine ARIA role
	const fieldRole = role || ( direction === 'row' ? 'group' : undefined );

	return (
		<div
			ref={ ref }
			className={ fieldClasses }
			role={ fieldRole }
			aria-label={ ariaLabel }
			aria-describedby={ ariaDescribedBy }
			aria-disabled={ disabled }
			aria-invalid={ error }
			aria-required={ required }
			data-direction={ direction }
			data-disabled={ disabled }
			data-error={ error }
			data-required={ required }
			{ ...props }
		>
			{ children }
		</div>
	);
} );

SettingField.displayName = 'SettingField';

export default SettingField;
