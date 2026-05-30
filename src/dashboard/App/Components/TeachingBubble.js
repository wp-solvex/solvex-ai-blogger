import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';

/**
 * Calculate optimal position for the teaching bubble relative to its target.
 * Prefers bottom placement, falls back based on available viewport space.
 */
const calculatePosition = ( targetRect, bubbleRef, preferredPlacement = 'bottom' ) => {
	if ( ! targetRect || ! bubbleRef?.current ) {
		return { top: 0, left: 0, placement: 'bottom' };
	}

	const bubble = bubbleRef.current;
	const bubbleRect = bubble.getBoundingClientRect();
	const viewport = { width: window.innerWidth, height: window.innerHeight };
	const gap = 12; // Distance between target and bubble
	const padding = 16; // Viewport edge padding

	const placements = {
		bottom: {
			top: targetRect.bottom + gap + window.scrollY,
			left: targetRect.left + ( targetRect.width / 2 ) - ( bubbleRect.width / 2 ) + window.scrollX,
			fits: targetRect.bottom + gap + bubbleRect.height < viewport.height,
		},
		top: {
			top: targetRect.top - bubbleRect.height - gap + window.scrollY,
			left: targetRect.left + ( targetRect.width / 2 ) - ( bubbleRect.width / 2 ) + window.scrollX,
			fits: targetRect.top - gap - bubbleRect.height > 0,
		},
		right: {
			top: targetRect.top + ( targetRect.height / 2 ) - ( bubbleRect.height / 2 ) + window.scrollY,
			left: targetRect.right + gap + window.scrollX,
			fits: targetRect.right + gap + bubbleRect.width < viewport.width,
		},
		left: {
			top: targetRect.top + ( targetRect.height / 2 ) - ( bubbleRect.height / 2 ) + window.scrollY,
			left: targetRect.left - bubbleRect.width - gap + window.scrollX,
			fits: targetRect.left - gap - bubbleRect.width > 0,
		},
	};

	// Try preferred placement first, then fallbacks
	const order = [ preferredPlacement, 'bottom', 'top', 'right', 'left' ];
	for ( const p of order ) {
		if ( placements[ p ].fits ) {
			const pos = placements[ p ];
			// Clamp horizontal position within viewport
			pos.left = Math.max( padding, Math.min( pos.left, viewport.width - bubbleRect.width - padding + window.scrollX ) );
			return { top: pos.top, left: pos.left, placement: p };
		}
	}

	// Fallback: just place below
	const fallback = placements.bottom;
	fallback.left = Math.max( padding, Math.min( fallback.left, viewport.width - bubbleRect.width - padding + window.scrollX ) );
	return { top: fallback.top, left: fallback.left, placement: 'bottom' };
};

/**
 * Arrow component pointing from bubble toward target
 */
const BubbleArrow = memo( ( { placement } ) => {
	const arrowClasses = {
		bottom: 'absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45',
		top: 'absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45',
		right: 'absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-l border-b border-gray-200 rotate-45',
		left: 'absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-white border-r border-t border-gray-200 rotate-45',
	};

	return <div className={ arrowClasses[ placement ] || arrowClasses.bottom } />;
} );
BubbleArrow.displayName = 'BubbleArrow';

/**
 * Backdrop overlay with a cutout around the target element.
 */
