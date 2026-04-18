import React, { useRef, useCallback, useMemo, memo } from 'react';
import { __ } from '@wordpress/i18n';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { updateApiData } from '@Utils/ApiData';
import { useDispatch } from 'react-redux';

// Enhanced progress indicator component
const ProgressIndicator = memo( ( { currentStep, maxSteps } ) => {
	return (
		<div className="flex items-center gap-3" role="progressbar" aria-valuenow={ currentStep + 1 } aria-valuemin={ 1 } aria-valuemax={ maxSteps }>
			{ /* Progress dots */ }
			<div className="flex gap-2">
				{ Array( maxSteps ).fill().map( ( _, index ) => (
					<div
						key={ index }
						className={ `
							w-3 h-3 rounded-full transition-all duration-300 ease-in-out
							${ currentStep >= index ? 'bg-brand-600 scale-110' : 'bg-gray-300' }
							${ currentStep === index ? 'ring-2 ring-brand-200 ring-offset-2' : '' }
						` }
						aria-label={ `Step ${ index + 1 } ${ currentStep >= index ? 'completed' : 'pending' }` }
					/>
				) ) }
			</div>

			{ /* Progress text */ }
			<span className="text-sm text-gray-600 font-medium">
				{ `${ currentStep + 1 } of ${ maxSteps }` }
			</span>
		</div>
	);
} );

ProgressIndicator.displayName = 'WizardProgressIndicator';

// Enhanced navigation button component
const NavigationButton = memo( ( {
	onClick,
	children,
	variant = 'primary',
	disabled = false,
	loading = false,
	icon: Icon,
	ariaLabel,
	iconPlacement = 'left',
} ) => {
	const baseClasses = 'relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';

	const variantClasses = {
		primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm hover:shadow-md',
		secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-brand-500 shadow-sm',
		ghost: 'text-gray-600 hover:text-brand-600 hover:bg-brand-50 focus:ring-brand-500',
	};

	const handleClick = useCallback( ( e ) => {
		if ( ! disabled && ! loading && onClick ) {
			onClick( e );
		}
	}, [ onClick, disabled, loading ] );

	const handleKeyDown = useCallback( ( e ) => {
		if ( ( e.key === 'Enter' || e.key === ' ' ) && ! disabled && ! loading ) {
			e.preventDefault();
			handleClick( e );
		}
	}, [ handleClick, disabled, loading ] );

	return (
		<button
			type="button"
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			disabled={ disabled || loading }
			className={ `${ baseClasses } ${ variantClasses[ variant ] }` }
			aria-label={ ariaLabel }
			aria-busy={ loading }
		>
			{ loading && iconPlacement === 'left' ? (
				<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
			) : Icon && iconPlacement === 'left' ? (
				<Icon className="w-4 h-4" aria-hidden="true" />
			) : null }
			<span>{ children }</span>
			{ loading && iconPlacement === 'right' ? (
				<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
			) : Icon && iconPlacement === 'right' ? (
				<Icon className="w-4 h-4" aria-hidden="true" />
			) : null }
		</button>
	);
} );

NavigationButton.displayName = 'WizardNavigationButton';

