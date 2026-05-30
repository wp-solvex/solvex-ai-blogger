import { lazy, Suspense } from 'react';

// Lazy load wizard step components for better performance
const WelcomeStep = lazy( () => import( './WelcomeStep' ) );
const PersonaFormStep = lazy( () => import( './PersonaFormStep' ) );
const LicenseStep = lazy( () => import( './LicenseStep' ) );

// Enhanced loading component for step transitions
const StepLoadingFallback = () => (
	<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
		<div className="text-center">
			<div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
			<p className="text-gray-600 text-sm">Loading step...</p>
		</div>
	</div>
);

// Higher-order component to wrap steps with Suspense
const withSuspense = ( Component ) => ( props ) => (
	<Suspense fallback={ <StepLoadingFallback /> }>
		<Component { ...props } />
	</Suspense>
);

// Create wrapped components
const WrappedWelcomeStep = withSuspense( WelcomeStep );
const WrappedPersonaFormStep = withSuspense( PersonaFormStep );
const WrappedLicenseStep = withSuspense( LicenseStep );

// Export wrapped components
export {
	WrappedWelcomeStep as WelcomeStep,
	WrappedPersonaFormStep as PersonaFormStep,
	WrappedLicenseStep as LicenseStep,
};
