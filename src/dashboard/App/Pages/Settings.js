import React, { memo, useCallback, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import Bell from 'lucide-react/dist/esm/icons/bell';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import { cn } from '@Utils/cn';
import General from './Settings/General';
import Notifications from './Settings/Notifications';
import License from './Settings/License';

const SECTIONS = [
	{
		id: 'general',
		path: 'settings',
		label: __( 'General', 'solvex-ai-blogger' ),
		description: __( 'Persona, creativity, and content safety.', 'solvex-ai-blogger' ),
		icon: Settings2,
		Component: General,
	},
	{
		id: 'notifications',
		path: 'settings/notifications',
		label: __( 'Notifications', 'solvex-ai-blogger' ),
		description: __( 'Email alerts for campaign events.', 'solvex-ai-blogger' ),
		icon: Bell,
		Component: Notifications,
	},
	{
		id: 'license',
		path: 'settings/license',
		label: __( 'License', 'solvex-ai-blogger' ),
		description: __( 'Activate or deactivate your license key.', 'solvex-ai-blogger' ),
		icon: KeyRound,
		Component: License,
	},
];

function Settings() {
	const location = useLocation();
	const navigate = useNavigate();

	const homeSlug = useSelector( ( s ) => s.homeSlug ) || 'solvex-ai-blogger';
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const siteTitle = useSelector( ( s ) => s.siteTitle ) || '';
	const siteFor = useSelector( ( s ) => s.siteFor ) || '';
	const siteDescription = useSelector( ( s ) => s.siteDescription ) || '';
	const emailEnabled = useSelector( ( s ) => Boolean( s.emailNotificationEnabled ) );
	const emailValue = useSelector( ( s ) => s.emailNotificationValue || '' );

	const activeId = useMemo( () => {
		const path = new URLSearchParams( location.search ).get( 'path' ) || '';
		if ( path === 'settings/notifications' ) {
			return 'notifications';
		}
		if ( path === 'settings/license' ) {
			return 'license';
		}
		return 'general';
	}, [ location.search ] );

	const warnings = useMemo( () => {
		const generalIncomplete = ! siteTitle || ! siteFor || ! siteDescription;
		return {
			general: generalIncomplete,
			notifications: emailEnabled && ! ( emailValue || '' ).trim(),
			license: licenseStatus !== 'licensed',
		};
	}, [ siteTitle, siteFor, siteDescription, emailEnabled, emailValue, licenseStatus ] );

	const handleNavigate = useCallback(
		( e, path ) => {
			e.preventDefault();
			navigate( `?page=${ homeSlug }&path=${ path }`, { replace: false } );
		},
		[ navigate, homeSlug ]
	);

	const ActivePanel = SECTIONS.find( ( s ) => s.id === activeId )?.Component || General;
	const activeMeta = SECTIONS.find( ( s ) => s.id === activeId );

	return (
		<div className="animate-reveal grid grid-cols-12 gap-10">
			<aside className="col-span-12 lg:col-span-3">
				<header className="mb-6">
					<h1 className="text-2xl font-semibold tracking-tight">
						{ __( 'Settings', 'solvex-ai-blogger' ) }
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Configure your blog\'s voice, alerts, and license.', 'solvex-ai-blogger' ) }
					</p>
				</header>
				<nav aria-label={ __( 'Settings navigation', 'solvex-ai-blogger' ) }>
					<ul className="space-y-1">
						{ SECTIONS.map( ( section ) => {
							const Icon = section.icon;
							const isActive = section.id === activeId;
							const hasWarning = warnings[ section.id ];
							return (
								<li key={ section.id }>
									<Link
										to={ { search: `?page=${ homeSlug }&path=${ section.path }` } }
										onClick={ ( e ) => handleNavigate( e, section.path ) }
										aria-current={ isActive ? 'page' : undefined }
										className={ cn(
											'group flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors',
											isActive
												? 'bg-brand/10 text-brand'
												: 'text-muted-foreground hover:bg-muted hover:text-foreground'
										) }
									>
										<span className="flex items-center gap-3">
											<Icon
												className={ cn(
													'size-4 transition-colors',
													isActive ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground'
												) }
												aria-hidden="true"
											/>
											{ section.label }
										</span>
										{ hasWarning && (
											<span
												className="size-2 rounded-full bg-destructive"
												aria-label={ __( 'Needs attention', 'solvex-ai-blogger' ) }
											/>
										) }
									</Link>
								</li>
							);
						} ) }
					</ul>
				</nav>
			</aside>

			<main
				className="col-span-12 lg:col-span-9"
				aria-label={ activeMeta?.label }
			>
				<header className="mb-6 hidden lg:block">
					<h2 className="text-xl font-semibold tracking-tight">{ activeMeta?.label }</h2>
					<p className="mt-1 text-sm text-muted-foreground">{ activeMeta?.description }</p>
				</header>
				<ActivePanel />
			</main>
		</div>
	);
}

Settings.displayName = 'Settings';

export default memo( Settings );
