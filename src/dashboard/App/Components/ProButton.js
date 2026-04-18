import { __ } from '@wordpress/i18n';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { aiClassNames } from '@Utils/aiClassNames';
import { useSelector } from 'react-redux';
import { Loader } from 'lucide-react';

/**
 * Enhanced ProButton component with better accessibility and customization.
 */
const ProButton = forwardRef( ( {
	className = '',
	variant = 'primary',
	size = 'default',
	isLink = false,
	url = '',
	disabled = false,
	loading = false,
	icon = null,
	iconPosition = 'right',
	tooltip = null,
	tooltipPosition = 'top',
	children = __( 'Upgrade to Pro', 'solvex-ai-blogger' ),
	onClick,
	'aria-label': ariaLabel,
	...props
}, ref ) => {
	const [ showTooltip, setShowTooltip ] = useState( false );

	// Get pro purchase URL from Redux store.
	const proPurchaseUrl = useSelector( ( state ) => state.proPurchaseUrl ) || solvex_aib_localized_data.pro_purchase_url;

	// Determine the URL to use
	const proUrl = useMemo( () => {
		return url || proPurchaseUrl;
	}, [ url, proPurchaseUrl ] );

	// Determine element tag - if we have a URL but no custom onClick, render as link
	const shouldRenderAsLink = isLink || ( proUrl && proUrl.trim() !== '' && ! onClick );

	// Enhanced click handler with error handling
	const handleUpgrade = useCallback( ( event ) => {
		if ( disabled || loading ) {
			event.preventDefault();
			return;
		}

		// Call custom onClick if provided
		if ( onClick ) {
			const result = onClick( event );
			// If onClick returns false, prevent default behavior
			if ( result === false ) {
				return;
			}
		}

		// If we're rendering as a link and have a URL, let the browser handle it
		if ( shouldRenderAsLink && proUrl && proUrl.trim() !== '' ) {
			return; // Let the default link behavior handle this
		}

		// For buttons with URL but no onClick, handle navigation
		if ( proUrl && proUrl.trim() !== '' && ! onClick ) {
			event.preventDefault();
			event.stopPropagation();

			try {
				// Open in new tab with security attributes
				const newWindow = window.open( proUrl, '_blank', 'noopener,noreferrer' );

				// Fallback if popup blocked
				if ( ! newWindow ) {
					window.location.href = proUrl;
				}
			} catch ( error ) {
				console.error( 'Failed to open upgrade URL:', error );
				// Fallback to direct navigation
				window.location.href = proUrl;
			}
		}
	}, [ disabled, loading, onClick, proUrl, shouldRenderAsLink ] );

	// Variant styles
	const variants = {
		primary: 'text-white focus-visible:outline-brand-600',
		secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:outline-slate-500',
		outline: 'border-2 border-brand-600 text-brand-600 bg-transparent hover:bg-brand-50 focus-visible:outline-brand-600',
		ghost: 'text-brand-600 bg-transparent hover:bg-brand-50 focus-visible:outline-brand-600',
		danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
	};

	// Inline styles for primary variant gradient (better specificity than Tailwind classes)
	const primaryGradientStyle = variant === 'primary' ? {
		background: 'linear-gradient(to right, #9138c8, #d42ec1)',
		transition: 'all 0.2s',
	} : {};

	// Size styles
	const sizes = {
		small: 'px-2 py-1 text-xs',
		default: 'px-3 py-2 text-sm',
		large: 'px-4 py-3 text-base',
		xl: 'px-6 py-4 text-lg',
	};

	// Base classes.
	const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-none cursor-pointer transition-all duration-200 select-none no-underline';

	// Link-specific style overrides to prevent default link styling and maintain button appearance
	const linkStyleOverrides = shouldRenderAsLink ? '!text-white hover:!text-white visited:!text-white focus:!text-white active:!text-white decoration-none hover:no-underline focus:no-underline visited:no-underline' : '';

	// Disabled classes
	const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

	// Loading classes
	const loadingClasses = loading ? 'cursor-wait' : '';

	const Tag = shouldRenderAsLink ? 'a' : 'button';

	// Filter out link-specific props when rendering as button
	const { href, target, rel, ...buttonSafeProps } = props;

	// Props for link or button
	const elementProps = shouldRenderAsLink ? {
		href: proUrl,
		target: '_blank',
		rel: 'noopener noreferrer',
		role: 'button',
	} : {
		type: 'button',
		disabled: disabled || loading,
	};

	// Enhanced children with loading state
	const buttonContent = useMemo( () => {
		if ( loading ) {
			return (
				<>
					<Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
					{ __( 'Loading…', 'solvex-ai-blogger' ) }
				</>
			);
		}

		const iconElement = icon && (
			<span className={ `flex items-center ${ iconPosition === 'left' ? 'mr-2' : 'ml-2' }` } aria-hidden="true">
				{ icon }
			</span>
		);

		return (
			<>
				{ ( icon && iconPosition === 'left' ) && iconElement }
				{ children }
				{ ( icon && iconPosition === 'right' ) && iconElement }
			</>
		);
	}, [ loading, icon, iconPosition, children ] );

	// Tooltip position styles.
	const tooltipPositions = {
		top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
	};

	return (
		<div className="relative inline-block">
			{ tooltip && showTooltip && (
				<div className={ `absolute ${ tooltipPositions[ tooltipPosition ] || tooltipPositions.top } bg-gray-800 text-white text-xs rounded px-2 py-1 max-w-xs text-center whitespace-nowrap z-50` }>
					{ tooltip }
				</div>
			) }
			<Tag
				ref={ ref }
				className={ aiClassNames(
					baseClasses,
					linkStyleOverrides,
					variants[ variant ] || variants.primary,
					sizes[ size ] || sizes.default,
					disabledClasses,
					loadingClasses,
					className
				) }
				style={ {
					...primaryGradientStyle,
					...( props.style || {} ),
				} }
				onClick={ handleUpgrade }
				onMouseEnter={ tooltip ? () => setShowTooltip( true ) : undefined }
				onMouseLeave={ tooltip ? () => setShowTooltip( false ) : undefined }
				onMouseOver={ variant === 'primary' ? ( e ) => {
					e.currentTarget.style.background = 'linear-gradient(to right, #7c2fb0, #b823a3)';
				} : undefined }
				onMouseOut={ variant === 'primary' ? ( e ) => {
					e.currentTarget.style.background = 'linear-gradient(to right, #9138c8, #d42ec1)';
				} : undefined }
				aria-label={ ariaLabel || ( typeof children === 'string' ? children : __( 'Upgrade to Pro', 'solvex-ai-blogger' ) ) }
				aria-disabled={ disabled || loading }
				{ ...elementProps }
				{ ...( shouldRenderAsLink ? props : buttonSafeProps ) }
			>
				{ buttonContent }
			</Tag>
		</div>
	);
} );

ProButton.displayName = 'ProButton';

export default ProButton;
