/**
 * Campaign configure drawer — Radix Sheet + Tabs rewrite matching the
 * Lovable design (brand purple header, pill day toggles, card-style
 * radios, sticky footer). Form state, validation, and AJAX wiring are
 * preserved from the legacy HeadlessUI version.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import { updateCampaign } from '@Utils/ApiData';
import DateTimeField from '@Components/DateTimeField';
import Info from 'lucide-react/dist/esm/icons/info';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@Components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@Components/ui/tabs';
import { Switch } from '@Components/ui/switch';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@Components/ui/tooltip';
import TokenExhaustionModal from '@Components/TokenExhaustionModal';
import { cn } from '@Utils/cn';

const DAYS = [
	{ key: 'sun', label: __( 'Sun', 'solvex-ai-blogger' ) },
	{ key: 'mon', label: __( 'Mon', 'solvex-ai-blogger' ) },
	{ key: 'tue', label: __( 'Tue', 'solvex-ai-blogger' ) },
	{ key: 'wed', label: __( 'Wed', 'solvex-ai-blogger' ) },
	{ key: 'thu', label: __( 'Thu', 'solvex-ai-blogger' ) },
	{ key: 'fri', label: __( 'Fri', 'solvex-ai-blogger' ) },
	{ key: 'sat', label: __( 'Sat', 'solvex-ai-blogger' ) },
];

function hasStartDatePassed( startDate ) {
	if ( ! startDate ) {
		return false;
	}
	try {
		return new Date( startDate ) < new Date();
	} catch ( e ) {
		return false;
	}
}

/**
 * A campaign is considered "completed" (and therefore locked for further
 * edits) only when it has genuinely finished running:
 *   - all targeted posts have been created, OR
 *   - the backend explicitly flagged `campaignCompleted = true`.
 *
 * `status === 'draft'` is NOT a completed state — it just means the user has
 * toggled the campaign Off (paused). The "Off" radio description literally
 * promises "Setup saved, won't run until switched ON", so the Update button
 * must stay enabled for draft campaigns.
 *
 * @param {Object} data Campaign data from the drawer form state.
 * @return {boolean} True if no further edits should be accepted.
 */
function isCampaignCompleted( data ) {
	if ( ! data || data.type === 'new' ) {
		return false;
	}
	const postsCreated = parseInt( data.postsCreated, 10 ) || 0;
	const postsTarget = parseInt( data.postsTarget, 10 ) || 0;
	const isTargetMet = postsTarget > 0 && postsCreated >= postsTarget;
	const allAttemptsCompleted = data.campaignCompleted === true;
	return isTargetMet || allAttemptsCompleted;
}

function Field( { label, hint, error, htmlFor, children, tooltip } ) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1 leading-none">
				<label
					htmlFor={ htmlFor }
					className="text-sm font-medium leading-none text-foreground"
				>
					{ label }
				</label>
				{ tooltip && (
					<Tooltip delayDuration={ 100 }>
						<TooltipTrigger asChild>
							{ /*
							  * Span trigger (not <button>): matches the working
							  * pattern in AppShell. Radix's `asChild` clones event
							  * handlers onto the rendered element — a <button>
							  * inside a Radix Dialog portal sometimes loses pointer
							  * events because the UA default `<button>` styling
							  * (which we don't fully reset outside our wrapper) can
							  * intercept hover before Radix sees it. A <span> has
							  * no UA styling and inherits cleanly.
							  *
							  * Hit target is intentionally larger than the icon:
							  * `-my-1.5 p-1.5` gives a 26×26 hover/focus zone and
							  * pulls the padding back via negative margin so the
							  * row's visual baseline is unchanged.
							  */ }
							<span
								role="img"
								tabIndex={ 0 }
								aria-label={ __( 'Help', 'solvex-ai-blogger' ) }
								className="-my-1.5 inline-flex shrink-0 cursor-help items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
							>
								<Info className="size-3.5" aria-hidden="true" />
							</span>
						</TooltipTrigger>
						<TooltipContent side="bottom" sideOffset={ 6 } className="max-w-xs">
							{ tooltip }
						</TooltipContent>
					</Tooltip>
				) }
			</div>
			{ children }
			{ error ? (
				<p className="flex items-center gap-1 text-xs text-destructive">
					<AlertCircle className="size-3" aria-hidden="true" />
					{ error }
				</p>
			) : hint ? (
				<p className="text-xs text-muted-foreground">{ hint }</p>
			) : null }
		</div>
	);
}