const FooterNavigationBar = memo( ( props ) => {
	const abortControllerRef = useRef( {} );
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const { previousStep, nextStep, currentStep, maxSteps } = props;

	// Enhanced URL parameter handling
	const query = useMemo( () => new URLSearchParams( location.search ), [ location.search ] );
	const currentActiveStep = useMemo( () => query.get( 'step' ), [ query ] );

	// State for loading and completion
	const [ isNavigating, setIsNavigating ] = React.useState( false );
	const [ isCompleting, setIsCompleting ] = React.useState( false );

	// Enhanced step navigation
	const handlePreviousStep = useCallback( async () => {
		if ( previousStep === 'dashboard' ) {
			return;
		}

		setIsNavigating( true );
		try {
			await new Promise( ( resolve ) => setTimeout( resolve, 100 ) ); // Small delay for UX
			navigate( `?step=${ previousStep }` );
		} finally {
			setIsNavigating( false );
		}
	}, [ previousStep, navigate ] );

	const handleNextStep = useCallback( async ( e ) => {
		e.preventDefault();

		if ( nextStep ) {
			setIsNavigating( true );
			try {
				await new Promise( ( resolve ) => setTimeout( resolve, 100 ) ); // Small delay for UX
				navigate( `?step=${ nextStep }` );
			} finally {
				setIsNavigating( false );
			}
			return;
		}

		// Handle completion step
		if ( ! nextStep && currentActiveStep === 'ready' ) {
			setIsCompleting( true );
			try {
				dispatch( { type: 'UPDATE_USER_ONBOARDED', payload: true } );
				await updateApiData( 'userOnboarded', true, dispatch, abortControllerRef );
			} catch ( error ) {
				console.error( 'Failed to complete onboarding:', error );
			} finally {
				setIsCompleting( false );
			}
		}
	}, [ nextStep, currentActiveStep, navigate, dispatch ] );

	// Enhanced button text logic
	const getNextButtonText = useCallback( () => {
		const stepsToSkip = [ 'ready', 'optin' ];

		if ( nextStep && ! stepsToSkip.includes( currentActiveStep ) ) {
			return __( 'Next', 'auto-ai-blogger' );
		} else if ( nextStep || currentActiveStep === 'optin' ) {
			return __( 'Skip', 'auto-ai-blogger' );
		}
		return __( 'Finish Setup', 'auto-ai-blogger' );
	}, [ nextStep, currentActiveStep ] );

	// Determine if previous button should be disabled
	const isPreviousDisabled = useMemo( () =>
		previousStep === 'dashboard' || isNavigating || isCompleting,
	[ previousStep, isNavigating, isCompleting ]
	);

	// Determine button variants and states
	const nextButtonVariant = useMemo( () => {
		if ( ! nextStep && currentActiveStep === 'ready' ) {
			return 'primary';
		}
		if ( currentActiveStep === 'optin' ) {
			return 'secondary';
		}
		return 'primary';
	}, [ nextStep, currentActiveStep ] );

	return (
		<footer
			className="autoaib-setup-footer bg-white shadow-lg border-t border-gray-200 fixed right-0 left-[160px] bottom-0 h-[80px] z-20"
			role="contentinfo"
			aria-label={ __( 'Setup wizard navigation', 'auto-ai-blogger' ) }
		>
			<div className="flex items-center justify-between max-w-4xl mx-auto px-8 h-full">
				{ /* Previous button section */ }
				<div className="flex-shrink-0">
					<NavigationButton
						onClick={ handlePreviousStep }
						variant="ghost"
						disabled={ isPreviousDisabled }
						loading={ isNavigating && previousStep !== 'dashboard' }
						icon={ ChevronLeft }
						ariaLabel={ __( 'Go to previous step', 'auto-ai-blogger' ) }
					>
						{ __( 'Back', 'auto-ai-blogger' ) }
					</NavigationButton>
				</div>

				{ /* Progress indicator - centered */ }
				<div className="flex-1 flex justify-center">
					<div className="hidden md:block">
						<ProgressIndicator
							currentStep={ currentStep }
							maxSteps={ maxSteps }
						/>
					</div>

					{ /* Mobile progress text */ }
					<div className="md:hidden">
						<span className="text-sm text-gray-600 font-medium">
							{ __( 'Step', 'auto-ai-blogger' ) + ` ${ currentStep + 1 } ` + __( 'of', 'auto-ai-blogger' ) + ` ${ maxSteps }` }
						</span>
					</div>
				</div>

				{ /* Next button section */ }
				<div className="flex-shrink-0">
					<NavigationButton
						onClick={ handleNextStep }
						variant={ nextButtonVariant }
						loading={ isNavigating || isCompleting }
						icon={ ! nextStep && currentActiveStep === 'ready' ? Check : ChevronRight }
						iconPlacement="right"
						ariaLabel={ __( 'Continue to next step', 'auto-ai-blogger' ) }
					>
						{ isCompleting ? __( 'Completing…', 'auto-ai-blogger' ) : getNextButtonText() }
					</NavigationButton>
				</div>
			</div>

			{ /* Screen reader announcements */ }
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{ isNavigating && __( 'Navigating to next step…', 'auto-ai-blogger' ) }
				{ isCompleting && __( 'Completing setup process…', 'auto-ai-blogger' ) }
			</div>
		</footer>
	);
} );

FooterNavigationBar.displayName = 'WizardFooterNavigationBar';

export default FooterNavigationBar;
