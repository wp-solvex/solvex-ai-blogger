import { __ } from '@wordpress/i18n';
import { Fragment, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandIcon from '@AppImages/brand-logo.svg';
import { CoreVersion, TokenDisplayAndRefresh } from '@Components/NavigationComponents';
import { useSelector } from 'react-redux';
import { Crown } from 'lucide-react';

/**
 * Enhanced MainNav component with better performance and accessibility
 */
export default function MainNav() {
	const location = useLocation();

	// Redux selectors for dynamic data
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';
	const homeSlug = useSelector( ( state ) => state.homeSlug ) || 'solvex-ai-blogger';
	const proPurchaseUrl = useSelector( ( state ) => state.proPurchaseUrl ) || 'https://wpaiblogger.com/#pricing';
	const proAvailable = useSelector( ( state ) => state.proAvailable ) || false;

	// Memoize license status to prevent unnecessary recalculations
	const licenseEnabled = useMemo( () => {
		return licenseStatus === 'licensed';
	}, [ licenseStatus ] );

	// Memoize navigation menus with proper filtering
	const navMenus = useMemo( () => {
		const baseMenus = [
			{
				name: __( 'Welcome', 'solvex-ai-blogger' ),
				slug: homeSlug,
				path: '',
				icon: null,
			},
			{
				name: __( 'Campaigns', 'solvex-ai-blogger' ),
				slug: homeSlug,
				path: 'campaigns',
				icon: null,
				requiresLicense: true,
			},
			{
				name: __( 'Settings', 'solvex-ai-blogger' ),
				slug: homeSlug,
				path: 'settings',
				icon: null,
			},
			{
				name: __( 'Free vs Pro', 'solvex-ai-blogger' ),
				slug: homeSlug,
				path: 'free-vs-pro',
				icon: null,
			},
		];

		// Filter out license-required menus if license is not enabled
		const filteredMenus = baseMenus.filter( ( menu ) => {
			return ! menu.requiresLicense || licenseEnabled;
		} );

		// Let's remove Free vs Pro tab if premium is already enabled as per solvex_aib_localized_data.pro_available.
		if ( proAvailable ) {
			filteredMenus.splice( 3, 1 );
		}

		// Apply WordPress hooks filter
		return wp?.hooks?.applyFilters?.( 'solvex_aib_dashboard.main_navigation', filteredMenus ) || filteredMenus;
	}, [ licenseEnabled, homeSlug ] );

	// Memoize URL query parsing
	const { activePage, activePath } = useMemo( () => {
		const query = new URLSearchParams( location?.search );
		return {
			activePage: query.get( 'page' ) || homeSlug,
			activePath: query.get( 'path' ) || '',
		};
	}, [ location?.search, homeSlug ] );

	// Memoized pro purchase handler
	const handleProPurchase = useCallback( ( event ) => {
		event.preventDefault();

		if ( proPurchaseUrl ) {
			try {
				window.open( proPurchaseUrl, '_blank', 'noopener,noreferrer' );
			} catch ( error ) {
				console.error( 'Failed to open pro purchase URL:', error );
				// Fallback to location.href
				window.location.href = proPurchaseUrl;
			}
		}
	}, [ proPurchaseUrl ] );

	return (
		<section className="bg-white header-nav" role="navigation" aria-label="Main navigation">
			<div className="max-w-3xl mx-auto px-3 sm:px-6 lg:max-w-full">
				<div className="relative flex flex-col lg:flex-row justify-between h-28 lg:h-16 py-3 lg:py-0">
					<div className="lg:flex-1 flex items-center justify-start">
						<span className="flex-shrink-0">
							<img
								className="block h-[30px] w-[30px]"
								src={ BrandIcon }
								alt="Solvex AI Blogger"
								loading="lazy"
								decoding="async"
							/>
						</span>

						<nav
							className="h-full ml-4 sm:ml-8 sm:flex gap-y-4 gap-x-8"
							aria-label="Primary navigation"
						>
							{ navMenus.map( ( menu ) => {
								const isActive = activePage === menu.slug && activePath === menu.path;
								const linkClasses = isActive
									? 'mb-4 sm:mb-0 border-brand text-brand hover:text-brand hover:border-brand inline-flex items-center px-1 border-b-2 text-sm leading-[0.875rem] font-medium cursor-pointer solvex-aib-menu solvex-aib-active-menu'
									: 'mb-4 sm:mb-0 border-slate-600 text-slate-600 hover:border-slate-500 hover:text-slate-500 inline-flex items-center px-1 border-b-2 text-sm leading-[0.875rem] font-medium cursor-pointer solvex-aib-menu';

								return (
									<Fragment key={ `${ menu.slug }-${ menu.path || 'home' }` }>
										<Link
											to={ {
												search: `?page=${ menu.slug }${ menu.path ? '&path=' + menu.path : '' }`,
											} }
											className={ linkClasses }
											aria-current={ isActive ? 'page' : undefined }
											aria-label={ menu.name }
										>
											{ menu.icon && (
												<span className="mr-2" aria-hidden="true">
													{ menu.icon }
												</span>
											) }
											{ menu.name }
										</Link>
									</Fragment>
								);
							} ) }
						</nav>
					</div>

					<div className="absolute bottom-2 lg:inset-y-0 right-0 flex items-center sm:static sm:inset-auto ml-auto lg:ml-6 sm:pr-0">
						{ ! proAvailable && (
							<div className="text-sm font-medium text-slate-600 hover:text-[#1E293B] hover:svg-hover-color pr-4">
								<button
									onClick={ handleProPurchase }
									className="inline-flex items-center cursor-pointer text-[#9138c8] hover:text-[#7c2fb0] focus-visible:text-[#7c2fb0] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded px-3 py-2 transition-colors duration-200 gap-2"
									aria-label={ __( 'Unlock Pro Features - Opens in new tab', 'solvex-ai-blogger' ) }
									type="button"
								>
									<Crown className="w-4 h-4" />
									{ __( 'Unlock Pro Features', 'solvex-ai-blogger' ) }
								</button>
							</div>
						) }

						{ ! proAvailable && <span className="solvex-aib-vertical-divider" /> }

						<TokenDisplayAndRefresh />

						<div
							className="flex items-center text-[0.625rem] sm:text-sm font-medium leading-[1.375rem] text-slate-400 gap-2 pl-4"
							aria-label="Version information"
						>
							<CoreVersion />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
