import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiClassNames } from '@Utils/aiClassNames';
import { General, Notifications, License } from '@Elements/Settings';
import ContentHeader from '@Components/ContentHeader';
import { useSettingsSelector } from '@Utils/useSettingsSelector';
import { TriangleAlert, ChevronRight, Loader2, Bell, Settings2, Key } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';

// Enhanced tab type definitions
const TAB_IDS = {
	GENERAL: 'general',
	NOTIFICATIONS: 'notifications',
	LICENSE: 'license',
};

// Memoized navigation item component
const NavigationItem = memo( ( {
	item,
	currentTab,
	onTabChange,
	licenseEnabled,
	siteDetailedUnfilled,
	isLoading,
} ) => {
	const isActive = currentTab === item.slug;
	const showLicenseWarning = item.slug === 'license' && ! licenseEnabled;
	const showGeneralWarning = item.slug === 'general' && siteDetailedUnfilled;

	const handleClick = useCallback( ( e ) => {
		e.preventDefault();
		if ( ! isLoading && item.slug !== currentTab ) {
			onTabChange( item.slug );
		}
	}, [ item.slug, currentTab, onTabChange, isLoading ] );

	const handleKeyDown = useCallback( ( e ) => {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			handleClick( e );
		}
	}, [ handleClick ] );

	return (
		<li>
			<button
				type="button"
				onClick={ handleClick }
				onKeyDown={ handleKeyDown }
				disabled={ isLoading }
				className={ aiClassNames(
					isActive
						? 'bg-gray-50 text-brand border-brand'
						: 'text-gray-700 hover:bg-gray-50 hover:text-brand border-transparent',
					'group flex items-center justify-between gap-x-3 rounded-md py-3 pl-3 pr-4 text-sm font-semibold cursor-pointer w-full text-left border transition-all duration-200',
					isLoading && 'opacity-50 cursor-not-allowed',
					'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2'
				) }
				aria-current={ isActive ? 'page' : undefined }
				aria-describedby={ showLicenseWarning || showGeneralWarning ? `${ item.slug }-warning` : undefined }
			>
				<span className="flex items-center gap-3">
					{ isLoading && currentTab === item.slug ? (
						<Loader2 className="size-5 animate-spin text-brand" aria-hidden="true" />
					) : (
						<item.icon
							aria-hidden="true"
							className={ aiClassNames(
								isActive ? 'text-brand' : 'text-gray-400 group-hover:text-brand',
								'size-5 shrink-0 transition-colors'
							) }
						/>
					) }
					<span className="font-medium">{ item.name }</span>
				</span>

				<div className="flex items-center gap-2">
					{ showLicenseWarning && (
						<span
							id={ `${ item.slug }-warning` }
							className="flex"
							aria-label={ __( 'License is Required', 'solvex-ai-blogger' ) }
						>
							<TriangleAlert className="w-4 h-4 text-orange-400" aria-hidden="true" />
						</span>
					) }
					{ showGeneralWarning && (
						<span
							id={ `${ item.slug }-warning` }
							className="flex"
							aria-label={ __( 'All site details are required', 'solvex-ai-blogger' ) }
						>
							<TriangleAlert className="w-4 h-4 text-orange-400" aria-hidden="true" />
						</span>
					) }
					<ChevronRight
						className={ aiClassNames(
							'w-4 h-4 transition-transform',
							isActive ? 'rotate-90 text-brand' : 'text-gray-400'
						) }
						aria-hidden="true"
					/>
				</div>
			</button>
		</li>
	);
} );

NavigationItem.displayName = 'SettingsNavigationItem';

