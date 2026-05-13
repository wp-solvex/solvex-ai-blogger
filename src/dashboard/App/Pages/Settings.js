import React, { memo, useCallback, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import Bell from 'lucide-react/dist/esm/icons/bell';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@Utils/cn';
import { toast } from '@Utils/toast';
import { updateApiData } from '@Utils/ApiData';
import General from './Settings/General';
import Notifications from './Settings/Notifications';
import License from './Settings/License';

// Maps Redux state keys -> AJAX allowlist keys (must stay camelCase to match
// Settings::get_settings_dataset).
const SAVE_KEYS = {
	general: [
		'siteTitle',
		'siteFor',
		'siteDescription',
		'temperature',
		'harassment',
		'hate',
		'sexuallyExplicit',
		'dangerousContent',
	],
	notifications: [ 'emailNotificationEnabled', 'emailNotificationValue' ],
	// License has its own activate/deactivate flow; nothing to bulk-save here.
	license: [],
};

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
	const dispatch = useDispatch();

	const homeSlug = useSelector( ( s ) => s.homeSlug ) || 'solvex-ai-blogger';
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const siteTitle = useSelector( ( s ) => s.siteTitle ) || '';
	const siteFor = useSelector( ( s ) => s.siteFor ) || '';
	const siteDescription = useSelector( ( s ) => s.siteDescription ) || '';
	const temperature = useSelector( ( s ) => s.temperature ?? 1 );
	const harassment = useSelector( ( s ) => s.harassment ?? 2 );
	const hate = useSelector( ( s ) => s.hate ?? 2 );
	const sexuallyExplicit = useSelector( ( s ) => s.sexuallyExplicit ?? 2 );
	const dangerousContent = useSelector( ( s ) => s.dangerousContent ?? 2 );
	const emailEnabled = useSelector( ( s ) => Boolean( s.emailNotificationEnabled ) );
	const emailValue = useSelector( ( s ) => s.emailNotificationValue || '' );

	const [ saving, setSaving ] = useState( false );

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

	const handleSave = useCallback( async () => {
		if ( saving ) {
			return;
		}
		setSaving( true );

		const values = {
			siteTitle,
			siteFor,
			siteDescription,
			temperature,
			harassment,
			hate,
			sexuallyExplicit,
			dangerousContent,
			emailNotificationEnabled: emailEnabled,
			emailNotificationValue: emailValue,
		};

		const keysToSave = SAVE_KEYS[ activeId ] || [];
		if ( ! keysToSave.length ) {
			toast.success( __( 'Nothing to save here.', 'solvex-ai-blogger' ) );
			setSaving( false );
			return;
		}

		const results = await Promise.allSettled(
			keysToSave.map( ( key ) =>
				updateApiData( key, values[ key ] ?? '', dispatch )
			)
		);
		const failed = results.filter( ( r ) => r.status === 'rejected' );

		if ( failed.length === 0 ) {
			toast.success( __( 'Settings saved', 'solvex-ai-blogger' ) );
		} else {
			toast.error(
				__( 'Some settings failed to save. Please retry.', 'solvex-ai-blogger' )
			);
		}
		setSaving( false );
	}, [
		saving,
		dispatch,
		activeId,
		siteTitle,
		siteFor,
		siteDescription,
		temperature,
		harassment,
		hate,
		sexuallyExplicit,
		dangerousContent,
		emailEnabled,
		emailValue,
	] );

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
								<li key={ section.id } className="m-0">
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
				<div className="flex items-center justify-between rounded-xl border border-border bg-linear-to-r from-brand-soft/40 via-card to-card px-5 py-4 ring-1 ring-black/2">
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
						disabled={ saving || ! SAVE_KEYS[ activeId ]?.length }
						className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{ saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" /> }
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
