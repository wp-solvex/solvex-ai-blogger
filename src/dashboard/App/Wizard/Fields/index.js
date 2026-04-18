import React, { lazy, Suspense } from 'react';

// Lazy load components for better performance
const NavigationBar = lazy( () => import( './NavigationBar' ) );
const FooterNavigationBar = lazy( () => import( './FooterNavigationBar' ) );

// Loading fallback component
const FieldLoader = () => (
	<div className="flex items-center justify-center p-4">
		<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
		<span className="ml-2 text-gray-600 text-sm">Loading...</span>
	</div>
);

// Enhanced exports with Suspense wrappers
export const NavigationBarWithSuspense = () => (
	<Suspense fallback={ <FieldLoader /> }>
		<NavigationBar />
	</Suspense>
);

export const FooterNavigationBarWithSuspense = ( props ) => (
	<Suspense fallback={ <FieldLoader /> }>
		<FooterNavigationBar { ...props } />
	</Suspense>
);

// Direct exports for backward compatibility
export { NavigationBar, FooterNavigationBar };

// Default export
export default {
	NavigationBar,
	FooterNavigationBar,
	NavigationBarWithSuspense,
	FooterNavigationBarWithSuspense,
};
