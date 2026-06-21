/**
 * Onboarding wizard — single file housing the layout shell and all 5 steps.
 *
 * Steps are URL-driven via `?step=welcome|persona-form|license|optin|ready`,
 * so users can deep-link or step back without losing position. Each step
 * keeps wiring to the existing AJAX/Redux flows; the visual language follows
 * radiant-blogger-studio/onboarding.tsx.
 */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import apiFetch from '@wordpress/api-fetch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import User from 'lucide-react/dist/esm/icons/user';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Mail from 'lucide-react/dist/esm/icons/mail';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import X from 'lucide-react/dist/esm/icons/x';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Globe from 'lucide-react/dist/esm/icons/globe';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';
import Gift from 'lucide-react/dist/esm/icons/gift';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Star from 'lucide-react/dist/esm/icons/star';
import Heart from 'lucide-react/dist/esm/icons/heart';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import { Label } from '@Components/ui/label';
import { cn } from '@Utils/cn';
import { toast } from '@Utils/toast';
import { updateApiData } from '@Utils/ApiData';
import useStoreConnect from '@DashboardApp/Hooks/useStoreConnect';
import { personaSchema, licenseSchema } from './Pages/Settings/schemas';

const STEPS = [
	{ key: 'welcome', label: __( 'Welcome', 'solvex-ai-blogger' ), icon: Settings2 },
	{ key: 'persona-form', label: __( 'Site Info', 'solvex-ai-blogger' ), icon: User },
	{ key: 'license', label: __( 'License', 'solvex-ai-blogger' ), icon: CreditCard },
	{ key: 'optin', label: __( 'Subscribe', 'solvex-ai-blogger' ), icon: Mail },
	{ key: 'ready', label: __( 'Done', 'solvex-ai-blogger' ), icon: CheckCircle2 },
];

const onboardingPersonaSchema = personaSchema.pick( {
	siteTitle: true,
	siteFor: true,
	siteDescription: true,
} );

const optinSchema = z.object( {
	userName: z.string().min( 2, 'First name must be at least 2 characters' ),
	userEmail: z.string().email( 'Enter a valid email address' ),
} );

function useStepNav() {
	const navigate = useNavigate();
	const location = useLocation();
	const homeSlug = useSelector( ( s ) => s.homeSlug ) || 'solvex-ai-blogger';

	const currentKey = useMemo( () => {
		const params = new URLSearchParams( location.search );
		return params.get( 'step' ) || 'welcome';
	}, [ location.search ] );

	const currentIndex = useMemo( () => {
		const i = STEPS.findIndex( ( s ) => s.key === currentKey );
		return i < 0 ? 0 : i;
	}, [ currentKey ] );

	const goTo = useCallback(
		( key ) => {
			navigate( `?page=${ homeSlug }&step=${ key }` );
			window.scrollTo( { top: 0, behavior: 'smooth' } );
		},
		[ navigate, homeSlug ]
	);

	return { currentKey, currentIndex, goTo };
}

function useFinishOnboarding() {
	const dispatch = useDispatch();
	return useCallback( async () => {
		dispatch( { type: 'UPDATE_USER_ONBOARDED', payload: true } );
		try {
			await updateApiData( 'userOnboarded', true, dispatch );
		} catch ( e ) {
			console.warn( 'Failed to persist userOnboarded:', e?.message );
		}
		const dashboardUrl =
			wpsolvex_autoaiblogger_localized_data?.admin_app_url ||
			( ( wpsolvex_autoaiblogger_localized_data?.admin_base_url || '/wp-admin/edit.php' ) + '?page=solvex-ai-blogger' );
		window.location.href = dashboardUrl;
	}, [ dispatch ] );
}

function FieldRow( { label, htmlFor, hint, error, icon: Icon, required, children } ) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor={ htmlFor } className="flex items-center gap-1.5 text-sm font-medium">
				{ Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" /> }
				{ label }
				{ required && <span className="text-destructive">*</span> }
			</Label>
			{ children }
			{ error ? (
				<p className="text-xs text-destructive">{ error }</p>
			) : hint ? (
				<p className="text-xs text-muted-foreground">{ hint }</p>
			) : null }
		</div>
	);
}

