import React, { createContext, useContext, useState, useEffect, useCallback, useRef, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { updateApiData } from '@Utils/ApiData';
import TeachingBubble from './TeachingBubble';

// Tour step definitions for licensed users
const LICENSED_TOUR_STEPS = [
	{
		id: 'post-ideas',
		targetSelector: 'post-ideas',
		title: __( 'Generate Post Ideas', 'solvex-ai-blogger' ),
		description: __( 'Click here to generate AI-powered blog post topics tailored to your site.', 'solvex-ai-blogger' ),
		placement: 'top',
	},
	{
		id: 'campaigns-nav',
		targetSelector: 'campaigns-nav',
		title: __( 'View Campaigns', 'solvex-ai-blogger' ),
		description: __( 'Set up automated campaigns to publish blog posts on a schedule.', 'solvex-ai-blogger' ),
		placement: 'bottom',
		// On "Next", open the Campaigns tab so the tour can continue on the "Add New" button.
		navigateOnNext: 'campaigns',
	},
	{
		id: 'add-campaign',
		targetSelector: 'add-campaign',
		title: __( 'Start Auto-Publishing', 'solvex-ai-blogger' ),
		description: __( 'Create your first campaign to start auto-publishing posts on a schedule.', 'solvex-ai-blogger' ),
		placement: 'bottom',
		waitForTarget: true,
	},
	{
		id: 'token-display',
		targetSelector: 'token-display',
		title: __( 'Track Token Usage', 'solvex-ai-blogger' ),
		description: __( 'Track your free token balance here. 20,000 tokens refresh monthly.', 'solvex-ai-blogger' ),
		placement: 'bottom',
	},
];

// Tour step definitions for unlicensed users
const UNLICENSED_TOUR_STEPS = [
	{
		id: 'connect-account',
		targetSelector: 'connect-account',
		title: __( 'Connect Your Free Account', 'solvex-ai-blogger' ),
		description: __( 'Connect your free account to unlock AI-powered blogging. It takes just 30 seconds!', 'solvex-ai-blogger' ),
		placement: 'bottom',
	},
	{
		id: 'no-api-key',
		targetSelector: 'no-api-key',
		title: __( 'Get Your Free API Key', 'solvex-ai-blogger' ),
		description: __( 'Click here to create your free account in 30 seconds and get your API key.', 'solvex-ai-blogger' ),
		placement: 'bottom',
		waitForTarget: true,
	},
];

// Context
const TeachingBubbleContext = createContext( null );

export const useTeachingBubble = () => useContext( TeachingBubbleContext );

const TOUR_COMPLETED_KEY = 'wpsolvex_ai_blogger_tour_completed';

/**
 * TeachingBubbleManager — Orchestrates the teaching bubble tour.
 * Wraps the dashboard and shows contextual bubbles based on license state.
 */
const TeachingBubbleManager = memo( ( { children } ) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const abortControllerRef = useRef( {} );
	const observerRef = useRef( null );
	const checkIntervalRef = useRef( null );

	// Redux state
	const tourCompleted = useSelector( ( state ) => state.tourCompleted );
	const licenseStatus = useSelector( ( state ) => state.license_status );
	const userOnboarded = useSelector( ( state ) => state.userOnboarded );
	const homeSlug = useSelector( ( state ) => state.homeSlug ) || 'solvex-ai-blogger';

	// Local state
	const [ currentStepIndex, setCurrentStepIndex ] = useState( 0 );
	const [ isTourActive, setIsTourActive ] = useState( false );
	const [ targetFound, setTargetFound ] = useState( false );

	// Determine which tour to show
	const isLicensed = licenseStatus === 'licensed';
	const tourSteps = isLicensed ? LICENSED_TOUR_STEPS : UNLICENSED_TOUR_STEPS;
	const currentStep = tourSteps[ currentStepIndex ];

	// Start tour after onboarding completes (with a delay for smooth transition)
	useEffect( () => {
		const alreadyCompleted = localStorage.getItem( TOUR_COMPLETED_KEY ) === 'true';
		if ( userOnboarded && ! tourCompleted && ! alreadyCompleted && ! isTourActive ) {
			const timer = setTimeout( () => {
				setIsTourActive( true );
				setCurrentStepIndex( 0 );
			}, 800 );
			return () => clearTimeout( timer );
		}
	}, [ userOnboarded, tourCompleted, isTourActive ] );

	// Watch for target elements to appear in the DOM
	useEffect( () => {
		if ( ! isTourActive || ! currentStep ) {
			return;
		}

		const selector = currentStep.targetSelector.startsWith( '[' )
			? currentStep.targetSelector
			: `[data-tour-target="${ currentStep.targetSelector }"]`;

		// Check if target already exists
		const existingTarget = document.querySelector( selector );
		if ( existingTarget ) {
			setTargetFound( true );
			return;
		}

		// If step requires waiting, use MutationObserver
		if ( currentStep.waitForTarget ) {
			setTargetFound( false );

			// Periodically check for the target (handles lazy-loaded components)
			checkIntervalRef.current = setInterval( () => {
				const target = document.querySelector( selector );
				if ( target ) {
					setTargetFound( true );
					clearInterval( checkIntervalRef.current );
					if ( observerRef.current ) {
						observerRef.current.disconnect();
					}
				}
			}, 500 );

			// Also use MutationObserver for faster detection
			observerRef.current = new MutationObserver( () => {
				const target = document.querySelector( selector );
				if ( target ) {
					setTargetFound( true );
					observerRef.current.disconnect();
					clearInterval( checkIntervalRef.current );
				}
			} );

			observerRef.current.observe( document.body, {
				childList: true,
				subtree: true,
			} );

			return () => {
				if ( observerRef.current ) {
					observerRef.current.disconnect();
				}
				if ( checkIntervalRef.current ) {
					clearInterval( checkIntervalRef.current );
				}
			};
		}

		// Non-waiting step but target missing — still wait a bit
		setTargetFound( false );
		const retryTimer = setTimeout( () => {
			const target = document.querySelector( selector );
			if ( target ) {
				setTargetFound( true );
			}
		}, 500 );

		return () => clearTimeout( retryTimer );
	}, [ isTourActive, currentStep, currentStepIndex ] );

	// Complete the tour
	const completeTour = useCallback( async () => {
		setIsTourActive( false );
		localStorage.setItem( TOUR_COMPLETED_KEY, 'true' );
		dispatch( { type: 'UPDATE_TOUR_COMPLETED', payload: true } );

		try {
			await updateApiData( 'tourCompleted', true, dispatch, abortControllerRef );
		} catch ( error ) {
			console.error( 'Failed to save tour completion:', error );
		}
	}, [ dispatch ] );

	// Handle Next button
	const handleNext = useCallback( () => {
		if ( currentStepIndex >= tourSteps.length - 1 ) {
			completeTour();
		} else {
			// If this step should open another tab, navigate there so the next
			// step's target (e.g. the "Add New" button) renders for the tour.
			if ( currentStep?.navigateOnNext ) {
				navigate( {
					search: `?page=${ homeSlug }&path=${ currentStep.navigateOnNext }`,
				} );
			}
			setTargetFound( false );
			setCurrentStepIndex( ( prev ) => prev + 1 );
		}
	}, [ currentStepIndex, tourSteps.length, completeTour, currentStep, navigate, homeSlug ] );

	// Handle Skip
	const handleSkip = useCallback( () => {
		completeTour();
	}, [ completeTour ] );

	// Handle Dismiss (X button)
	const handleDismiss = useCallback( () => {
		completeTour();
	}, [ completeTour ] );

	// Cleanup on unmount
	useEffect( () => {
		return () => {
			if ( observerRef.current ) {
				observerRef.current.disconnect();
			}
			if ( checkIntervalRef.current ) {
				clearInterval( checkIntervalRef.current );
			}
			Object.values( abortControllerRef.current ).forEach( ( controller ) => {
				if ( controller && typeof controller.abort === 'function' ) {
					controller.abort();
				}
			} );
		};
	}, [] );

	// Context value for child components
	const contextValue = {
		isTourActive,
		currentStepId: currentStep?.id || null,
		completeTour,
	};

	const showBubble = isTourActive && currentStep && targetFound;

	return (
		<TeachingBubbleContext.Provider value={ contextValue }>
			{ children }
			{ showBubble && (
				<TeachingBubble
					key={ currentStep.id }
					title={ currentStep.title }
					description={ currentStep.description }
					currentStep={ currentStepIndex }
					totalSteps={ tourSteps.length }
					onNext={ handleNext }
					onSkip={ handleSkip }
					onDismiss={ handleDismiss }
					targetSelector={ currentStep.targetSelector }
					placement={ currentStep.placement }
				/>
			) }
		</TeachingBubbleContext.Provider>
	);
} );

TeachingBubbleManager.displayName = 'TeachingBubbleManager';

export default TeachingBubbleManager;