const inputBaseClass =
	'flex h-10 max-w-full w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70';

const selectBaseClass = inputBaseClass + ' appearance-none pr-9';

function SelectField( { value, onChange, disabled, children, id } ) {
	return (
		<div className="relative w-full">
			<select
				id={ id }
				value={ value || '' }
				onChange={ onChange }
				disabled={ disabled }
				className={ selectBaseClass }
			>
				{ children }
			</select>
		</div>
	);
}

function RadioCard( { id, name, checked, onChange, label, description, disabled } ) {
	return (
		<label
			htmlFor={ id }
			aria-label={ label }
			className={ cn(
				'flex cursor-pointer items-baseline gap-3 rounded-lg border bg-card p-3 transition-colors',
				checked
					? 'border-brand bg-brand-soft/40'
					: 'border-border hover:border-brand/30',
				disabled && 'cursor-not-allowed opacity-60 hover:border-border'
			) }
		>
			<input
				type="radio"
				id={ id }
				name={ name }
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
				className="mt-0.5 size-4 accent-brand"
			/>
			<span className="flex flex-col gap-0.5">
				<span className="text-sm font-semibold text-foreground">{ label }</span>
				<span className="text-xs text-muted-foreground">{ description }</span>
			</span>
		</label>
	);
}

export default function ConfigureDrawer( props ) {
	const { configureData, openDrawer, setOpenDrawer, mode = 'edit' } = props;
	const abortControllerRef = useRef( {} );
	const isViewMode = mode === 'view';

	// Localized lookups (still ride on the global window key).
	const postTypes = wpsolvex_autoaiblogger_localized_data?.post_types || {};
	const authors = wpsolvex_autoaiblogger_localized_data?.authors || [];
	const postStatuses = wpsolvex_autoaiblogger_localized_data?.post_statuses || {};
	const categories = wpsolvex_autoaiblogger_localized_data?.categories || {};
	const tags = wpsolvex_autoaiblogger_localized_data?.tags || {};

	const proAvailable = useSelector( ( s ) => Boolean( s.proAvailable ) );
	const proPurchaseUrl = useSelector( ( s ) => s.proPurchaseUrl ) || '#';
	const tokenRemaining = useSelector( ( s ) => s.tokenRemaining );

	const [ activeTab, setActiveTab ] = useState( 'general' );
	const [ handlingCampaign, setHandlingCampaign ] = useState( false );
	const [ drawerData, setDrawerData ] = useState( {} );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ fieldErrors, setFieldErrors ] = useState( {} );
	const [ showTokenModal, setShowTokenModal ] = useState( false );

	useEffect( () => {
		if ( openDrawer ) {
			setDrawerData( configureData || {} );
			setHandlingCampaign( false );
			setFieldErrors( {} );
			setErrorMessage( '' );
			setActiveTab( 'general' );
		}
	}, [ openDrawer, configureData ] );

	const setField = useCallback(
		( key, value ) => {
			if ( isViewMode ) {
				return;
			}
			setDrawerData( ( prev ) => ( { ...prev, [ key ]: value } ) );
		},
		[ isViewMode ]
	);

	const closePopup = useCallback( () => {
		setOpenDrawer( false );
	}, [ setOpenDrawer ] );

	// Tab-aware error helper. Switches to the offending tab, focuses the
	// field, and auto-clears after 4s. Uses forceMount on TabsContent so the
	// target element is always in the DOM.
	const showFieldError = useCallback(
		( fieldId, message, tabName = 'general' ) => {
			if ( activeTab !== tabName ) {
				setActiveTab( tabName );
			}
			setFieldErrors( { [ fieldId ]: message } );
			setErrorMessage( message );

			setTimeout(
				() => {
					const field = document.getElementById( fieldId );
					if ( field ) {
						field.scrollIntoView( { behavior: 'smooth', block: 'center' } );
						field.focus();
					}
				},
				tabName !== activeTab ? 300 : 100
			);

			setTimeout( () => {
				setFieldErrors( {} );
				setErrorMessage( '' );
			}, 4000 );
		},
		[ activeTab ]
	);

	const handleCampaign = useCallback( () => {
		// Token pre-check (preserved from release-candidate): block new
		// campaigns when the account lacks enough tokens to schedule /
		// auto-publish, and surface the upgrade modal instead.
		if ( drawerData.type === 'new' && tokenRemaining < 3000 ) {
			setShowTokenModal( true );
			return;
		}

		setFieldErrors( {} );
		setErrorMessage( '' );

		if ( ! drawerData.title ) {
			showFieldError(
				'project-name',
				__( 'Name should not be empty.', 'solvex-ai-blogger' ),
				'general'
			);
			return;
		}
		if ( ! drawerData.keywords ) {
			showFieldError(
				'campaign-keywords',
				__( 'Keywords should not be empty.', 'solvex-ai-blogger' ),
				'general'
			);
			return;
		}
		if ( ! drawerData.postsTarget ) {
			showFieldError(
				'campaign-target',
				__( 'Posts Target should not be empty.', 'solvex-ai-blogger' ),
				'general'
			);
			return;
		}
		if ( ! drawerData.startDate ) {
			showFieldError(
				'start-date',
				__( 'Start Date should not be empty.', 'solvex-ai-blogger' ),
				'general'
			);
			return;
		}
		if (
			'week' === drawerData.repeatUnit &&
			( drawerData.repeatWeeklyOn || [] ).length === 0
		) {
			setErrorMessage(
				__( 'Week days should not be empty.', 'solvex-ai-blogger' )
			);
			setFieldErrors( {
				'weekly-days': __(
					'Week days should not be empty.',
					'solvex-ai-blogger'
				),
			} );
			setTimeout( () => {
				setFieldErrors( {} );
				setErrorMessage( '' );
			}, 4000 );
			return;
		}
		if ( drawerData.overrideSitePersona && ! drawerData.overrideSiteFor ) {
			showFieldError(
				'blog-for',
				__(
					'Campaign For should not be empty when override is enabled.',
					'solvex-ai-blogger'
				),
				'advanced'
			);
			return;
		}
		if (
			drawerData.overrideSitePersona &&
			! drawerData.overrideSiteDescription
		) {
			showFieldError(
				'more-about-blog',
				__(
					'Campaign Description should not be empty when override is enabled.',
					'solvex-ai-blogger'
				),
				'advanced'
			);
			return;
		}

		setHandlingCampaign( true );
		updateCampaign( drawerData, drawerData.type === 'new', abortControllerRef )
			.then( () => {
				// ApiData.js triggers a window.location.reload() on success.
			} )
			.catch( ( error ) => {
				setHandlingCampaign( false );
				setErrorMessage(
					error?.message ||
						__(
							'An error occurred while saving the campaign.',
							'solvex-ai-blogger'
						)
				);
				setTimeout( () => setErrorMessage( '' ), 5000 );
			} );
	}, [ drawerData, showFieldError, tokenRemaining ] );

	const completed = isCampaignCompleted( drawerData );
	const submitDisabled = handlingCampaign || completed;
	const title = isViewMode
		? __( 'Campaign Configuration', 'solvex-ai-blogger' )
		: drawerData.type === 'new'
			? __( 'New Campaign', 'solvex-ai-blogger' )
			: __( 'Edit Campaign', 'solvex-ai-blogger' );

	const inputCx = ( fieldId ) =>
		cn(
			inputBaseClass,
			fieldErrors[ fieldId ] && 'border-destructive focus-visible:ring-destructive/20'
		);

	const toggleDay = ( day ) => {
		const repeatWeeklyOn = drawerData.repeatWeeklyOn || [];
		const next = repeatWeeklyOn.includes( day )
			? repeatWeeklyOn.filter( ( d ) => d !== day )
			: [ ...repeatWeeklyOn, day ];
		setField( 'repeatWeeklyOn', next );
	};

	const maxWordsLimit = proAvailable ? 5000 : 1000;
	const imagesLimit = proAvailable ? 5 : 1;

	return (
		// No nested TooltipProvider — AppShell's root provider already wraps
		// the whole app. Nesting providers makes Radix's open-state context
		// for individual <Tooltip>s ambiguous, which is why hovering the help
		// icon previously did nothing despite the trigger being correct.
		<>
		<Sheet open={ openDrawer } onOpenChange={ ( o ) => ! o && closePopup() }>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 p-0 sm:max-w-lg top-0! bottom-0! h-auto! max-[782px]:top-11.5! [&>button]:text-white! [&>button]:opacity-90! [&>button:hover]:opacity-100! z-99999!"
			>
				<SheetHeader className="border-b border-brand/20 bg-brand px-6 py-5">
					<SheetTitle className="text-base! font-semibold! text-white! force-space-0">
						{ title }
					</SheetTitle>
				</SheetHeader>

				<Tabs
					value={ activeTab }
					onValueChange={ setActiveTab }
					className="flex flex-1 flex-col overflow-hidden"
				>
					{ /*
						  * Pill segmented control:
						  *   - Outer `<div>` gives breathing room from the header
						  *     and the form content below.
						  *   - `<TabsList>` is a rounded `bg-muted` track with 4px
						  *     internal padding (`p-1`). NO `gap-*` — triggers must
						  *     sit flush so the rounded track wraps all three as
						  *     one unit; gaps make them read as separate pills.
						  *   - `border-0!` on each trigger is required because the
						  *     Sheet renders into a Radix Dialog portal at <body>
						  *     level, OUTSIDE `#solvex-ai-blogger-main-page--wrapper`,
						  *     so our scoped `button { border: 0 }` preflight doesn't
						  *     reach it. Chrome's default `<button>` border (2px
						  *     outset) shows through otherwise.
						  *   - `outline-none!` kills Chrome's mouse-click focus
						  *     outline; `focus-visible:ring-*` keeps a brand-tinted
						  *     ring for keyboard a11y.
						  *   - Active trigger lifts onto a `bg-background` chip with
						  *     `shadow-sm` and brand-colored text — the surrounding
						  *     muted track makes the lift unmistakable.
						  */ }
					<div className="flex p-0">
						<TabsList className="grid h-10 w-full grid-cols-3 rounded-lg bg-muted px-6 py-4">
							{ [
								{ value: 'general', label: __( 'General', 'solvex-ai-blogger' ) },
								{ value: 'filters', label: __( 'Filters', 'solvex-ai-blogger' ) },
								{ value: 'advanced', label: __( 'Advanced', 'solvex-ai-blogger' ) },
							].map( ( tab ) => (
								<TabsTrigger
									key={ tab.value }
									value={ tab.value }
									className="rounded-md border-0! bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all outline-none! hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/30 data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm cursor-pointer"
								>
									{ tab.label }
								</TabsTrigger>
							) ) }
						</TabsList>
					</div>

					<div className="flex-1 overflow-y-auto px-6 pb-28 pt-6">
						<TabsContent forceMount value="general" className="m-0 space-y-5">
							<Field
								label={ __( 'Name', 'solvex-ai-blogger' ) }
								htmlFor="project-name"
								error={ fieldErrors[ 'project-name' ] }
							>
								<input
									id="project-name"
									type="text"
									value={ drawerData.title || '' }
									onChange={ ( e ) => setField( 'title', e.target.value ) }
									readOnly={ isViewMode }
									placeholder={ __( '21 Week Fitness Plan', 'solvex-ai-blogger' ) }
									className={ inputCx( 'project-name' ) }
								/>
							</Field>

							<Field
								label={ __( 'Keywords', 'solvex-ai-blogger' ) }
								htmlFor="campaign-keywords"
								error={ fieldErrors[ 'campaign-keywords' ] }
							>
								<textarea
									id="campaign-keywords"
									rows={ 3 }
									value={ drawerData.keywords || '' }
									onChange={ ( e ) => setField( 'keywords', e.target.value ) }
									readOnly={ isViewMode }
									placeholder={ __( 'Yoga, Fitness, Health', 'solvex-ai-blogger' ) }
									className={ cn( inputCx( 'campaign-keywords' ), 'h-auto py-2' ) }
								/>
							</Field>

							<div className="grid grid-cols-2 gap-4">
								<Field
									label={ __( 'Posts Target', 'solvex-ai-blogger' ) }
									htmlFor="campaign-target"
									tooltip={
										drawerData.type === 'edit'
											? __( 'Post Target can not be updated.', 'solvex-ai-blogger' )
											: __( 'How many posts you expect from this campaign?', 'solvex-ai-blogger' )
									}
									error={ fieldErrors[ 'campaign-target' ] }
									hint={
										drawerData.type === 'new'
											? __( 'Once set, the target is final.', 'solvex-ai-blogger' )
											: undefined
									}
								>
									<input
										id="campaign-target"
										type="number"
										min="1"
										value={ drawerData.postsTarget || '' }
										onChange={ ( e ) => setField( 'postsTarget', e.target.value ) }
										onWheel={ ( e ) => e.target.blur() }
										readOnly={ isViewMode }
										disabled={ drawerData.type === 'edit' }
										className={ inputCx( 'campaign-target' ) }
									/>
								</Field>

								<Field
									label={ __( 'Repeat Every', 'solvex-ai-blogger' ) }
									htmlFor="campaign-repeat-after"
									tooltip={ __( 'Set how often the campaign should run automatically.', 'solvex-ai-blogger' ) }
								>
									<div className="flex gap-2">
										<input
											id="campaign-repeat-after"
											type="number"
											min="1"
											max="365"
											value={ drawerData.repeatInterval || 1 }
											onChange={ ( e ) =>
												setField(
													'repeatInterval',
													parseInt( e.target.value, 10 ) || 1
												)
											}
											onWheel={ ( e ) => e.target.blur() }
											readOnly={ isViewMode }
											className={ cn( inputBaseClass, 'w-20' ) }
										/>
										<SelectField
											id="repeat-unit"
											value={ drawerData.repeatUnit || 'day' }
											onChange={ ( e ) => setField( 'repeatUnit', e.target.value ) }
											disabled={ isViewMode }
										>
											<option value="day">{ __( 'Day(s)', 'solvex-ai-blogger' ) }</option>
											<option value="week">{ __( 'Week(s)', 'solvex-ai-blogger' ) }</option>
										</SelectField>
									</div>
								</Field>
							</div>

							{ 'week' === drawerData.repeatUnit && (
								<Field
									label={ __( 'On Days', 'solvex-ai-blogger' ) }
									error={ fieldErrors[ 'weekly-days' ] }
								>
									<div className="flex flex-wrap gap-1.5">
										{ DAYS.map( ( day ) => {
											const active = ( drawerData.repeatWeeklyOn || [] ).includes( day.key );
											return (
												<button
													key={ day.key }
													type="button"
													onClick={ () => toggleDay( day.key ) }
													disabled={ isViewMode }
													className={ cn(
														'inline-flex size-10 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
														active
															? 'border-brand bg-brand text-white'
															: 'border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground',
														isViewMode && 'cursor-not-allowed opacity-60'
													) }
												>
													{ day.label }
												</button>
											);
										} ) }
									</div>
								</Field>
							) }

							<Field
								label={ __( 'Start Date', 'solvex-ai-blogger' ) }
								htmlFor="start-date"
								tooltip={ __( 'Start Date can not be updated later.', 'solvex-ai-blogger' ) }
								error={ fieldErrors[ 'start-date' ] }
							>
								<DateTimeField
									id="start-date"
									name="start-date"
									value={ drawerData.startDate }
									onChange={ ( e ) => setField( 'startDate', e.target.value ) }
									readOnly={ isViewMode }
									disabled={
										drawerData.type === 'edit' &&
											hasStartDatePassed( drawerData.startDate )
									}
									placeholder={ __( 'Select campaign start date', 'solvex-ai-blogger' ) }
									error={ fieldErrors[ 'start-date' ] }
								/>
							</Field>

							<div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
								<div>
									<div className="text-sm font-medium">
										{ __( 'Use Summary as Excerpt', 'solvex-ai-blogger' ) }
									</div>
									<div className="text-xs text-muted-foreground">
										{ __( 'Shorten descriptions automatically.', 'solvex-ai-blogger' ) }
									</div>
								</div>
								<Switch
									checked={ Boolean( drawerData.summaryAsExcerpt ) }
									onCheckedChange={ ( v ) => setField( 'summaryAsExcerpt', v ) }
									disabled={ isViewMode }
									aria-label={ __( 'Use summary as excerpt', 'solvex-ai-blogger' ) }
								/>
							</div>

							<div>
								<div className="mb-3 text-sm font-semibold text-foreground">
									{ __( 'Campaign Status', 'solvex-ai-blogger' ) }
								</div>
								<div className="space-y-2">
									<RadioCard
										id="status-on"
										name="campaign-status"
										checked={ drawerData.status === 'publish' }
										onChange={ () => setField( 'status', 'publish' ) }
										disabled={ isViewMode }
										label={ __( 'On', 'solvex-ai-blogger' ) }
										description={ __(
											'The campaign will be activated immediately and start running.',
											'solvex-ai-blogger'
										) }
									/>
									<RadioCard
										id="status-off"
										name="campaign-status"
										checked={ drawerData.status === 'draft' }
										onChange={ () => setField( 'status', 'draft' ) }
										disabled={ isViewMode }
										label={ __( 'Off', 'solvex-ai-blogger' ) }
										description={ __(
											"Setup saved, won't run until switched ON.",
											'solvex-ai-blogger'
										) }
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent forceMount value="filters" className="m-0 space-y-5">
							<Field
								label={ __( 'Post Type', 'solvex-ai-blogger' ) }
								htmlFor="post-type"
							>
								<SelectField
									id="post-type"
									value={ drawerData.postType }
									onChange={ ( e ) => setField( 'postType', e.target.value ) }
									disabled={ isViewMode }
								>
									{ Object.entries( postTypes ).map( ( [ type, label ] ) => (
										<option key={ type } value={ type }>
											{ label }
										</option>
									) ) }
								</SelectField>
							</Field>

							<Field
								label={ __( 'Post Author', 'solvex-ai-blogger' ) }
								htmlFor="post-author"
							>
								<SelectField
									id="post-author"
									value={ drawerData.author }
									onChange={ ( e ) => setField( 'author', e.target.value ) }
									disabled={ isViewMode }
								>
									{ authors.map( ( author ) => (
										<option key={ author.id } value={ author.id }>
											{ author.name }
										</option>
									) ) }
								</SelectField>
							</Field>

							<Field
								label={ __( 'Post Status', 'solvex-ai-blogger' ) }
								htmlFor="post-status"
							>
								<SelectField
									id="post-status"
									value={ drawerData.postStatus }
									onChange={ ( e ) => setField( 'postStatus', e.target.value ) }
									disabled={ isViewMode }
								>
									{ Object.entries( postStatuses ).map( ( [ key, label ] ) => (
										<option key={ key } value={ key }>
											{ label }
										</option>
									) ) }
								</SelectField>
							</Field>

							{ 'post' === drawerData.postType && (
								<>
									<Field
										label={ __( 'Post Category', 'solvex-ai-blogger' ) }
										htmlFor="post-category"
									>
										<SelectField
											id="post-category"
											value={ drawerData.category }
											onChange={ ( e ) => setField( 'category', e.target.value ) }
											disabled={ isViewMode }
										>
											<option value="">{ __( '— Select —', 'solvex-ai-blogger' ) }</option>
											{ categories.map( ( cat ) => (
												<option key={ cat.id } value={ cat.id }>
													{ cat.name }
												</option>
											) ) }
										</SelectField>
									</Field>
									<Field
										label={ __( 'Post Tag', 'solvex-ai-blogger' ) }
										htmlFor="post-tag"
									>
										<SelectField
											id="post-tag"
											value={ drawerData.tag }
											onChange={ ( e ) => setField( 'tag', e.target.value ) }
											disabled={ isViewMode }
										>
											<option value="">{ __( '— Select —', 'solvex-ai-blogger' ) }</option>
											{ tags.map( ( tag ) => (
												<option key={ tag.id } value={ tag.id }>
													{ tag.name }
												</option>
											) ) }
										</SelectField>
									</Field>
								</>
							) }
						</TabsContent>

						<TabsContent forceMount value="advanced" className="m-0 space-y-5">
							<Field
								label={ __( 'Maximum Content Words', 'solvex-ai-blogger' ) }
								htmlFor="maximum-words"
								tooltip={
									proAvailable
										? __( 'Set the maximum number of words (100–5000).', 'solvex-ai-blogger' )
										: __( 'Free users are limited to 1000 words. Upgrade to Pro for up to 5000.', 'solvex-ai-blogger' )
								}
							>
								<input
									id="maximum-words"
									type="number"
									min="100"
									max={ maxWordsLimit }
									value={ drawerData.maxWords || '' }
									onChange={ ( e ) => {
										const raw = parseInt( e.target.value, 10 ) || 0;
										const clamped = Math.max( 0, Math.min( maxWordsLimit, raw ) );
										setField( 'maxWords', clamped );
									} }
									onWheel={ ( e ) => e.target.blur() }
									readOnly={ isViewMode }
									disabled={ ! proAvailable }
									placeholder={
										proAvailable
											? __( 'e.g., 1500', 'solvex-ai-blogger' )
											: __( '1000 (free limit)', 'solvex-ai-blogger' )
									}
									className={ inputBaseClass }
								/>
							</Field>

							<Field
								label={ __( 'Number of Content Images', 'solvex-ai-blogger' ) }
								htmlFor="number-of-images"
								tooltip={
									proAvailable
										? __( '1–5 in-content images. Featured image is always included.', 'solvex-ai-blogger' )
										: __( 'Free users are limited to 1 content image. Upgrade to Pro for up to 5.', 'solvex-ai-blogger' )
								}
							>
								<input
									id="number-of-images"
									type="number"
									min="1"
									max={ imagesLimit }
									value={ drawerData.numberOfImages || '' }
									onChange={ ( e ) => {
										const raw = parseInt( e.target.value, 10 ) || 0;
										const clamped = Math.max( 0, Math.min( imagesLimit, raw ) );
										setField( 'numberOfImages', clamped );
									} }
									onWheel={ ( e ) => e.target.blur() }
									readOnly={ isViewMode }
									disabled={ ! proAvailable }
									placeholder={
										proAvailable
											? __( 'e.g., 3', 'solvex-ai-blogger' )
											: __( '1 (free limit)', 'solvex-ai-blogger' )
									}
									className={ inputBaseClass }
								/>
							</Field>

							<div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
								<div>
									<div className="text-sm font-medium">
										{ __( 'Override Site Persona', 'solvex-ai-blogger' ) }
									</div>
									<div className="text-xs text-muted-foreground">
										{ proAvailable
											? __( 'Use campaign-specific persona instead of the global one.', 'solvex-ai-blogger' )
											: __( 'Pro feature — upgrade to unlock.', 'solvex-ai-blogger' ) }
									</div>
								</div>
								<Switch
									checked={ Boolean( drawerData.overrideSitePersona ) }
									onCheckedChange={ ( v ) => setField( 'overrideSitePersona', v ) }
									disabled={ isViewMode || ! proAvailable }
									aria-label={ __( 'Override site persona', 'solvex-ai-blogger' ) }
								/>
							</div>

							{ drawerData.overrideSitePersona && (
								<>
									<Field
										label={ __( 'Campaign For', 'solvex-ai-blogger' ) }
										htmlFor="blog-for"
										error={ fieldErrors[ 'blog-for' ] }
									>
										<input
											id="blog-for"
											type="text"
											value={ drawerData.overrideSiteFor || '' }
											onChange={ ( e ) => setField( 'overrideSiteFor', e.target.value ) }
											readOnly={ isViewMode }
											placeholder={ __( 'e.g., Fitness enthusiasts', 'solvex-ai-blogger' ) }
											className={ inputCx( 'blog-for' ) }
										/>
									</Field>
									<Field
										label={ __( 'Campaign Description', 'solvex-ai-blogger' ) }
										htmlFor="more-about-blog"
										error={ fieldErrors[ 'more-about-blog' ] }
									>
										<textarea
											id="more-about-blog"
											rows={ 3 }
											value={ drawerData.overrideSiteDescription || '' }
											onChange={ ( e ) =>
												setField( 'overrideSiteDescription', e.target.value )
											}
											readOnly={ isViewMode }
											placeholder={ __( 'A comprehensive guide to…', 'solvex-ai-blogger' ) }
											className={ cn( inputCx( 'more-about-blog' ), 'h-auto py-2' ) }
										/>
									</Field>
								</>
							) }

							{ ! proAvailable && (
								<a
									href={ proPurchaseUrl }
									target="_blank"
									rel="noopener noreferrer"
									className="block rounded-xl bg-brand p-5 text-white no-underline shadow-lg shadow-brand/15 transition-transform hover:scale-[1.01]"
								>
									<span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
										{ __( 'Premium', 'solvex-ai-blogger' ) }
									</span>
									<h4 className="mt-1.5 text-base font-semibold">
										{ __( 'Unlock more campaign controls', 'solvex-ai-blogger' ) }
									</h4>
									<p className="mt-1 text-xs text-white/80">
										{ __( 'Per-campaign persona, up to 5,000 words and 5 images.', 'solvex-ai-blogger' ) }
									</p>
								</a>
							) }
						</TabsContent>
					</div>
				</Tabs>

				<div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
					{ errorMessage ? (
						<p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
							<AlertCircle className="size-3.5" aria-hidden="true" />
							{ errorMessage }
						</p>
					) : (
						<span />
					) }
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={ closePopup }
							className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
						>
							{ isViewMode
								? __( 'Close', 'solvex-ai-blogger' )
								: __( 'Cancel', 'solvex-ai-blogger' ) }
						</button>
						{ ! isViewMode && (
							<button
								type="button"
								onClick={ handleCampaign }
								disabled={ submitDisabled }
								title={
									completed
										? __( 'Campaign completed — Updates disabled', 'solvex-ai-blogger' )
										: ''
								}
								className={ cn(
									'inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 border-none outline-none shadow-none',
									submitDisabled && 'cursor-not-allowed opacity-50 hover:brightness-100'
								) }
							>
								{ handlingCampaign && (
									<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								) }
								{ drawerData.type === 'new'
									? __( 'Create', 'solvex-ai-blogger' )
									: __( 'Update', 'solvex-ai-blogger' ) }
							</button>
						) }
					</div>
				</div>
			</SheetContent>
		</Sheet>

		<TokenExhaustionModal
			isOpen={ showTokenModal }
			onClose={ () => setShowTokenModal( false ) }
		/>
		</>
	);
}
