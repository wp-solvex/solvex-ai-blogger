import React, { Suspense, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';

// Lazy load components for better performance.
import AppLoader from '@Components/AppLoader';
const Wizard = React.lazy( () => import( './Wizard' ) );
const Dashboard = React.lazy( () => import( './Dashboard' ) );

/**
 * Enhanced loading component for lazy-loaded routes
 */
const RouteLoader = () => (
	<div
		className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100"
		aria-live="polite"
		aria-label={ __( 'Loading application', 'auto-ai-blogger' ) }
	>
		<div className="flex flex-col items-center space-y-6">
			{ /* Animated AI Brain Icon */ }
			<div className="relative">
				<div className="w-16 h-16 relative">
					{ /* Outer rotating ring */ }
					<div className="absolute inset-0 rounded-full border-4 border-brand-200 animate-spin"></div>
					{ /* Inner pulsing circle */ }
					<div className="absolute inset-2 rounded-full bg-gradient-to-r from-brand-500 to-purple-600 animate-pulse flex items-center justify-center">
						{ /* AI Brain/Chip Icon */ }
						<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
						</svg>
					</div>
				</div>
				{ /* Floating particles */ }
				<div className="absolute -top-2 -left-2 w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={ { animationDelay: '0s' } }></div>
				<div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={ { animationDelay: '0.2s' } }></div>
				<div className="absolute -bottom-2 -right-1 w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={ { animationDelay: '0.4s' } }></div>
				<div className="absolute -bottom-1 -left-3 w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={ { animationDelay: '0.6s' } }></div>
			</div>

			{ /* Loading text with typing effect */ }
			<div className="text-center">
				<h3 className="text-xl font-semibold text-slate-800 mb-2">
					{ __( 'AI Blogger', 'auto-ai-blogger' ) }
				</h3>
				<div className="flex items-center justify-center space-x-1">
					<span className="text-slate-600 font-medium">
						{ __( 'Initializing AI Engine', 'auto-ai-blogger' ) }
					</span>
				</div>
			</div>

			{ /* Progress bar */ }
			<div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
				<div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full animate-pulse"></div>
			</div>
		</div>
	</div>
);

/**
 * Main Entry component with enhanced state management and performance optimization
 */
const Entry = () => {
	const dispatch = useDispatch();

	// Memoized selectors for better performance
	const appState = useSelector( ( state ) => ( {
		initialStateSetFlag: state.initialStateSetFlag,
		userOnboarded: state.userOnboarded,
		isLoading: state.isLoading,
		error: state.error,
	} ) );

	// Memoize the component to render based on app state
	const componentToRender = useMemo( () => {
		const { initialStateSetFlag, userOnboarded, isLoading, error } = appState;

		// Show loader if initial state is not set or app is loading
		if ( ! initialStateSetFlag || isLoading ) {
			return 'loader';
		}

		// Show error state if there's an error
		if ( error ) {
			return 'error';
		}

		// Show Dashboard if user is onboarded, otherwise show Wizard
		return userOnboarded ? 'dashboard' : 'wizard';
	}, [ appState ] );

	// Initialize app state on mount
	useEffect( () => {
		// Only dispatch if the flag hasn't been set yet
		if ( ! appState.initialStateSetFlag ) {
			dispatch( {
				type: 'UPDATE_INITIAL_STATE_FLAG',
				payload: true,
			} );
		}
	}, [ appState.initialStateSetFlag, dispatch ] ); // Include dependencies

	// Error recovery function
	const handleErrorRecovery = () => {
		dispatch( { type: 'CLEAR_ERROR' } );
		dispatch( {
			type: 'UPDATE_INITIAL_STATE_FLAG',
			payload: false,
		} );
	};

	// Render based on computed component type
	switch ( componentToRender ) {
		case 'loader':
			return <AppLoader />;

		case 'error':
			return (
				<div
					className="min-h-screen flex items-center justify-center bg-slate-50 p-6"
					role="alert"
					aria-live="assertive"
				>
					<div className="text-center max-w-md">
						<div className="mb-6">
							<svg
								className="mx-auto h-16 w-16 text-red-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={ 1.5 }
									d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
								/>
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-slate-900 mb-3">
							{ __( 'Application Error', 'auto-ai-blogger' ) }
						</h1>
						<p className="text-slate-600 mb-6">
							{ appState.error || __( 'An unexpected error occurred while loading the application.', 'auto-ai-blogger' ) }
						</p>
						<div className="space-y-3">
							<button
								onClick={ handleErrorRecovery }
								className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
								type="button"
							>
								{ __( 'Try Again', 'auto-ai-blogger' ) }
							</button>
							<button
								onClick={ () => window.location.reload() }
								className="w-full inline-flex justify-center items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
								type="button"
							>
								{ __( 'Reload Page', 'auto-ai-blogger' ) }
							</button>
						</div>
					</div>
				</div>
			);

		case 'dashboard':
			return (
				<Suspense fallback={ <RouteLoader /> }>
					<Dashboard />
				</Suspense>
			);

		case 'wizard':
			return (
				<Suspense fallback={ <RouteLoader /> }>
					<Wizard />
				</Suspense>
			);

		default:
			return <AppLoader />;
	}
};

export default Entry;