function StepHeader( { step, title, subtitle } ) {
	const progress = ( ( step + 1 ) / STEPS.length ) * 100;
	return (
		<div className="mb-8 text-center">
			<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
				{ __( 'Step', 'solvex-ai-blogger' ) } { step + 1 } { __( 'of', 'solvex-ai-blogger' ) } { STEPS.length }
			</span>
			<h1 className="mt-4 text-3xl font-bold tracking-tight">{ title }</h1>
			{ subtitle && (
				<p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{ subtitle }</p>
			) }
			<div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-border">
				<div className="h-full bg-brand transition-all duration-500" style={ { width: `${ progress }%` } } />
			</div>
		</div>
	);
}

const WelcomePane = memo( function WelcomePane( { onStart } ) {
	const cards = [
		{ icon: Sparkles, title: __( 'AI Content Generation', 'solvex-ai-blogger' ), desc: __( 'Create engaging blog posts automatically.', 'solvex-ai-blogger' ) },
		{ icon: Zap, title: __( 'Quick Setup', 'solvex-ai-blogger' ), desc: __( 'Ready in under 5 minutes.', 'solvex-ai-blogger' ) },
		{ icon: Globe, title: __( 'Automated Scheduling', 'solvex-ai-blogger' ), desc: __( 'Schedule AI-generated posts on cadence.', 'solvex-ai-blogger' ) },
	];
	return (
		<div className="text-center">
			<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
				<Sparkles className="size-3" aria-hidden="true" />
				{ __( 'Step 1 of 5', 'solvex-ai-blogger' ) }
			</span>
			<h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
				{ __( 'Turn ideas into', 'solvex-ai-blogger' ) }
				<br />
				<span className="text-brand">{ __( 'AI-powered blogs', 'solvex-ai-blogger' ) }</span>
			</h1>
			<p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
				{ __( 'Set once and forget — automatically publish high-quality blog posts on schedule.', 'solvex-ai-blogger' ) }
			</p>
			<button
				type="button"
				onClick={ onStart }
				className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] hover:brightness-110"
			>
				{ __( 'Start Building', 'solvex-ai-blogger' ) }
				<ArrowRight className="size-4" aria-hidden="true" />
			</button>
			<div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
				{ cards.map( ( c ) => (
					<div key={ c.title } className="rounded-xl border border-border bg-card p-5 ring-1 ring-black/[0.02]">
						<div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
							<c.icon className="size-4" aria-hidden="true" />
						</div>
						<h3 className="mt-3 text-sm font-semibold">{ c.title }</h3>
						<p className="mt-1 text-xs text-muted-foreground">{ c.desc }</p>
					</div>
				) ) }
			</div>
		</div>
	);
} );