const BackdropOverlay = memo( ( { targetRect } ) => {
	if ( ! targetRect ) {
		return null;
	}

	const overlayPadding = 6;
	const borderRadius = 8;

	return (
		<div
			className="fixed inset-0 z-[9998] pointer-events-auto"
			style={ {
				background: 'rgba(0, 0, 0, 0.45)',
				WebkitMaskImage: `
					linear-gradient(#000, #000),
					linear-gradient(#000, #000)
				`,
				WebkitMaskComposite: 'xor',
				maskComposite: 'exclude',
				WebkitMaskPosition: `
					0 0,
					${ targetRect.left - overlayPadding }px ${ targetRect.top - overlayPadding }px
				`,
				WebkitMaskSize: `
					100% 100%,
					${ targetRect.width + overlayPadding * 2 }px ${ targetRect.height + overlayPadding * 2 }px
				`,
				WebkitMaskRepeat: 'no-repeat',
				maskImage: `
					linear-gradient(#000, #000),
					linear-gradient(#000, #000)
				`,
				maskPosition: `
					0 0,
					${ targetRect.left - overlayPadding }px ${ targetRect.top - overlayPadding }px
				`,
				maskSize: `
					100% 100%,
					${ targetRect.width + overlayPadding * 2 }px ${ targetRect.height + overlayPadding * 2 }px
				`,
				maskRepeat: 'no-repeat',
			} }
			aria-hidden="true"
		/>
	);
} );
BackdropOverlay.displayName = 'BackdropOverlay';

/**
 * TeachingBubble — A positioned tooltip-style coachmark component.
 *
 * @param {Object}   props
 * @param {string}   props.title           - Bold heading text
 * @param {string}   props.description     - Body text
 * @param {number}   props.currentStep     - Current step index (0-based)
 * @param {number}   props.totalSteps      - Total steps in the tour
 * @param {Function} props.onNext          - Called when user clicks Next/Got it
 * @param {Function} props.onSkip          - Called when user skips the tour
 * @param {Function} props.onDismiss       - Called when user dismisses (X button)
 * @param {string}   props.targetSelector  - CSS selector or data-tour-target value
 * @param {string}   props.placement       - Preferred placement: top|bottom|left|right
 * @param {string}   props.nextLabel       - Custom label for next button
 * @param {boolean}  props.showBackdrop    - Whether to show the backdrop overlay
 */
