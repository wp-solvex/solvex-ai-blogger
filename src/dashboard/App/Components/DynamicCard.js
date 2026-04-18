import React, { memo } from 'react';
import { Gift, MoveRight } from 'lucide-react';

/**
 * Reusable Dynamic Card component.
 * Used for promotional content, informational cards, and call-to-action sections.
 */
const DynamicCard = memo( ( {
	// Content props
	icon: Icon = Gift,
	heading,
	subHeading,
	additionalInfo,
	linkText,
	linkUrl,

	// Styling props
	size = 'medium', // 'small', 'medium', 'large'
	colorScheme = 'blue', // 'blue', 'indigo', 'green', 'purple', 'red'
	className = '',

	// Behavior props
	openInNewTab = true,
	onLinkClick,

	// Accessibility props
	ariaLabel,
} ) => {
	// Size configurations
	const sizeConfig = {
		small: {
			container: 'p-3',
			iconContainer: 'p-1.5',
			iconSize: 'w-4 h-4',
			heading: 'text-xs font-semibold',
			subHeading: 'text-xs',
			additionalInfo: 'text-xs',
			linkText: 'text-xs font-medium',
			linkIconSize: 'w-3 h-3',
			gap: 'gap-2',
			marginBottom: 'mb-2',
			headingMarginBottom: '!mb-1',
		},
		medium: {
			container: 'p-4',
			iconContainer: 'p-2',
			iconSize: 'w-5 h-5',
			heading: 'text-lg font-semibold text-gray-900',
			subHeading: 'text-xs',
			additionalInfo: 'text-xs',
			linkText: 'text-sm font-medium',
			linkIconSize: 'w-3 h-3',
			gap: 'gap-3',
			marginBottom: 'mb-3',
			headingMarginBottom: '!mb-6',
		},
		large: {
			container: 'p-6',
			iconContainer: 'p-3',
			iconSize: 'w-6 h-6',
			heading: 'text-2xl font-bold text-gray-900',
			subHeading: 'text-sm',
			additionalInfo: 'text-sm',
			linkText: 'text-base font-medium',
			linkIconSize: 'w-4 h-4',
			gap: 'gap-4',
			marginBottom: 'mb-4',
			headingMarginBottom: '!mb-9',
		},
	};

	// Color scheme configurations
	const colorConfig = {
		brand: {
			background: 'bg-gradient-to-r from-brand-50 to-brand-100',
			border: 'border-brand-200',
			iconBg: 'bg-brand-100',
			iconColor: 'text-brand',
			linkColor: 'text-brand hover:text-brand-700',
			focusRing: 'focus:ring-brand',
			outline: 'outline-brand hover:outline-brand-700 focus:outline-brand-700',
		},
		blue: {
			background: 'bg-gradient-to-r from-blue-50 to-indigo-50',
			border: 'border-blue-200',
			iconBg: 'bg-blue-100',
			iconColor: 'text-blue-600',
			linkColor: 'text-blue-600 hover:text-blue-700',
			focusRing: 'focus:ring-blue-500',
			outline: 'outline-blue-500 hover:outline-blue-700 focus:outline-blue-700',
		},
		indigo: {
			background: 'bg-gradient-to-r from-indigo-50 to-purple-50',
			border: 'border-indigo-200',
			iconBg: 'bg-indigo-100',
			iconColor: 'text-indigo-600',
			linkColor: 'text-indigo-600 hover:text-indigo-700',
			focusRing: 'focus:ring-indigo-500',
			outline: 'outline-indigo-500 hover:outline-indigo-700 focus:outline-indigo-700',
		},
		green: {
			background: 'bg-gradient-to-r from-green-50 to-emerald-50',
			border: 'border-green-200',
			iconBg: 'bg-green-100',
			iconColor: 'text-green-600',
			linkColor: 'text-green-600 hover:text-green-700',
			focusRing: 'focus:ring-green-500',
			outline: 'outline-green-500 hover:outline-green-700 focus:outline-green-700',
		},
		purple: {
			background: 'bg-gradient-to-r from-purple-50 to-pink-50',
			border: 'border-purple-200',
			iconBg: 'bg-purple-100',
			iconColor: 'text-purple-600',
			linkColor: 'text-purple-600 hover:text-purple-700',
			focusRing: 'focus:ring-purple-500',
			outline: 'outline-purple-500 hover:outline-purple-700 focus:outline-purple-700',
		},
		red: {
			background: 'bg-gradient-to-r from-red-50 to-pink-50',
			border: 'border-red-200',
			iconBg: 'bg-red-100',
			iconColor: 'text-red-600',
			linkColor: 'text-red-600 hover:text-red-700',
			focusRing: 'focus:ring-red-500',
			outline: 'outline-red-500 hover:outline-red-700 focus:outline-red-700',
		},
	};

	const currentSize = sizeConfig[ size ] || sizeConfig.medium;
	const currentColor = colorConfig[ colorScheme ] || colorConfig.brand;

	const handleLinkClick = ( e ) => {
		if ( onLinkClick ) {
			e.preventDefault();
			onLinkClick( e );
		}
	};

	// If no content provided, don't render anything
	if ( ! heading && ! subHeading && ! additionalInfo && ! linkText ) {
		return null;
	}

	return (
		linkText && linkUrl ? (
			<a
				href={ linkUrl }
				target={ openInNewTab ? '_blank' : undefined }
				rel={ openInNewTab ? 'noopener noreferrer' : undefined }
				onClick={ handleLinkClick }
				style={ { textDecoration: 'none' } }
				className={ `block outline-1 focus:outline-1 hover:outline-1 outline-solid rounded duration-200 transition-all ${ currentColor.outline }` }
				aria-label={ ariaLabel || ( openInNewTab ? `${ linkText } - opens in new tab` : linkText ) }
			>
				<div className={ `mt-6 ${ currentSize.container } ${ currentColor.background } border ${ currentColor.border } ${ className }` }>
					{ /* Header section with icon and text */ }
					{ ( Icon || heading || subHeading ) && (
						<div className={ `flex items-center justify-between ${ currentSize.gap }` }>
							<div className={ `flex items-center ${ currentSize.gap }` }>
								{ Icon && (
									<div className={ `${ currentSize.iconContainer } ${ currentColor.iconBg } rounded-sm flex` }>
										<Icon className={ `${ currentSize.iconSize } ${ currentColor.iconColor }` } aria-hidden="true" />
									</div>
								) }
								{ ( heading || subHeading ) && (
									<div className="flex flex-col gap-1">
										{ heading && (
											<h3 className={ `${ currentSize.heading } m-0 p-0` }>
												{ heading }
											</h3>
										) }

										{ subHeading && (
											<p className={ `${ currentSize.subHeading } text-gray-600` }>
												{ subHeading }
											</p>
										) }

										{ /* Additional info section */ }
										{ additionalInfo && (
											<div className={ `${ currentSize.additionalInfo } text-gray-600 ${ linkText ? currentSize.marginBottom : '' }` }>
												{ additionalInfo }
											</div>
										) }
									</div>
								) }
							</div>

							<MoveRight className={ `${ currentSize.iconSize } ${ currentColor.iconColor }` } />
						</div>
					) }
				</div>
			</a>
		) : (
			<div className={ `mt-6 ${ currentSize.container } ${ currentColor.background } border ${ currentColor.border } rounded-xl ${ className }` }>
				{ /* Header section with icon and text */ }
				{ ( Icon || heading || subHeading ) && (
					<div className={ `flex items-center ${ currentSize.gap }` }>
						{ Icon && (
							<div className={ `${ currentSize.iconContainer } ${ currentColor.iconBg } rounded-lg flex` }>
								<Icon className={ `${ currentSize.iconSize } ${ currentColor.iconColor }` } aria-hidden="true" />
							</div>
						) }

						{ ( heading || subHeading ) && (
							<div className="flex flex-col gap-1">
								{ heading && (
									<h3 className={ `${ currentSize.heading } m-0 p-0` }>
										{ heading }
									</h3>
								) }

								{ subHeading && (
									<p className={ `${ currentSize.subHeading } text-gray-600` }>
										{ subHeading }
									</p>
								) }

								{ /* Additional info section */ }
								{ additionalInfo && (
									<div className={ `${ currentSize.additionalInfo } text-gray-600` }>
										{ additionalInfo }
									</div>
								) }
							</div>
						) }
					</div>
				) }
			</div>
		)
	);
} );

DynamicCard.displayName = 'DynamicCard';

export default DynamicCard;
