import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Error component for invalid routes or access denied
 *
 * @param {Object} props                    Component properties
 * @param {string} [props.type='not-found'] Type of error to display
 * @param {string} [props.message]          Custom error message
 * @return {JSX.Element} Rendered error message
 */
const RouteError = ( { type = 'not-found', message } ) => {
	const errorMessages = {
		'not-found': __( 'Page not found. Please check the URL and try again.', 'solvex-ai-blogger' ),
		'access-denied': __( 'Access denied. This feature requires a connected account.', 'solvex-ai-blogger' ),
		'invalid-page': __( 'Invalid page parameter. Please navigate from the main menu.', 'solvex-ai-blogger' ),
		generic: message || __( 'Something went wrong. Please try again.', 'solvex-ai-blogger' ),
	};

	const getErrorTitle = () => {
		switch ( type ) {
			case 'not-found':
				return __( '404 - Page Not Found', 'solvex-ai-blogger' );
			case 'access-denied':
				return __( 'Access Denied', 'solvex-ai-blogger' );
			case 'invalid-page':
				return __( 'Invalid Page', 'solvex-ai-blogger' );
			default:
				return __( 'Error', 'solvex-ai-blogger' );
		}
	};

	return (
		<div
			className="flex items-center justify-center min-h-[400px] p-6"
			role="alert"
			aria-live="assertive"
		>
			<div className="text-center max-w-md">
				<div className="mb-4">
					<svg
						className="mx-auto h-16 w-16 text-slate-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={ 1 }
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<h1 className="text-2xl font-bold text-slate-900 mb-2">
					{ getErrorTitle() }
				</h1>
				<p className="text-slate-600 mb-6">
					{ errorMessages[ type ] }
				</p>
				<button
					onClick={ () => {
						window.location.href = '?page=solvex-ai-blogger';
					} }
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
					type="button"
				>
					{ __( 'Go to Welcome Page', 'solvex-ai-blogger' ) }
				</button>
			</div>
		</div>
	);
};

// Import all components to test after fixing double lazy loading
import Welcome from '@DashboardApp/Pages/Welcome';
import Settings from '@DashboardApp/Pages/Settings';
import FreeVsPro from '@DashboardApp/Pages/FreeVsPro';
import Campaigns from '@DashboardApp/Pages/Campaigns';

/**
 * Route mapping with metadata
 */
const ROUTE_MAP = {
	'getting-started': {
		component: Welcome,
		title: __( 'Getting Started', 'solvex-ai-blogger' ),
		requiresLicense: false,
	},
	'': {
		component: Welcome,
		title: __( 'Welcome', 'solvex-ai-blogger' ),
		requiresLicense: false,
	},
	settings: {
		component: Settings,
		title: __( 'Settings', 'solvex-ai-blogger' ),
		requiresLicense: false,
	},
	'free-vs-pro': {
		component: FreeVsPro,
		title: __( 'Free vs Pro', 'solvex-ai-blogger' ),
		requiresLicense: false,
	},
	campaigns: {
		component: Campaigns,
		title: __( 'Campaigns', 'solvex-ai-blogger' ),
		requiresLicense: true,
	},
};

/**
 * Enhanced PagesRoute component with better error handling and performance
 */
const PagesRoute = () => {
	const { search } = useLocation();

	// Redux selectors
	const homeSlug = useSelector( ( state ) => state.homeSlug ) || 'solvex-ai-blogger';
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';

	// Memoize URL parsing with safe data access.
	const { path, isValidPage } = useMemo( () => {
		try {
			const query = new URLSearchParams( search );
			const currentPage = query.get( 'page' ) || '';
			const currentPath = query.get( 'path' ) || '';

			// Safely access localized data
			const currentHomeSlug = homeSlug;

			// A missing `page` query param is treated as valid: the React bundle
			// only loads from the plugin admin page (where `page=<slug>` is
			// guaranteed by PHP), so a missing param here just means an internal
			// SPA navigation dropped it (e.g. wizard `navigate('?step=...')` which
			// replaces the whole search string). Only flag as invalid when a page
			// is set AND it doesn't match the home slug.
			return {
				page: currentPage,
				path: currentPath,
				isValidPage: ! currentPage || currentPage === currentHomeSlug,
			};
		} catch ( error ) {
			console.warn( 'Error parsing URL parameters:', error );
			return {
				page: '',
				path: '',
				isValidPage: false,
			};
		}
	}, [ search, homeSlug ] );

	// Memoize license status with safe data access
	const isLicensed = useMemo( () => {
		return licenseStatus === 'licensed';
	}, [ licenseStatus ] );

	// Handle invalid page parameter
	if ( ! isValidPage ) {
		return <RouteError type="invalid-page" />;
	}

	// Get route configuration safely
	const routeConfig = ROUTE_MAP[ path ] || ROUTE_MAP[ '' ];

	const { component: Component, title } = routeConfig;

	// Set document title for better UX and SEO.
	React.useEffect( () => { // eslint-disable-line
		try {
			if ( title ) {
				const originalTitle = document.title;
				document.title = `${ title } - Solvex AI Blogger`;

				// Cleanup on unmount
				return () => {
					document.title = originalTitle;
				};
			}
		} catch ( error ) {
			console.warn( 'Error setting document title:', error );
		}
	}, [ title ] );

	// Handle route not found
	if ( ! routeConfig ) {
		return <RouteError type="not-found" />;
	}

	// Handle license requirement
	if ( routeConfig.requiresLicense && ! isLicensed ) {
		return <RouteError type="access-denied" />;
	}

	// Render with error handling
	try {
		return (
			<div className="solvex-ai-blogger-page" data-page={ path || 'welcome' }>
				<Component />
			</div>
		);
	} catch ( error ) {
		console.error( 'Error rendering PagesRoute:', error );
		return <RouteError type="generic" message="Failed to render page" />;
	}
};

export default PagesRoute;