const TeachingBubble = memo( ( {
	title,
	description,
	currentStep = 0,
	totalSteps = 1,
	onNext,
	onSkip,
	onDismiss,
	targetSelector,
	placement = 'bottom',
	nextLabel,
	showBackdrop = true,
} ) => {
	const bubbleRef = useRef( null );
	const [ position, setPosition ] = useState( { top: -9999, left: -9999, placement: 'bottom' } );
	const [ targetRect, setTargetRect ] = useState( null );
	const [ isVisible, setIsVisible ] = useState( false );

	// Find target element and update position
	const updatePosition = useCallback( () => {
		const selector = targetSelector.startsWith( '[' )
			? targetSelector
			: `[data-tour-target="${ targetSelector }"]`;
		const target = document.querySelector( selector );

		if ( ! target || ! bubbleRef.current ) {
			return;
		}

		const rect = target.getBoundingClientRect();
		setTargetRect( rect );

		const newPosition = calculatePosition( rect, bubbleRef, placement );
		setPosition( newPosition );
		setIsVisible( true );

		// Scroll target into view if needed
		const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
		if ( ! isInView ) {
			target.scrollIntoView( { behavior: 'smooth', block: 'center' } );
			// Recalculate after scroll
			setTimeout( () => {
				const updatedRect = target.getBoundingClientRect();
				setTargetRect( updatedRect );
				setPosition( calculatePosition( updatedRect, bubbleRef, placement ) );
			}, 400 );
		}
	}, [ targetSelector, placement ] );

	// Position on mount and reposition on scroll/resize
	useEffect( () => {
		// Initial delay to let DOM settle
		const initTimer = setTimeout( updatePosition, 100 );

		const handleReposition = () => {
			requestAnimationFrame( updatePosition );
		};

		window.addEventListener( 'scroll', handleReposition, { passive: true } );
		window.addEventListener( 'resize', handleReposition, { passive: true } );

		return () => {
			clearTimeout( initTimer );
			window.removeEventListener( 'scroll', handleReposition );
			window.removeEventListener( 'resize', handleReposition );
		};
	}, [ updatePosition ] );

	// Handle Escape key
	useEffect( () => {
		const handleKeyDown = ( e ) => {
			if ( e.key === 'Escape' ) {
				onDismiss?.();
			}
		};
		document.addEventListener( 'keydown', handleKeyDown );
		return () => document.removeEventListener( 'keydown', handleKeyDown );
	}, [ onDismiss ] );

	// Focus the bubble when it becomes visible
	useEffect( () => {
		if ( isVisible && bubbleRef.current ) {
			bubbleRef.current.focus();
		}
	}, [ isVisible, currentStep ] );

	const isLastStep = currentStep >= totalSteps - 1;
	const buttonLabel = nextLabel || ( isLastStep ? __( 'Got it!', 'solvex-ai-blogger' ) : __( 'Next', 'solvex-ai-blogger' ) );

	const bubble = (
		<>
			{ /* Backdrop overlay */ }
			{ showBackdrop && targetRect && <BackdropOverlay targetRect={ targetRect } /> }

			{ /* Teaching bubble */ }
			<div
				ref={ bubbleRef }
				role="dialog"
				aria-modal="false"
				aria-label={ title }
				tabIndex={ -1 }
				className="z-[9999] w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200"
				style={ {
					position: 'absolute',
					top: `${ position.top }px`,
					left: `${ position.left }px`,
					opacity: isVisible ? 1 : 0,
					transition: 'opacity 0.25s ease-in-out',
					pointerEvents: isVisible ? 'auto' : 'none',
				} }
			>
				{ /* Arrow */ }
				<BubbleArrow placement={ position.placement } />

				{ /* Content */ }
				<div className="p-4">
					{ /* Header with step counter and close button */ }
					<div className="flex items-start justify-between mb-2">
						<div>
							{ totalSteps > 1 && (
								<span className="text-[11px] font-medium text-brand-600 uppercase tracking-wide">
									{ `${ __( 'Step', 'solvex-ai-blogger' ) } ${ currentStep + 1 } ${ __( 'of', 'solvex-ai-blogger' ) } ${ totalSteps }` }
								</span>
							) }
							<h3 className="text-[14px] font-bold text-gray-900 mt-0.5 mb-0">
								{ title }
							</h3>
						</div>
						<button
							type="button"
							onClick={ onDismiss }
							className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 -mt-1 -mr-1 border-none bg-transparent cursor-pointer p-0 leading-none"
							aria-label={ __( 'Dismiss', 'solvex-ai-blogger' ) }
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{ /* Description */ }
					<p className="text-[13px] text-gray-600 leading-relaxed mb-3">
						{ description }
					</p>

					{ /* Step dots for multi-step tours */ }
					{ totalSteps > 1 && (
						<div className="flex items-center gap-1.5 mb-3">
							{ Array.from( { length: totalSteps } ).map( ( _, i ) => (
								<div
									key={ i }
									className={ `h-1.5 rounded-full transition-all duration-300 ${ i === currentStep ? 'w-6 bg-brand-500' : i < currentStep ? 'w-1.5 bg-brand-300' : 'w-1.5 bg-gray-200' }` }
								/>
							) ) }
						</div>
					) }

					{ /* Actions */ }
					<div className="flex items-center justify-between gap-2">
						{ totalSteps > 1 && ! isLastStep ? (
							<button
								type="button"
								onClick={ onSkip }
								className="px-4 py-1.5 text-[12px] font-semibold text-brand-600 border border-brand-500 rounded bg-white hover:bg-brand-50 cursor-pointer transition-colors"
							>
								{ __( 'Skip Tour', 'solvex-ai-blogger' ) }
							</button>
						) : (
							<div />
						) }

						<button
							type="button"
							onClick={ onNext }
							className="px-4 py-1.5 text-[12px] font-semibold text-white bg-brand-500 border border-brand-500 rounded hover:bg-brand-600 cursor-pointer transition-colors"
						>
							{ buttonLabel }
						</button>
					</div>
				</div>
			</div>
		</>
	);

	return createPortal( bubble, document.body );
} );

TeachingBubble.displayName = 'TeachingBubble';

export default TeachingBubble;