function Settings() {
	const location = useLocation();
	const navigate = useNavigate();
	const siteTitle = useSelector( ( state ) => state.siteTitle ) || '';
	const siteFor = useSelector( ( state ) => state.siteFor ) || '';
	const siteDescription = useSelector( ( state ) => state.siteDescription ) || '';

	// Get initial tab from URL parameters
	const getInitialTab = useCallback( () => {
		try {
			const searchParams = new URLSearchParams( location.search );
			const urlTab = searchParams.get( 'tab' );

			// Validate that the tab exists in our TAB_IDS
			if ( urlTab && Object.values( TAB_IDS ).includes( urlTab ) ) {
				return urlTab;
			}
		} catch ( error ) {
			console.warn( 'Error parsing URL tab parameter:', error );
		}
		return TAB_IDS.GENERAL;
	}, [ location.search ] );

	const [ currentTab, setCurrentTab ] = useState( getInitialTab );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ loadError, setLoadError ] = useState( null );

	const settings = useSettingsSelector();	// Memoized navigation configuration.

	const navigationConfig = useMemo( () => [
		{
			name: __( 'General', 'solvex-ai-blogger' ),
			slug: TAB_IDS.GENERAL,
			icon: Settings2,
			component: General,
			description: __( 'Basic site settings and configuration', 'solvex-ai-blogger' ),
		},
		{
			name: __( 'Notifications', 'solvex-ai-blogger' ),
			slug: TAB_IDS.NOTIFICATIONS,
			icon: Bell,
			component: Notifications,
			description: __( 'Manage email and push notifications', 'solvex-ai-blogger' ),
		},
		{
			name: __( 'License', 'solvex-ai-blogger' ),
			slug: TAB_IDS.LICENSE,
			icon: Key,
			component: License,
			description: __( 'License activation and management', 'solvex-ai-blogger' ),
		},
	], [] );

	// Memoized computed values - Use Redux state instead of localized data
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';
	const licenseEnabled = useMemo( () => licenseStatus === 'licensed', [ licenseStatus ] );

	const siteDetailedUnfilled = useMemo( () =>
		! siteTitle || ! siteFor || ! siteDescription,
	[ siteTitle, siteFor, siteDescription ]
	);

	// Filter navigation based on license status
	const availableNavigation = useMemo( () => {
		if ( ! licenseEnabled ) {
			return navigationConfig.filter( ( item ) => item.slug !== TAB_IDS.NOTIFICATIONS );
		}
		return navigationConfig;
	}, [ navigationConfig, licenseEnabled ] );

	// Enhanced tab change handler with URL sync
	const handleTabChange = useCallback( async ( newTab ) => {
		if ( newTab === currentTab ) {
			return;
		}

		setIsLoading( true );
		setLoadError( null );

		try {
			setCurrentTab( newTab );

			// Update URL to reflect tab change
			const searchParams = new URLSearchParams( location.search );
			if ( newTab === TAB_IDS.GENERAL ) {
				// Remove tab parameter for general tab (default)
				searchParams.delete( 'tab' );
			} else {
				searchParams.set( 'tab', newTab );
			}

			// Update URL without triggering a page reload
			const newSearch = searchParams.toString();
			const newUrl = `${ location.pathname }${ newSearch ? `?${ newSearch }` : '' }`;
			navigate( newUrl, { replace: true } );
		} catch ( error ) {
			console.error( 'Error changing tab:', error );
			setLoadError( __( 'Failed to load settings page', 'solvex-ai-blogger' ) );
		} finally {
			setIsLoading( false );
		}
	}, [ currentTab, location.search, location.pathname, navigate ] );

	// Get current tab data
	const currentTabData = useMemo( () =>
		availableNavigation.find( ( item ) => item.slug === currentTab ) || availableNavigation[ 0 ],
	[ availableNavigation, currentTab ]
	);

	// Keyboard navigation for tabs
	const handleKeyNavigation = useCallback( ( e ) => {
		if ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
			e.preventDefault();
			const currentIndex = availableNavigation.findIndex( ( item ) => item.slug === currentTab );
			let nextIndex;

			if ( e.key === 'ArrowDown' ) {
				nextIndex = ( currentIndex + 1 ) % availableNavigation.length;
			} else {
				nextIndex = currentIndex === 0 ? availableNavigation.length - 1 : currentIndex - 1;
			}

			handleTabChange( availableNavigation[ nextIndex ].slug );
		}
	}, [ availableNavigation, currentTab, handleTabChange ] );

	// Ensure current tab is valid
	useEffect( () => {
		if ( ! availableNavigation.some( ( item ) => item.slug === currentTab ) ) {
			setCurrentTab( availableNavigation[ 0 ]?.slug || TAB_IDS.GENERAL );
		}
	}, [ availableNavigation, currentTab ] );

	// Handle external URL tab parameter changes (like from "Activate License" button)
	useEffect( () => {
		const urlTab = getInitialTab();
		// Only update if the URL tab is different from current tab and is valid
		if ( urlTab !== currentTab && availableNavigation.some( ( item ) => item.slug === urlTab ) ) {
			setCurrentTab( urlTab );
		}
	}, [ location.search, getInitialTab, availableNavigation ] ); // Removed currentTab to prevent conflicts

	if ( loadError ) {
		return (
			<div
				className="flex flex-col items-center justify-center p-8 text-center bg-red-50 border border-red-200 rounded-lg m-4"
				role="alert"
				aria-describedby="error-description"
			>
				<TriangleAlert className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
				<h2 className="text-lg font-semibold text-red-800 mb-2">
					{ __( 'Settings Error', 'solvex-ai-blogger' ) }
				</h2>
				<p id="error-description" className="text-red-600 mb-4">
					{ loadError }
				</p>
				<button
					onClick={ () => {
						setLoadError( null );
						setCurrentTab( TAB_IDS.GENERAL );
					} }
					className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
				>
					{ __( 'Retry', 'solvex-ai-blogger' ) }
				</button>
			</div>
		);
	}

	return (
		<div className="mx-auto lg:flex lg:gap-x-0 h-full">
			{ /* Enhanced sidebar navigation */ }
			<aside
				className="flex overflow-x-auto lg:block lg:w-72 py-8 px-4 lg:flex-none settings-nav bg-white h-screen"
				aria-label={ __( 'Settings navigation', 'solvex-ai-blogger' ) }
			>
				<nav
					className="flex-none px-4 sm:px-6 lg:px-0"
					role="navigation"
					aria-label={ __( 'Settings sections', 'solvex-ai-blogger' ) }
				>
					<ul
						className="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col"
						role="tablist"
						onKeyDown={ handleKeyNavigation }
						aria-orientation="vertical"
					>
						{ availableNavigation.map( ( item ) => (
							<NavigationItem
								key={ item.slug }
								item={ item }
								currentTab={ currentTab }
								onTabChange={ handleTabChange }
								licenseEnabled={ licenseEnabled }
								siteDetailedUnfilled={ siteDetailedUnfilled }
								isLoading={ isLoading }
							/>
						) ) }
					</ul>
				</nav>
			</aside>

			{ /* Enhanced main content area */ }
			<main
				className="px-4 sm:px-6 lg:flex-auto py-8 bg-gray-50"
				role="main"
				aria-label={ __( 'Settings content', 'solvex-ai-blogger' ) }
			>
				<div className="mx-auto max-w-3xl">
					{ /* Enhanced content header with current tab info */ }
					<ContentHeader
						title={ currentTabData?.name }
						description={ currentTabData?.description }
						tab={ currentTab }
						icon={ currentTabData?.icon }
						{ ...settings }
					/>

					{ /* Tab panels with proper ARIA roles */ }
					<div className="mt-6">
						{ availableNavigation.map( ( item ) => (
							<div
								key={ item.slug }
								role="tabpanel"
								id={ `${ item.slug }-panel` }
								aria-labelledby={ `${ item.slug }-tab` }
								className={ aiClassNames(
									currentTab === item.slug ? 'block' : 'hidden'
								) }
								tabIndex={ currentTab === item.slug ? 0 : -1 }
							>
								{ /* Loading state */ }
								{ isLoading && currentTab === item.slug ? (
									<div
										className="flex items-center justify-center py-12"
										aria-label={ __( 'Loading settings…', 'solvex-ai-blogger' ) }
									>
										<Loader2 className="w-8 h-8 animate-spin text-brand" aria-hidden="true" />
										<span className="ml-2 text-gray-600">
											{ __( 'Loading…', 'solvex-ai-blogger' ) }
										</span>
									</div>
								) : (
									currentTab === item.slug && (
										item.component ? React.createElement( item.component ) : item.renderContent ? item.renderContent() : null
									)
								) }
							</div>
						) ) }
					</div>
				</div>
			</main>
		</div>
	);
}

// Add display name for debugging
Settings.displayName = 'Settings';

export default memo( Settings );
