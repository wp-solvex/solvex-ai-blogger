import React, { memo, useCallback, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import Bell from 'lucide-react/dist/esm/icons/bell';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { cn } from '@Utils/cn';
import { toast } from '@Utils/toast';
import General from './Settings/General';
import Notifications from './Settings/Notifications';
import License from './Settings/License';

const SECTIONS = [
	{
		id: 'general',
		path: 'settings',
		label: __( 'General', 'solvex-ai-blogger' ),
		headerLabel: __( 'General Settings', 'solvex-ai-blogger' ),
		icon: Settings2,
		Component: General,
	},
	{
		id: 'notifications',
		path: 'settings/notifications',
		label: __( 'Notifications', 'solvex-ai-blogger' ),
		headerLabel: __( 'Notification Settings', 'solvex-ai-blogger' ),
		icon: Bell,
		Component: Notifications,
	},
	{
		id: 'license',
		path: 'settings/license',
		label: __( 'License', 'solvex-ai-blogger' ),
		headerLabel: __( 'License Settings', 'solvex-ai-blogger' ),
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
	const ActiveIcon = activeMeta?.icon || Settings2;

	const handleSave = useCallback( () => {
		// Settings auto-save on change; this button confirms the state.
		toast.success( __( 'All changes saved', 'solvex-ai-blogger' ) );
	}, [] );

	return (
		<div className="animate-reveal grid grid-cols-12 gap-8">
			<aside className="col-span-12 lg:col-span-3">
				<nav
					aria-label={ __( 'Settings navigation', 'solvex-ai-blogger' ) }
					className="overflow-hidden rounded-xl border border-border bg-card ring-1 ring-black/[0.02]"
				>
					<ul className="divide-y divide-border">
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
											'group flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium no-underline transition-colors',
											isActive
												? 'bg-brand-soft/60 text-brand'
												: 'text-foreground hover:bg-muted/50'
										) }
									>
										<span className="flex items-center gap-3">
											<Icon
												className={ cn(
													'size-4 transition-colors',
													isActive ? 'text-brand' : 'text-muted-foreground'
												) }
												aria-hidden="true"
											/>
											{ section.label }
										</span>
										<span className="flex items-center gap-2">
											{ hasWarning && (
												<span
													className="size-2 rounded-full bg-destructive"
													aria-label={ __( 'Needs attention', 'solvex-ai-blogger' ) }
												/>
											) }
											<ChevronRight
												className={ cn(
													'size-3.5 transition-colors',
													isActive ? 'text-brand' : 'text-muted-foreground/60'
												) }
												aria-hidden="true"
											/>
										</span>
									</Link>
								</li>
							);
						} ) }
					</ul>
				</nav>
			</aside>

			<main
				className="col-span-12 space-y-6 lg:col-span-9"
				aria-label={ activeMeta?.label }
			>
				<div className="flex items-center justify-between rounded-xl border border-border bg-brand-soft/40 px-5 py-4 ring-1 ring-black/[0.02]">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
							<ActiveIcon className="size-4" aria-hidden="true" />
						</div>
						<h2 className="text-lg font-semibold tracking-tight">
							{ activeMeta?.headerLabel || activeMeta?.label }
						</h2>
					</div>
					<button
						type="button"
						onClick={ handleSave }
						className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
					>
						{ __( 'Save', 'solvex-ai-blogger' ) }
					</button>
				</div>
				<ActivePanel />
			</main>
		</div>
	);
}

Settings.displayName = 'Settings';

export default memo( Settings );