const SiteInfoPane = memo( function SiteInfoPane( { onContinue } ) {
	const dispatch = useDispatch();
	const reduxSiteTitle = useSelector( ( s ) => s.siteTitle || '' );
	const reduxSiteFor = useSelector( ( s ) => s.siteFor || '' );
	const reduxSiteDescription = useSelector( ( s ) => s.siteDescription || '' );

	const form = useForm( {
		resolver: zodResolver( onboardingPersonaSchema ),
		defaultValues: {
			siteTitle: reduxSiteTitle,
			siteFor: reduxSiteFor,
			siteDescription: reduxSiteDescription,
		},
		mode: 'onChange',
	} );

	const { register, handleSubmit, formState } = form;
	const { errors, isSubmitting, isValid } = formState;

	const onSubmit = useCallback(
		async ( values ) => {
			dispatch( { type: 'UPDATE_SITE_TITLE', payload: values.siteTitle.trim() } );
			dispatch( { type: 'UPDATE_SITE_FOR', payload: values.siteFor.trim() } );
			dispatch( { type: 'UPDATE_SITE_DESCRIPTION', payload: values.siteDescription.trim() } );

			try {
				await Promise.all( [
					updateApiData( 'siteTitle', values.siteTitle.trim(), dispatch ),
					updateApiData( 'siteFor', values.siteFor.trim(), dispatch ),
					updateApiData( 'siteDescription', values.siteDescription.trim(), dispatch ),
				] );
				onContinue();
			} catch ( e ) {
				toast.error( e?.message || __( 'Failed to save site info.', 'solvex-ai-blogger' ) );
			}
		},
		[ dispatch, onContinue ]
	);

	return (
		<>
			<StepHeader
				step={ 1 }
				title={ __( 'Tell us about your site', 'solvex-ai-blogger' ) }
				subtitle={ __( 'Help the AI understand your audience and tone.', 'solvex-ai-blogger' ) }
			/>
			<form
				onSubmit={ handleSubmit( onSubmit ) }
				className="space-y-5 rounded-xl border border-border bg-card p-8 ring-1 ring-black/[0.02]"
				noValidate
			>
				<FieldRow
					label={ __( 'Site title', 'solvex-ai-blogger' ) }
					htmlFor="wiz-site-title"
					hint={ __( 'The main title of your website or blog.', 'solvex-ai-blogger' ) }
					error={ errors.siteTitle?.message }
					icon={ Globe }
					required
				>
					<input
						id="wiz-site-title"
						type="text"
						{ ...register( 'siteTitle' ) }
						className={ cn(
							'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15',
							errors.siteTitle && 'border-destructive focus-visible:ring-destructive/20'
						) }
						placeholder={ __( 'e.g., Tech Insights Blog', 'solvex-ai-blogger' ) }
					/>
				</FieldRow>
				<FieldRow
					label={ __( 'Site purpose', 'solvex-ai-blogger' ) }
					htmlFor="wiz-site-for"
					hint={ __( 'Who is your target audience?', 'solvex-ai-blogger' ) }
					error={ errors.siteFor?.message }
					icon={ User }
					required
				>
					<input
						id="wiz-site-for"
						type="text"
						{ ...register( 'siteFor' ) }
						className={ cn(
							'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15',
							errors.siteFor && 'border-destructive focus-visible:ring-destructive/20'
						) }
						placeholder={ __( 'e.g., technology enthusiasts', 'solvex-ai-blogger' ) }
					/>
				</FieldRow>
				<FieldRow
					label={ __( 'Detailed description', 'solvex-ai-blogger' ) }
					htmlFor="wiz-site-description"
					hint={ __( 'Tone, topics, and goals — helps the AI target your readers.', 'solvex-ai-blogger' ) }
					error={ errors.siteDescription?.message }
					icon={ FileText }
					required
				>
					<textarea
						id="wiz-site-description"
						{ ...register( 'siteDescription' ) }
						rows={ 5 }
						className={ cn(
							'flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15',
							errors.siteDescription && 'border-destructive focus-visible:ring-destructive/20'
						) }
						placeholder={ __( 'Describe your site: topics, style, audience, goals…', 'solvex-ai-blogger' ) }
					/>
				</FieldRow>
				<button
					type="submit"
					disabled={ ! isValid || isSubmitting }
					className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{ isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" /> }
					{ __( 'Save & Continue', 'solvex-ai-blogger' ) }
					<ArrowRight className="size-3.5" aria-hidden="true" />
				</button>
			</form>
			<p className="mt-4 text-center text-xs text-muted-foreground">
				{ __( 'This information configures the AI generator for optimal results.', 'solvex-ai-blogger' ) }
			</p>
		</>
	);
} );

const LicensePane = memo( function LicensePane( { onContinue } ) {
	const dispatch = useDispatch();
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const licensingNonce = useSelector( ( s ) => s.licensingNonce ) || '';
	const ajaxUrl = useSelector( ( s ) => s.ajaxUrl ) || '';
	const noLicenseKeyUrl = useSelector( ( s ) => s.noLicenseKeyUrl ) || '#';

	const form = useForm( {
		resolver: zodResolver( licenseSchema ),
		defaultValues: { licenseKey: '' },
		mode: 'onChange',
	} );

	const [ processing, setProcessing ] = useState( false );

	// One-click connect: opens the wpaiblogger.com popup, creates a free
	// account and stores tokens automatically. No key to copy/paste.
	const { isConnecting, connect } = useStoreConnect();
	const [ connectInitiated, setConnectInitiated ] = useState( false );

	const handleConnect = useCallback( () => {
		setConnectInitiated( true );
		connect();
	}, [ connect ] );

	// When the connect popup completes (Redux flips to 'licensed'), advance.
	useEffect( () => {
		if ( connectInitiated && licenseStatus === 'licensed' ) {
			const timer = setTimeout( () => onContinue(), 1200 );
			return () => clearTimeout( timer );
		}
	}, [ connectInitiated, licenseStatus, onContinue ] );

	const activate = useCallback(
		async ( { licenseKey } ) => {
			setProcessing( true );
			try {
				const formData = new FormData();
				formData.append( 'action', 'wpsolvex_autoaiblogger_activate_license' );
				formData.append( 'license_key', licenseKey );
				formData.append( 'wpsolvex_autoaiblogger_licensing_nonce', licensingNonce );
				const response = await apiFetch( {
					url: ajaxUrl,
					method: 'POST',
					body: formData,
				} );
				if ( ! response?.success ) {
					throw new Error( response?.data?.message || __( 'License activation failed', 'solvex-ai-blogger' ) );
				}
				dispatch( { type: 'UPDATE_LICENSE_STATUS', payload: 'licensed' } );
				dispatch( { type: 'UPDATE_LICENSE', payload: licenseKey } );

				try {
					const tokenRes = await fetch(
						`https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=${ encodeURIComponent( licenseKey ) }`
					);
					if ( tokenRes.ok ) {
						const tokenData = await tokenRes.json();
						if ( tokenData?.success && tokenData?.data ) {
							dispatch( { type: 'UPDATE_TOKEN_TOTAL', payload: tokenData.data.total } );
							dispatch( { type: 'UPDATE_TOKEN_REMAINING', payload: tokenData.data.remaining } );
							await updateApiData( 'tokenTotal', tokenData.data.total, dispatch );
							await updateApiData( 'tokenRemaining', tokenData.data.remaining, dispatch );
						}
					}
				} catch ( e ) {
					console.warn( 'Token fetch after activate failed:', e );
				}

				toast.success( __( 'License activated', 'solvex-ai-blogger' ) );
				onContinue();
			} catch ( error ) {
				toast.error( error?.message || __( 'License activation failed', 'solvex-ai-blogger' ) );
			} finally {
				setProcessing( false );
			}
		},
		[ dispatch, licensingNonce, ajaxUrl, onContinue ]
	);

	const alreadyLicensed = licenseStatus === 'licensed';

	return (
		<>
			<StepHeader
				step={ 2 }
				title={ __( 'Connect your account', 'solvex-ai-blogger' ) }
				subtitle={ __( 'Link your site to unlock AI-powered content generation.', 'solvex-ai-blogger' ) }
			/>

			{ alreadyLicensed ? (
				<div className="space-y-5 rounded-xl border border-border bg-card p-8 ring-1 ring-black/[0.02]">
					<div className="flex items-center gap-3 rounded-lg border border-[oklch(0.85_0.08_155)] bg-[oklch(0.97_0.04_155)] p-4 text-sm text-[oklch(0.35_0.12_155)]">
						<CheckCircle2 className="size-4" aria-hidden="true" />
						{ __( 'License is already active on this site.', 'solvex-ai-blogger' ) }
					</div>
					<button
						type="button"
						onClick={ onContinue }
						className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
					>
						{ __( 'Continue', 'solvex-ai-blogger' ) }
						<ArrowRight className="size-3.5" aria-hidden="true" />
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{ /* One-click connect — primary path for new users. */ }
					<div className="flex flex-col rounded-xl border-2 border-brand/30 bg-brand-soft/40 p-6 ring-1 ring-black/[0.02]">
						<div className="flex size-12 items-center justify-center rounded-full bg-card text-brand">
							<Gift className="size-6" aria-hidden="true" />
						</div>
						<h3 className="mt-4 text-base font-semibold text-foreground">
							{ __( 'New here?', 'solvex-ai-blogger' ) }
						</h3>
						<p className="mt-2 flex-1 text-sm text-muted-foreground">
							{ __( 'Connect in one click — we create your free account and set up your 240,000 monthly free tokens automatically. No key to copy.', 'solvex-ai-blogger' ) }
						</p>
						<button
							type="button"
							onClick={ handleConnect }
							disabled={ isConnecting }
							className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
							aria-label={ __( 'Connect to wpaiblogger.com', 'solvex-ai-blogger' ) }
						>
							{ isConnecting ? (
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
							) : (
								<>
									{ __( 'Connect to wpaiblogger.com', 'solvex-ai-blogger' ) }
									<Link2 className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
								</>
							) }
						</button>
						<p className="mt-3 text-center text-xs text-muted-foreground">
							{ __( 'Free forever • No credit card •', 'solvex-ai-blogger' ) }{ ' ' }
							<a
								href={ noLicenseKeyUrl }
								target="_blank"
								rel="noopener noreferrer"
								className="text-brand hover:underline"
							>
								{ __( 'register manually', 'solvex-ai-blogger' ) }
							</a>
						</p>
					</div>

					{ /* Manual key activation — secondary path for existing users. */ }
					<form
						onSubmit={ form.handleSubmit( activate ) }
						className="flex flex-col rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02]"
						noValidate
					>
						<div className="flex items-center gap-2">
							<KeyRound className="size-5 text-muted-foreground" aria-hidden="true" />
							<h3 className="text-base font-semibold text-foreground">
								{ __( 'Already have a key?', 'solvex-ai-blogger' ) }
							</h3>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							{ __( 'Paste your license key below to connect your site.', 'solvex-ai-blogger' ) }
						</p>
						<div className="mt-5 flex flex-1 flex-col gap-5">
							<FieldRow
								label={ __( 'License key', 'solvex-ai-blogger' ) }
								htmlFor="wiz-license-key"
								error={ form.formState.errors.licenseKey?.message }
								icon={ KeyRound }
								required
							>
								<input
									id="wiz-license-key"
									type="text"
									{ ...form.register( 'licenseKey' ) }
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15"
									placeholder={ __( 'Paste your license key…', 'solvex-ai-blogger' ) }
								/>
							</FieldRow>
							<button
								type="submit"
								disabled={ ! form.formState.isValid || processing }
								className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{ processing && <Loader2 className="size-4 animate-spin" aria-hidden="true" /> }
								{ __( 'Activate & Continue', 'solvex-ai-blogger' ) }
								<ArrowRight className="size-3.5" aria-hidden="true" />
							</button>
						</div>
					</form>
				</div>
			) }
		</>
	);
} );

const SubscribePane = memo( function SubscribePane( { onContinue, onSkip } ) {
	const dispatch = useDispatch();
	const userName = useSelector( ( s ) => s.userName ) || '';
	const userEmail = useSelector( ( s ) => s.userEmail ) || '';

	const form = useForm( {
		resolver: zodResolver( optinSchema ),
		defaultValues: { userName, userEmail },
		mode: 'onChange',
	} );

	const [ saving, setSaving ] = useState( false );

	const onSubmit = useCallback(
		async ( values ) => {
			setSaving( true );
			try {
				dispatch( { type: 'UPDATE_USER_NAME', payload: values.userName.trim() } );
				dispatch( { type: 'UPDATE_USER_EMAIL', payload: values.userEmail.trim() } );
				await Promise.all( [
					updateApiData( 'userName', values.userName.trim(), dispatch ),
					updateApiData( 'userEmail', values.userEmail.trim(), dispatch ),
				] );
				onContinue();
			} catch ( e ) {
				toast.error( e?.message || __( 'Failed to save details.', 'solvex-ai-blogger' ) );
			} finally {
				setSaving( false );
			}
		},
		[ dispatch, onContinue ]
	);

	const perks = [
		{ icon: TrendingUp, title: __( 'Weekly AI Writing Tips', 'solvex-ai-blogger' ), desc: __( 'Expert content tips delivered weekly.', 'solvex-ai-blogger' ) },
		{ icon: Star, title: __( 'Marketing Strategies', 'solvex-ai-blogger' ), desc: __( 'Growth tips from successful bloggers.', 'solvex-ai-blogger' ) },
		{ icon: Heart, title: __( 'Blog Growth Tips', 'solvex-ai-blogger' ), desc: __( 'Content optimization & engagement techniques.', 'solvex-ai-blogger' ) },
	];

	return (
		<>
			<StepHeader
				step={ 3 }
				title={ __( 'Almost there!', 'solvex-ai-blogger' ) }
				subtitle={ __( 'Get personalized growth insights delivered to your inbox.', 'solvex-ai-blogger' ) }
			/>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<form
					onSubmit={ form.handleSubmit( onSubmit ) }
					className="rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02]"
					noValidate
				>
					<h3 className="text-base font-semibold">{ __( 'Your information', 'solvex-ai-blogger' ) }</h3>
					<div className="mt-5 space-y-4">
						<FieldRow
							label={ __( 'First name', 'solvex-ai-blogger' ) }
							htmlFor="wiz-user-name"
							icon={ User }
							error={ form.formState.errors.userName?.message }
							required
						>
							<input
								id="wiz-user-name"
								type="text"
								{ ...form.register( 'userName' ) }
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15"
							/>
						</FieldRow>
						<FieldRow
							label={ __( 'Email address', 'solvex-ai-blogger' ) }
							htmlFor="wiz-user-email"
							icon={ Mail }
							error={ form.formState.errors.userEmail?.message }
							required
						>
							<input
								id="wiz-user-email"
								type="email"
								{ ...form.register( 'userEmail' ) }
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15"
							/>
						</FieldRow>
						<button
							type="submit"
							disabled={ ! form.formState.isValid || saving }
							className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{ saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" /> }
							{ __( 'Save & Continue', 'solvex-ai-blogger' ) }
							<ArrowRight className="size-3.5" aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={ onSkip }
							className="block w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							{ __( 'Skip for now', 'solvex-ai-blogger' ) }
						</button>
						<div className="rounded-lg border border-[oklch(0.85_0.08_155)] bg-[oklch(0.97_0.04_155)] p-3 text-xs text-[oklch(0.35_0.12_155)]">
							<span className="flex items-center gap-1.5 font-semibold">
								<ShieldCheck className="size-3.5" aria-hidden="true" />
								{ __( 'Privacy guaranteed.', 'solvex-ai-blogger' ) }
							</span>
							<span className="mt-1 block">
								{ __( 'We respect your privacy. Unsubscribe anytime.', 'solvex-ai-blogger' ) }
							</span>
						</div>
					</div>
				</form>
				<div>
					<h3 className="text-base font-semibold">{ __( "What you'll receive", 'solvex-ai-blogger' ) }</h3>
					<div className="mt-5 space-y-3">
						{ perks.map( ( perk ) => (
							<div key={ perk.title } className="rounded-xl border border-border bg-card p-4 ring-1 ring-black/[0.02]">
								<div className="flex items-start gap-3">
									<div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
										<perk.icon className="size-4" aria-hidden="true" />
									</div>
									<div>
										<div className="text-sm font-semibold">{ perk.title }</div>
										<div className="mt-0.5 text-xs text-muted-foreground">{ perk.desc }</div>
									</div>
								</div>
							</div>
						) ) }
					</div>
				</div>
			</div>
		</>
	);
} );

const DonePane = memo( function DonePane( { onFinish } ) {
	const dispatch = useDispatch();
	const fired = useRef( false );

	useEffect( () => {
		if ( fired.current ) {
			return;
		}
		fired.current = true;
		dispatch( { type: 'UPDATE_USER_ONBOARDED', payload: true } );
		updateApiData( 'userOnboarded', true, dispatch ).catch( ( e ) => {
			console.warn( 'Failed to persist userOnboarded:', e?.message );
		} );
	}, [ dispatch ] );

	return (
		<div className="text-center">
			<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
				<CheckCircle2 className="size-8" aria-hidden="true" />
			</div>
			<h1 className="mt-6 text-4xl font-bold tracking-tight">
				{ __( "You're all set", 'solvex-ai-blogger' ) }
			</h1>
			<p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
				{ __( 'Your AI blogger is ready. Create your first campaign to start automatically publishing posts.', 'solvex-ai-blogger' ) }
			</p>
			<button
				type="button"
				onClick={ onFinish }
				className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:brightness-110"
			>
				{ __( 'Open dashboard', 'solvex-ai-blogger' ) }
				<ArrowRight className="size-4" aria-hidden="true" />
			</button>
		</div>
	);
} );

function WizardHeader( { currentIndex, goTo, onExit } ) {
	return (
		<header className="border-b border-border bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
				<div className="flex items-center gap-2.5">
					<div className="flex size-7 items-center justify-center rounded-md bg-brand">
						<Sparkles className="size-3.5 text-white" aria-hidden="true" />
					</div>
					<span className="text-[15px] font-semibold tracking-tight">
						{ __( 'Setup Wizard', 'solvex-ai-blogger' ) }
					</span>
				</div>
				<nav className="hidden items-center gap-1 sm:flex" aria-label={ __( 'Wizard steps', 'solvex-ai-blogger' ) }>
					{ STEPS.map( ( step, i ) => {
						const done = i < currentIndex;
						const active = i === currentIndex;
						return (
							<button
								key={ step.key }
								type="button"
								onClick={ () => goTo( step.key ) }
								className={ cn(
									'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
									active && 'bg-brand-soft text-brand',
									done && 'text-[oklch(0.55_0.16_155)]',
									! active && ! done && 'text-muted-foreground hover:text-foreground'
								) }
								aria-current={ active ? 'step' : undefined }
							>
								<step.icon className="size-3.5" aria-hidden="true" />
								{ step.label }
								{ done && <CheckCircle2 className="size-3" aria-hidden="true" /> }
							</button>
						);
					} ) }
				</nav>
				<button
					type="button"
					onClick={ onExit }
					className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
					aria-label={ __( 'Exit setup', 'solvex-ai-blogger' ) }
				>
					<X className="size-4" aria-hidden="true" />
				</button>
			</div>
		</header>
	);
}

function WizardFooter( { currentIndex, goPrev, goNext } ) {
	return (
		<footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-md">
			<div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
				<button
					type="button"
					onClick={ goPrev }
					disabled={ currentIndex === 0 }
					className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/30 disabled:opacity-40"
				>
					<ArrowLeft className="size-3.5" aria-hidden="true" />
					{ __( 'Back', 'solvex-ai-blogger' ) }
				</button>
				<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
					{ STEPS.map( ( _, i ) => (
						<span
							key={ i }
							className={ cn(
								'size-1.5 rounded-full transition-colors',
								i === currentIndex && 'bg-brand',
								i < currentIndex && 'bg-brand/40',
								i > currentIndex && 'bg-border'
							) }
						/>
					) ) }
					<span className="ml-2 tabular-nums">
						{ currentIndex + 1 } { __( 'of', 'solvex-ai-blogger' ) } { STEPS.length }
					</span>
				</div>
				<button
					type="button"
					onClick={ goNext }
					disabled={ currentIndex === STEPS.length - 1 }
					className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50"
				>
					{ __( 'Next', 'solvex-ai-blogger' ) }
					<ArrowRight className="size-3.5" aria-hidden="true" />
				</button>
			</div>
		</footer>
	);
}

function Wizard() {
	const { currentKey, currentIndex, goTo } = useStepNav();
	const finish = useFinishOnboarding();

	useEffect( () => {
		document.body.classList.add( 'solvex-ai-blogger-wizard' );
		return () => {
			document.body.classList.remove( 'solvex-ai-blogger-wizard' );
		};
	}, [] );

	const goNext = useCallback( () => {
		const next = STEPS[ Math.min( STEPS.length - 1, currentIndex + 1 ) ];
		if ( next ) {
			goTo( next.key );
		}
	}, [ currentIndex, goTo ] );

	const goPrev = useCallback( () => {
		const prev = STEPS[ Math.max( 0, currentIndex - 1 ) ];
		if ( prev ) {
			goTo( prev.key );
		}
	}, [ currentIndex, goTo ] );

	const handleExit = useCallback( () => {
		if ( window.confirm( __( 'Exit the setup wizard? You can come back any time.', 'solvex-ai-blogger' ) ) ) {
			finish();
		}
	}, [ finish ] );

	return (
		<div className="min-h-screen bg-background text-foreground">
			<WizardHeader currentIndex={ currentIndex } goTo={ goTo } onExit={ handleExit } />
			<main className="mx-auto max-w-3xl px-6 py-16 pb-32">
				<div key={ currentKey } className="animate-reveal">
					{ currentKey === 'welcome' && <WelcomePane onStart={ goNext } /> }
					{ currentKey === 'persona-form' && <SiteInfoPane onContinue={ goNext } /> }
					{ currentKey === 'license' && <LicensePane onContinue={ goNext } /> }
					{ currentKey === 'optin' && <SubscribePane onContinue={ goNext } onSkip={ goNext } /> }
					{ currentKey === 'ready' && <DonePane onFinish={ finish } /> }
				</div>
			</main>
			<WizardFooter currentIndex={ currentIndex } goPrev={ goPrev } goNext={ goNext } />
		</div>
	);
}

export default memo( Wizard );
