import React, { useRef, useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { updateCampaign } from '@Utils/ApiData';
import SwitchControl from '@Components/SwitchControl';
import DateTimeField from '@Components/DateTimeField';
import { Tooltip } from '@wordpress/components';
import DynamicCard from '@Components/DynamicCard';
import { FileText, List, Footprints, GitCompareArrows, BookOpen, Layers } from 'lucide-react';

export default function ConfigureDrawer( props ) {
	const abortControllerRef = useRef( {} );
	const { configureData, openDrawer, setOpenDrawer, mode = 'edit' } = props;

	const [ activeTab, setActiveTab ] = useState( 'campaign' );
	const [ handlingCampaign, setHandlingCampaign ] = useState( false );
	const [ open, setOpen ] = useState( openDrawer );
	const [ drawerData, setDrawerData ] = useState( {} );
	const postTypes = wpsolvex_autoaiblogger_localized_data?.post_types || {};
	const authors = wpsolvex_autoaiblogger_localized_data?.authors || [];
	const postStatuses = wpsolvex_autoaiblogger_localized_data?.post_statuses || {};
	const categories = wpsolvex_autoaiblogger_localized_data?.categories || {};
	const tags = wpsolvex_autoaiblogger_localized_data?.tags || {};
	const isViewMode = mode === 'view';
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ fieldErrors, setFieldErrors ] = useState( {} );
	const [ isGeneratingTopics, setIsGeneratingTopics ] = useState( false );
	const [ errorDialogOpen, setErrorDialogOpen ] = useState( false );

	// Helper to safely parse campaignTopics (may be JSON string or array).
	const getTopics = () => {
		let topics = drawerData.campaignTopics;
		if ( typeof topics === 'string' ) {
			try { topics = JSON.parse( topics ); } catch ( e ) { topics = []; }
		}
		return Array.isArray( topics ) ? topics : [];
	};

	// Helper to safely parse comparisonEntities (may be JSON string or array).
	const getEntities = ( fallback = [ '', '' ] ) => {
		let entities = drawerData.comparisonEntities;
		if ( typeof entities === 'string' ) {
			try { entities = JSON.parse( entities ); } catch ( e ) { entities = null; }
		}
		return Array.isArray( entities ) && entities.length >= 2 ? entities : fallback;
	};

	// Generate campaign topics via AJAX.
	const generateCampaignTopics = async () => {
		const keywords = drawerData.keywords;
		const count = parseInt( drawerData.postsTarget ) || 5;
		const format = drawerData.campaignFormat || 'standard';

		if ( ! keywords ) {
			showFieldError( 'campaign-keywords', __( 'Enter Keywords first.', 'solvex-ai-blogger' ), 'campaign' );
			return;
		}

		setIsGeneratingTopics( true );
		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_generate_campaign_topics' );
			formData.append( 'security', wpsolvex_autoaiblogger_localized_data?.admin_nonce || '' );
			formData.append( 'keywords', keywords );
			formData.append( 'count', count );
			formData.append( 'format', format );

			const response = await fetch( ajaxurl, {
				method: 'POST',
				body: formData,
			} );

			const result = await response.json();

			if ( result.success && result.data?.topics ) {
				setDrawerData( { ...drawerData, campaignTopics: result.data.topics } );
			} else {
				setErrorMessage( result.data?.message || __( 'Failed to generate topics.', 'solvex-ai-blogger' ) );
			}
		} catch ( e ) {
			setErrorMessage( __( 'Network error. Please try again.', 'solvex-ai-blogger' ) );
		} finally {
			setIsGeneratingTopics( false );
		}
	};

	// Helper function to check if start date has passed.
	const hasStartDatePassed = ( startDate ) => {
		if ( ! startDate ) {
			return false;
		}

		try {
			const start = new Date( startDate );
			const now = new Date();
			return start < now;
		} catch ( e ) {
			return false;
		}
	};

	useEffect( () => {
		setDrawerData( configureData );
		setHandlingCampaign( false );
		setOpen( openDrawer );
		setFieldErrors( {} );
		setErrorMessage( '' );
	}, [ openDrawer ] );

	const closePopup = () => {
		setOpen( false );
		setOpenDrawer( false );
	};

	// Helper function to scroll to and highlight field with error
	const showFieldError = ( fieldId, fieldErrorMessage, tabName = 'campaign' ) => {
		// Switch to correct tab if needed
		if ( activeTab !== tabName ) {
			setActiveTab( tabName );
		}

		// Set field error.
		setFieldErrors( { [ fieldId ]: fieldErrorMessage } );
		setErrorMessage( fieldErrorMessage );

		// Scroll to field after a small delay to ensure tab switch is complete
		setTimeout( () => {
			const field = document.getElementById( fieldId );
			if ( field ) {
				field.scrollIntoView( { behavior: 'smooth', block: 'center' } );
				field.focus();
			}
		}, tabName !== activeTab ? 300 : 100 );

		// Clear errors after 4 seconds
		setTimeout( () => {
			setFieldErrors( {} );
			setErrorMessage( '' );
		}, 4000 );
	};

	const handleCampaign = ( e ) => {
		e.preventDefault();

		// Reset errors
		setFieldErrors( {} );
		setErrorMessage( '' );

		if ( ! drawerData.title ) {
			showFieldError( 'project-name', __( 'Name should not be empty.', 'solvex-ai-blogger' ), 'campaign' );
			return;
		}
		if ( ! drawerData.keywords ) {
			showFieldError( 'campaign-keywords', __( 'Keywords should not be empty.', 'solvex-ai-blogger' ), 'campaign' );
			return;
		}
		if ( ! drawerData.postsTarget ) {
			showFieldError( 'campaign-target', __( 'Posts Target should not be empty.', 'solvex-ai-blogger' ), 'campaign' );
			return;
		}
		if ( ! drawerData.startDate ) {
			showFieldError( 'start-date', __( 'Start Date should not be empty.', 'solvex-ai-blogger' ), 'campaign' );
			return;
		}
		if ( 'week' === drawerData.repeatUnit && drawerData.repeatWeeklyOn.length === 0 ) {
			setErrorMessage( __( 'Week days should not be empty.', 'solvex-ai-blogger' ) );
			setFieldErrors( { 'weekly-days': __( 'Week days should not be empty.', 'solvex-ai-blogger' ) } );
			setTimeout( () => {
				setFieldErrors( {} );
				setErrorMessage( '' );
			}, 4000 );
			return;
		}
		if ( drawerData.overrideSitePersona && ! drawerData.overrideSiteFor ) {
			showFieldError( 'blog-for', __( 'Campaign For should not be empty when override is enabled.', 'solvex-ai-blogger' ), 'advanced' );
			return;
		}
		if ( drawerData.overrideSitePersona && ! drawerData.overrideSiteDescription ) {
			showFieldError( 'more-about-blog', __( 'Campaign Description should not be empty when override is enabled.', 'solvex-ai-blogger' ), 'advanced' );
			return;
		}

		setErrorMessage( '' );
		setFieldErrors( {} );
		setHandlingCampaign( true );

		// For series campaigns, auto-set seriesTotalParts and add +1 to postsTarget for the hub page.
		const submitData = { ...drawerData };
		if ( submitData.campaignFormat === 'series' && submitData.type === 'new' ) {
			const parts = parseInt( submitData.postsTarget ) || 3;
			submitData.seriesTotalParts = parts;
			submitData.postsTarget = parts + 1;
		}

		// Clean up campaign topics — filter empty lines and convert to JSON array.
		if ( Array.isArray( submitData.campaignTopics ) ) {
			submitData.campaignTopics = submitData.campaignTopics.filter( ( t ) => t && t.trim() !== '' );
		}

		updateCampaign( submitData, submitData.type === 'new', abortControllerRef )
			.then( ( response ) => {
				console.log( 'Campaign operation completed successfully:', response );
				// The ApiData.js handles the reload, so we don't need to do anything here
			} )
			.catch( ( error ) => {
				console.error( 'Campaign operation failed:', error );
				setHandlingCampaign( false );
				setErrorMessage( error.message || 'An error occurred while saving the campaign.' );
				setTimeout( () => {
					setErrorMessage( '' );
				}, 5000 );
			} );
	};

	return (
		<Dialog open={ open } onClose={ closePopup } className="relative z-10 ai-blogger-container">
			<div className="fixed inset-0 bg-black opacity-75" />

			<div className="fixed inset-0 overflow-hidden">
				<div className="absolute inset-0 overflow-hidden">
					<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
						<DialogPanel
							transition
							className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
						>
							<form className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
								<div className="h-0 flex-1 overflow-y-auto">
									<div className="bg-brand px-4 py-4 sm:px-6 mt-8">
										<div className="flex items-center justify-between">
											<h2 className="text-base font-semibold text-white m-0 p-0">
												{
													isViewMode
														? __( 'Campaign Configuration', 'solvex-ai-blogger' )
														: ( drawerData.type === 'new' )
															? __( 'New Campaign', 'solvex-ai-blogger' )
															: __( 'Edit Campaign', 'solvex-ai-blogger' )
												}
											</h2>
											<div className="ml-3 flex h-7 items-center">
												<button
													type="button"
													onClick={ closePopup }
													className="relative rounded-md bg-brand text-brand-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white border-none"
												>
													<span className="absolute -inset-2.5" />
													<span className="sr-only">Close panel</span>
													<XMarkIcon aria-hidden="true" className="size-6" />
												</button>
											</div>
										</div>
									</div>

									<div className="bg-white px-4 sm:px-6 wpsolvex-autoaiblogger-campaign-nav">
										<nav className="justify-between flex" aria-label="Tabs">
											<a
												onClick={ () => setActiveTab( 'campaign' ) }
												className={ `w-full campaign-settings-tab text-left text-sm/6 cursor-pointer whitespace-nowrap py-4 border-b-2 bg-transparent ${ 'campaign' === activeTab ? 'font-medium border-brand text-brand hover:text-brand hover:border-brand' : 'text-slate-600 border-gray-200 hover:text-slate-500 hover:border-slate-500 font-normal' }` }
											>
												{ __( 'General', 'solvex-ai-blogger' ) }
											</a>
											<a
												onClick={ () => setActiveTab( 'filters' ) }
												className={ `w-full campaign-settings-tab text-center text-sm/6 cursor-pointer whitespace-nowrap py-4 border-b-2 bg-transparent ${ 'filters' === activeTab ? 'font-medium border-brand text-brand hover:text-brand hover:border-brand' : 'text-slate-600 border-gray-200 hover:text-slate-500 hover:border-slate-500 font-normal' }` }
											>
												{ __( 'Filters', 'solvex-ai-blogger' ) }
											</a>
											<a
												onClick={ () => setActiveTab( 'advanced' ) }
												className={ `w-full campaign-settings-tab text-right text-sm/6 cursor-pointer whitespace-nowrap py-4 border-b-2 bg-transparent ${ 'advanced' === activeTab ? 'font-medium border-brand text-brand hover:text-brand hover:border-brand' : 'text-slate-600 border-gray-200 hover:text-slate-500 hover:border-slate-500 font-normal' }` }
											>
												{ __( 'Advanced', 'solvex-ai-blogger' ) }
											</a>
										</nav>
									</div>

									{
										'campaign' === activeTab && (
											<div className="flex flex-1 flex-col justify-between">
												<div className="divide-y divide-gray-200 px-4 sm:px-6">
													<div className="space-y-6 pb-5 pt-6">
														<div>
															<label htmlFor="project-name" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Name', 'solvex-ai-blogger' ) }
															</label>
															<div className="mt-2">
																<input
																	id="project-name"
																	name="project-name"
																	defaultValue={ drawerData.title }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, title: e.target.value } ) }
																	type="text"
																	readOnly={ isViewMode }
																	className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 transition-colors duration-200 ${
																		fieldErrors[ 'project-name' ]
																			? 'bg-red-50 outline-red-300 focus:outline-red-500 text-red-900'
																			: isViewMode
																				? 'bg-gray-50 outline-gray-200'
																				: 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand'
																	}` }
																	placeholder={ __( '21 Week Fitness Plan', 'solvex-ai-blogger' ) }
																/>
																{ fieldErrors[ 'project-name' ] && (
																	<p className="mt-1 text-sm text-red-600">
																		{ fieldErrors[ 'project-name' ] }
																	</p>
																) }
															</div>
														</div>

														<div>
															<label htmlFor="campaign-keywords" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Keywords', 'solvex-ai-blogger' ) }
															</label>
															<div className="mt-2">
																<textarea
																	id="campaign-keywords"
																	name="campaign-keywords"
																	rows={ 3 }
																	className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 transition-colors duration-200 ${
																		fieldErrors[ 'campaign-keywords' ]
																			? 'bg-red-50 outline-red-300 focus:outline-red-500 text-red-900'
																			: isViewMode
																				? 'bg-gray-50 outline-gray-200'
																				: 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand'
																	}` }
																	defaultValue={ drawerData.keywords }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, keywords: e.target.value } ) }
																	readOnly={ isViewMode }
																	placeholder={ __( 'Yoga, Fitness, Health', 'solvex-ai-blogger' ) }
																/>
																{ fieldErrors[ 'campaign-keywords' ] && (
																	<p className="mt-1 text-sm text-red-600">
																		{ fieldErrors[ 'campaign-keywords' ] }
																	</p>
																) }
															</div>
														</div>

														{ /* Phase 2: Campaign Format Cards */ }
														<div>
															<label className="flex items-center justify-between text-sm/6 font-medium text-gray-900 mb-2">
																<span>{ __( 'Campaign Format', 'solvex-ai-blogger' ) }</span>
																<a
																	href="https://wpaiblogger.com/campaign-formats/"
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-xs font-normal text-brand hover:text-brand-700 no-underline hover:underline"
																>
																	{ __( 'Learn more ↗', 'solvex-ai-blogger' ) }
																</a>
															</label>
															<div className="grid grid-cols-3 gap-2">
																{ [
																	{ value: 'standard', label: __( 'Standard', 'solvex-ai-blogger' ), icon: FileText, desc: __( 'Blog post', 'solvex-ai-blogger' ) },
																	{ value: 'listicle', label: __( 'Top List', 'solvex-ai-blogger' ), icon: List, desc: __( 'Numbered list', 'solvex-ai-blogger' ) },
																	{ value: 'step_by_step', label: __( 'Guide', 'solvex-ai-blogger' ), icon: Footprints, desc: __( 'Step-by-step', 'solvex-ai-blogger' ) },
																	{ value: 'comparison', label: __( 'Compare', 'solvex-ai-blogger' ), icon: GitCompareArrows, desc: __( 'Side by side', 'solvex-ai-blogger' ) },
																	{ value: 'glossary', label: __( 'Terms A-Z', 'solvex-ai-blogger' ), icon: BookOpen, desc: __( 'Definitions', 'solvex-ai-blogger' ) },
																	{ value: 'series', label: __( 'Series', 'solvex-ai-blogger' ), icon: Layers, desc: __( 'Multi-part', 'solvex-ai-blogger' ) },
																].map( ( format ) => {
																	const isSelected = ( drawerData.campaignFormat || 'standard' ) === format.value;
																	const isDisabled = isViewMode || drawerData.type === 'edit';
																	const Icon = format.icon;
																	return (
																		<button
																			key={ format.value }
																			type="button"
																			onClick={ () => ! isDisabled && setDrawerData( { ...drawerData, campaignFormat: format.value } ) }
																			disabled={ isDisabled }
																			className={ `relative flex flex-col items-center justify-center rounded-lg border-2 p-2.5 text-center transition-all duration-200 cursor-pointer ${
																				isSelected
																					? 'border-brand bg-brand-50 shadow-sm'
																					: isDisabled
																						? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
																						: 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
																			}` }
																		>
																			<Icon
																				className={ `size-5 mb-1 ${ isSelected ? 'text-brand' : 'text-gray-400' }` }
																				strokeWidth={ isSelected ? 2.5 : 1.5 }
																			/>
																			<span className={ `text-xs font-medium leading-tight ${ isSelected ? 'text-brand-700' : 'text-gray-700' }` }>
																				{ format.label }
																			</span>
																			<span className={ `text-[10px] leading-tight mt-0.5 ${ isSelected ? 'text-brand-500' : 'text-gray-400' }` }>
																				{ format.desc }
																			</span>
																			{ isSelected && (
																				<div className="absolute -top-1 -right-1 size-4 rounded-full bg-brand flex items-center justify-center">
																					<svg className="size-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
																						<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
																					</svg>
																				</div>
																			) }
																		</button>
																	);
																} ) }
															</div>
															{ drawerData.type === 'new' && (
																<p className="mt-3 text-xs text-gray-500">
																	{ __( 'Format cannot be changed after campaign creation.', 'solvex-ai-blogger' ) }
																</p>
															) }
														</div>

														{ /* Phase 2: Listicle - Item Count */ }
														{ drawerData.campaignFormat === 'listicle' && (
															<div className="flex items-center justify-between">
																<label htmlFor="listicle-item-count" className="block text-sm/6 font-medium text-gray-900">
																	{ __( 'Number of List Items', 'solvex-ai-blogger' ) }
																</label>
																<input
																	id="listicle-item-count"
																	type="number"
																	min="3"
																	max="50"
																	value={ drawerData.listicleItemCount || 10 }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, listicleItemCount: parseInt( e.target.value ) || 10 } ) }
																	readOnly={ isViewMode }
																	onWheel={ ( e ) => e.target.blur() }
																	className={ `block w-20 rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 sm:text-sm/6 ${ isViewMode ? 'bg-gray-50 outline-gray-200' : 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand' }` }
																/>
															</div>
														) }

														{ /* Phase 2: Comparison - Entities */ }
														{ drawerData.campaignFormat === 'comparison' && (
															<div>
																<label className="block text-sm/6 font-medium text-gray-900 mb-2">
																	{ __( 'Entities to Compare', 'solvex-ai-blogger' ) }
																</label>
																{ getEntities().map( ( entity, index ) => (
																	<div key={ index } className="flex items-center gap-2 mb-2">
																		<input
																			type="text"
																			value={ entity }
																			onChange={ ( e ) => {
																				if ( isViewMode ) return;
																				const entities = [ ...getEntities() ];
																				entities[ index ] = e.target.value;
																				setDrawerData( { ...drawerData, comparisonEntities: entities } );
																			} }
																			readOnly={ isViewMode }
																			placeholder={ [ __( 'e.g., Samsung Galaxy S26 Ultra', 'solvex-ai-blogger' ), __( 'e.g., iPhone 17 Pro Max', 'solvex-ai-blogger' ) ][ index ] || __( 'e.g., Samsung Galaxy S26 Ultra', 'solvex-ai-blogger' ) }
																			className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 sm:text-sm/6 ${ isViewMode ? 'bg-gray-50 outline-gray-200' : 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand' }` }
																		/>
																		{ ! isViewMode && getEntities().length > 2 && (
																			<button
																				type="button"
																				onClick={ () => {
																					const entities = [ ...getEntities() ];
																					entities.splice( index, 1 );
																					setDrawerData( { ...drawerData, comparisonEntities: entities } );
																				} }
																				className="text-red-500 hover:text-red-700 text-sm border-none bg-transparent cursor-pointer"
																			>
																				✕
																			</button>
																		) }
																	</div>
																) ) }
																{ ! isViewMode && getEntities().length < 6 && (
																	<button
																		type="button"
																		onClick={ () => {
																			const entities = [ ...getEntities(), '' ];
																			setDrawerData( { ...drawerData, comparisonEntities: entities } );
																		} }
																		className="text-sm text-brand hover:text-brand-700 border-none bg-transparent cursor-pointer"
																	>
																		+ { __( 'Add Entity', 'solvex-ai-blogger' ) }
																	</button>
																) }
															</div>
														) }

														{ /* Phase 2: Series - Total Parts (removed - now handled via Posts Target) */ }

														<div className="grid grid-cols-1 gap-2">
															<div className="flex items-center justify-between">
																<label htmlFor="campaign-target" className="flex items-center text-sm/6 font-medium text-gray-900">
																	{ drawerData.campaignFormat === 'series'
																		? __( 'Total Parts in Series', 'solvex-ai-blogger' )
																		: __( 'Posts Target', 'solvex-ai-blogger' )
																	}
																	<Tooltip
																		text={ drawerData.type === 'edit'
																			? __( 'Post Target can not be updated.', 'solvex-ai-blogger' )
																			: drawerData.campaignFormat === 'series'
																				? __( 'How many content parts in this series? A hub overview page will also be generated.', 'solvex-ai-blogger' )
																				: __( 'How many posts you expect from this campaign?', 'solvex-ai-blogger' )
																		}
																		delay={ 100 }
																		className="z-[99999] bg-black text-white shadow-md p-2 rounded-md"
																	>
																		<QuestionMarkCircleIcon
																			aria-hidden="true"
																			className="size-4 ml-1 text-gray-400 group-hover:text-gray-500"
																		/>
																	</Tooltip>
																</label>
																<div className="mt-2">
																	<div className="flex items-center gap-1">
																		<input
																			id="campaign-target"
																			name="campaign-target"
																			defaultValue={ drawerData.postsTarget }
																			onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, postsTarget: e.target.value } ) }
																			onWheel={ ( e ) => e.target.blur() }
																			type="number"
																			min="1"
																			readOnly={ isViewMode }
																			disabled={ drawerData.type === 'edit' }
																			className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 transition-colors duration-200 ${
																				fieldErrors[ 'campaign-target' ]
																					? 'bg-red-50 outline-red-300 focus:outline-red-500 text-red-900'
																					: isViewMode
																						? 'bg-gray-50 outline-gray-200'
																						: 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand'
																			}` }
																		/>
																	</div>
																	{ fieldErrors[ 'campaign-target' ] && (
																		<p className="mt-1 text-sm text-red-600">
																			{ fieldErrors[ 'campaign-target' ] }
																		</p>
																	) }
																</div>
															</div>
															{ drawerData.type === 'new' && (
																<div className="text-xs text-gray-500">
																	{ drawerData.campaignFormat === 'series'
																		? __( '1 additional Series Overview Page will also be generated.', 'solvex-ai-blogger' )
																		: __( 'Once set, campaign targets are unchangeable.', 'solvex-ai-blogger' )
																	}
																</div>
															) }
														</div>

														{ /* Phase 2.1: Blog Topics for non-series multi-post campaigns */ }
														{ drawerData.campaignFormat !== 'series' && (
															<div>
																<div className="flex items-center justify-between mb-2">
																	<label className="block text-sm/6 font-medium text-gray-900">
																		{ __( 'Blog Topics', 'solvex-ai-blogger' ) }
																		<span className="text-xs text-gray-400 font-normal ml-1">{ __( '(optional)', 'solvex-ai-blogger' ) }</span>
																	</label>
																	{ ! isViewMode && ( () => {
																		const isDisabled = isGeneratingTopics || ! drawerData.keywords || ! drawerData.title;
																		const btn = (
																			<button
																				type="button"
																				onClick={ generateCampaignTopics }
																				disabled={ isDisabled }
																				className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-700 border-none bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
																			>
																				{ isGeneratingTopics ? (
																					<>
																						<svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
																							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
																						</svg>
																						{ __( 'Generating...', 'solvex-ai-blogger' ) }
																					</>
																				) : getTopics().length > 0 ? (
																					<>🔄 { __( 'Regenerate', 'solvex-ai-blogger' ) }</>
																				) : (
																					<>✨ { __( 'Generate Topics', 'solvex-ai-blogger' ) }</>
																				) }
																			</button>
																		);
																		return isDisabled && ! isGeneratingTopics ? (
																			<span title={ __( 'Enter Name and Keywords to generate topics.', 'solvex-ai-blogger' ) }>
																				{ btn }
																			</span>
																		) : btn;
																	} )() }
																</div>
																<textarea
																	rows={ Math.max( 3, Math.min( 8, getTopics().length ) ) }
																	className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 transition-colors duration-200 ${
																		isViewMode
																			? 'bg-gray-50 outline-gray-200'
																			: 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand'
																	}` }
																	placeholder={ {
																		listicle: __( 'One topic per line. E.g.:\nTop 10 Budget Smartphones in 2026\n7 Must-Have Kitchen Gadgets Under $50\n5 Free Project Management Tools for Teams', 'solvex-ai-blogger' ),
																		step_by_step: __( 'One topic per line. E.g.:\nHow to Start a Vegetable Garden at Home\nHow to Set Up a Home Office on a Budget\nHow to Create a Monthly Budget in 5 Steps', 'solvex-ai-blogger' ),
																		comparison: __( 'One topic per line. E.g.:\niPhone 16 vs Samsung Galaxy S26: Which to Buy?\nShopify vs WooCommerce for Small Business\nNotion vs Obsidian: Best Note-Taking App', 'solvex-ai-blogger' ),
																		glossary: __( 'One topic per line. E.g.:\nDigital Marketing Terms Every Beginner Should Know\nA-Z Guide to Cloud Computing Terminology\nEssential Crypto & Blockchain Terms Explained', 'solvex-ai-blogger' ),
																	}[ drawerData.campaignFormat ] || __( 'One topic per line. E.g.:\nThe Future of Remote Work in 2026\nBeginner\'s Guide to Personal Finance\n10 Tips for Better Sleep Quality', 'solvex-ai-blogger' ) }
																	value={ getTopics().join( '\n' ) }
																	onChange={ ( e ) => {
																		if ( ! isViewMode ) {
																			const topics = e.target.value.split( '\n' );
																			setDrawerData( { ...drawerData, campaignTopics: topics } );
																		}
																	} }
																	readOnly={ isViewMode }
																/>
																<p className="mt-1 text-xs text-gray-500">
																	{ __( 'Each line becomes a separate blog post. Leave empty to let AI choose topics automatically.', 'solvex-ai-blogger' ) }
																</p>
															</div>
														) }

														<div className="flex items-center justify-between">
															<label htmlFor="campaign-repeat-after" className="flex items-center text-sm/6 font-medium text-gray-900">
																{ __( 'Repeat Every', 'solvex-ai-blogger' ) }
																<Tooltip
																	text={ __( 'Set how often the campaign should run automatically.', 'solvex-ai-blogger' ) }
																	delay={ 100 }
																	className="z-[99999] bg-black text-white shadow-md p-2 rounded-md"
																>
																	<QuestionMarkCircleIcon
																		aria-hidden="true"
																		className="size-4 ml-1 text-gray-400 group-hover:text-gray-500"
																	/>
																</Tooltip>
															</label>

															<div className="mt-2 flex gap-2">
																<input
																	id="campaign-repeat-after"
																	name="campaign-repeat-after"
																	defaultValue={ drawerData.repeatInterval || 1 }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, repeatInterval: parseInt( e.target.value ) || 1 } ) }
																	onWheel={ ( e ) => e.target.blur() }
																	type="number"
																	min="1"
																	max="365"
																	readOnly={ isViewMode }
																	className={ `block w-20 rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 ${ isViewMode ? 'bg-gray-50 outline-gray-200' : 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand' }` }
																/>
																<select
																	className={ `min-w-[100px] ${ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }` }
																	value={ drawerData.repeatUnit || 'day' }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, repeatUnit: e.target.value } ) }
																	disabled={ isViewMode }
																>
																	<option value="day">{ __( 'Day(s)', 'solvex-ai-blogger' ) }</option>
																	<option value="week">{ __( 'Week(s)', 'solvex-ai-blogger' ) }</option>
																</select>
															</div>
														</div>
														{ 'week' === drawerData.repeatUnit && (
															<div className="flex items-center justify-between">
																<label className={ `text-sm/6 font-medium ${ fieldErrors[ 'weekly-days' ] ? 'text-red-700' : 'text-gray-900' }` }> {/* eslint-disable-line */}
																	{ __( 'On Days', 'solvex-ai-blogger' ) }
																</label>
																<div>
																	<div className="flex flex-wrap gap-2 justify-end">
																		{ [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ].map( ( day ) => (
																			<button
																				key={ day }
																				type="button"
																				onClick={ () => {
																					if ( isViewMode ) {
																						return;
																					}
																					const repeatWeeklyOn = drawerData.repeatWeeklyOn || [];
																					const newRepeatOn = repeatWeeklyOn.includes( day )
																						? repeatWeeklyOn.filter( ( d ) => d !== day )
																						: [ ...repeatWeeklyOn, day ];
																					setDrawerData( { ...drawerData, repeatWeeklyOn: newRepeatOn } );
																				} }
																				className={ `capitalize text-xs p-2 rounded-full border transition-colors duration-200 ${
																					( drawerData.repeatWeeklyOn || [] ).includes( day )
																						? fieldErrors[ 'weekly-days' ]
																							? 'bg-red-600 text-white border-red-600'
																							: 'bg-brand text-white border-brand'
																						: fieldErrors[ 'weekly-days' ]
																							? 'bg-red-50 text-red-900 border-red-300'
																							: 'bg-white text-gray-900 border-gray-300'
																				} ${ isViewMode ? 'cursor-not-allowed' : 'hover:bg-brand-600 hover:text-white hover:border-brand-600' }` }
																				disabled={ isViewMode }
																			>
																				{ day }
																			</button>
																		) ) }
																	</div>
																	{ fieldErrors[ 'weekly-days' ] && (
																		<p className="mt-1 text-sm text-red-600 text-right">
																			{ fieldErrors[ 'weekly-days' ] }
																		</p>
																	) }
																</div>
															</div>
														) }

														<div>
															<label htmlFor="start-date" className={ `flex items-center text-sm/6 font-medium mb-2 ${
																fieldErrors[ 'start-date' ] ? 'text-red-700' : 'text-gray-900'
															}` }>
																{ __( 'Start Date', 'solvex-ai-blogger' ) }
																<Tooltip
																	text={ __( 'Start Date can not be updated later.', 'solvex-ai-blogger' ) }
																	delay={ 100 }
																	className="z-[99999] bg-black text-white shadow-md p-2 rounded-md"
																>
																	<QuestionMarkCircleIcon
																		aria-hidden="true"
																		className="size-4 ml-1 text-gray-400 group-hover:text-gray-500"
																	/>
																</Tooltip>
															</label>
															<DateTimeField
																id="start-date"
																name="start-date"
																value={ drawerData.startDate }
																onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, startDate: e.target.value } ) }
																readOnly={ isViewMode }
																disabled={ drawerData.type === 'edit' && hasStartDatePassed( drawerData.startDate ) }
																placeholder={ __( 'Select campaign start date', 'solvex-ai-blogger' ) }
																error={ fieldErrors[ 'start-date' ] }
															/>
														</div>

														<div className="flex items-center justify-between">
															<label htmlFor="use-summary-as-excerpt" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Use Summary as Excerpt?', 'solvex-ai-blogger' ) }
															</label>
															<div className="mt-2">
																<SwitchControl
																	checked={ drawerData.summaryAsExcerpt }
																	onChange={ () => ! isViewMode && setDrawerData( { ...drawerData, summaryAsExcerpt: ! drawerData.summaryAsExcerpt } ) }
																	id="use-summary-as-excerpt"
																	disabled={ isViewMode }
																/>
															</div>
														</div>

														<fieldset>
															<legend className="text-sm/6 font-medium text-gray-900"> { __( 'Campaign Status', 'solvex-ai-blogger' ) } </legend>

															<div className="mt-2 space-y-4">
																<div className="relative flex items-start">
																	<div className="absolute flex h-6 mt-1 items-center">
																		<input
																			defaultValue="public"
																			id="privacy-public"
																			name="privacy"
																			type="radio"
																			checked={ drawerData.status === 'publish' }
																			aria-describedby="privacy-public-description"
																			className="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white checked:border-brand-600 checked:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden [&:not(:checked)]:before:hidden"
																			onChange={ () => ! isViewMode && setDrawerData( { ...drawerData, status: 'publish' } ) }
																			disabled={ isViewMode }
																		/>
																	</div>
																	<div className="pl-7 text-sm/6">
																		<label htmlFor="privacy-public" className="font-medium text-gray-900">
																			{ __( 'On', 'solvex-ai-blogger' ) }
																			{ ' ' }
																			<span id="privacy-public-description" className="text-gray-500 text-normal">
																				{ __( 'The campaign will be activated immediately and start running.', 'solvex-ai-blogger' ) }
																			</span>
																		</label>
																	</div>
																</div>

																<div>
																	<div className="relative flex items-start">
																		<div className="absolute flex h-6 mt-1 items-center">
																			<input
																				defaultValue="private-to-project"
																				id="privacy-private-to-project"
																				name="privacy"
																				type="radio"
																				checked={ drawerData.status === 'draft' }
																				aria-describedby="privacy-private-to-project-description"
																				className="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white checked:border-brand-600 checked:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden [&:not(:checked)]:before:hidden"
																				onChange={ () => ! isViewMode && setDrawerData( { ...drawerData, status: 'draft' } ) }
																				disabled={ isViewMode }
																			/>
																		</div>
																		<div className="pl-7 text-sm/6">
																			<label htmlFor="privacy-private-to-project" className="font-medium text-gray-900">
																				{ __( 'Off', 'solvex-ai-blogger' ) }
																				{ ' ' }
																				<span id="privacy-private-to-project-description" className="text-gray-500 text-normal">
																					{ __( 'The campaign setup will be saved, but it won\'t run until you switch it ON.', 'solvex-ai-blogger' ) }
																				</span>
																			</label>
																		</div>
																	</div>
																</div>
															</div>
														</fieldset>
													</div>
												</div>
											</div>
										)
									}

									{
										'filters' === activeTab && (
											<div className="flex flex-1 flex-col justify-between">
												<div className="divide-y divide-gray-200 px-4 sm:px-6">
													<div className="space-y-6 pb-5 pt-6">
														<div className="flex items-center justify-between post-filters-option">
															<label htmlFor="post-type" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Post Type', 'solvex-ai-blogger' ) }
															</label>
															<div>
																<select
																	className={ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }
																	id="post-type"
																	value={ drawerData.postType }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, postType: e.target.value } ) }
																	disabled={ isViewMode }
																>
																	{ Object.entries( postTypes ).map( ( [ type, label ] ) => (
																		<option key={ type } value={ type }>
																			{ label }
																		</option>
																	) ) }
																</select>
															</div>
														</div>

														<div className="flex items-center justify-between post-filters-option">
															<label htmlFor="post-author" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Post Author', 'solvex-ai-blogger' ) }
															</label>
															<div>
																<select
																	className={ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }
																	id="post-author"
																	value={ drawerData.author }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, author: e.target.value } ) }
																	disabled={ isViewMode }
																>
																	{ authors.map( ( author ) => (
																		<option key={ author.id } value={ author.id }>
																			{ author.name }
																		</option>
																	) ) }
																</select>
															</div>
														</div>

														<div className="flex items-center justify-between post-filters-option">
															<label htmlFor="post-status" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Post Status', 'solvex-ai-blogger' ) }
															</label>
															<div>
																<select
																	className={ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }
																	id="post-status"
																	value={ drawerData.postStatus }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, postStatus: e.target.value } ) }
																	disabled={ isViewMode }
																>
																	{ Object.entries( postStatuses ).map( ( [ key, label ] ) => (
																		<option key={ key } value={ key }>
																			{ label }
																		</option>
																	) ) }
																</select>
															</div>
														</div>

														{
															'post' === drawerData.postType && (
																<>
																	<div className="flex items-center justify-between post-filters-option">
																		<label htmlFor="post-category" className="block text-sm/6 font-medium text-gray-900">
																			{ __( 'Post Category', 'solvex-ai-blogger' ) }
																		</label>
																		<div>
																			<select
																				className={ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }
																				id="post-category"
																				value={ drawerData.category || '' }
																				onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, category: e.target.value } ) }
																				disabled={ isViewMode }
																			>
																				<option value=""> { __( '-- Select --', 'solvex-ai-blogger' ) } </option>
																				{ categories.map( ( category ) => (
																					<option key={ category.id } value={ category.id }>
																						{ category.name }
																					</option>
																				) ) }
																			</select>
																		</div>
																	</div>

																	<div className="flex items-center justify-between post-filters-option">
																		<label htmlFor="post-tag" className="block text-sm/6 font-medium text-gray-900">
																			{ __( 'Post Tag', 'solvex-ai-blogger' ) }
																		</label>
																		<div>
																			<select
																				className={ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }
																				id="post-tag"
																				value={ drawerData.tag || '' }
																				onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, tag: e.target.value } ) }
																				disabled={ isViewMode }
																			>
																				<option value=""> { __( '-- Select --', 'solvex-ai-blogger' ) } </option>
																				{ tags.map( ( tag ) => (
																					<option key={ tag.id } value={ tag.id }>
																						{ tag.name }
																					</option>
																				) ) }
																			</select>
																		</div>
																	</div>
																</>
															)
														}
													</div>
												</div>
											</div>
										)
									}

									{
										'advanced' === activeTab && (
											<div className="flex flex-1 flex-col justify-between">
												<div className="divide-y divide-gray-200 px-4 sm:px-6">
													<div className="space-y-6 pb-5 pt-6">
														<div className="flex items-center justify-between">
															<label htmlFor="maximum-words" className="flex items-center text-sm/6 font-medium text-gray-900">
																{ __( 'Maximum Content Words', 'solvex-ai-blogger' ) }
																<Tooltip
																	text={ wpsolvex_autoaiblogger_localized_data.pro_available
																		? __( 'Set the maximum number of words for generated content (100-5000 words).', 'solvex-ai-blogger' )
																		: __( 'Free users are limited to 1000 words. Upgrade to Pro to customize up to 5000 words.', 'solvex-ai-blogger' )
																	}
																	delay={ 100 }
																	className="z-[99999] bg-black text-white shadow-md p-2 rounded-md"
																>
																	<QuestionMarkCircleIcon
																		aria-hidden="true"
																		className="size-4 ml-1 text-gray-400 group-hover:text-gray-500"
																	/>
																</Tooltip>
															</label>

															<div className="mt-2">
																<input
																	id="maximum-words"
																	name="maximum-words"
																	value={ drawerData.maxWords || '' }
																	onChange={ ( e ) => {
																		if ( isViewMode ) {
																			return;
																		}
																		let value = parseInt( e.target.value ) || 0;
																		const maxLimit = wpsolvex_autoaiblogger_localized_data.pro_available ? 5000 : 1000;

																		// Enforce limits
																		if ( value > maxLimit ) {
																			value = maxLimit;
																		} else if ( value < 0 ) {
																			value = 0;
																		}

																		setDrawerData( { ...drawerData, maxWords: value } );
																	} }
																	onWheel={ ( e ) => e.target.blur() }
																	type="number"
																	min="100"
																	max={ wpsolvex_autoaiblogger_localized_data.pro_available ? 5000 : 1000 }
																	readOnly={ isViewMode }
																	disabled={ wpsolvex_autoaiblogger_localized_data.pro_available ? false : true }
																	placeholder={ wpsolvex_autoaiblogger_localized_data.pro_available ? __( 'e.g., 1500', 'solvex-ai-blogger' ) : __( '1000 (Free limit)', 'solvex-ai-blogger' ) }
																	className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 ${ isViewMode ? 'bg-gray-50 outline-gray-200' : 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand' }` }
																/>
															</div>
														</div>

														<div className="flex items-center justify-between">
															<label htmlFor="number-of-images" className="flex items-center text-sm/6 font-medium text-gray-900">
																{ __( 'Number of Content Images', 'solvex-ai-blogger' ) }
																<Tooltip
																	text={ wpsolvex_autoaiblogger_localized_data.pro_available
																		? __( 'Number of images in post content (1-5). A featured image is automatically included.', 'solvex-ai-blogger' )
																		: __( 'Free users are limited to 1 content image. Upgrade to Pro for up to 5. Featured image is always included.', 'solvex-ai-blogger' )
																	}
																	delay={ 100 }
																	className="z-[99999] bg-black text-white shadow-md p-2 rounded-md"
																>
																	<QuestionMarkCircleIcon
																		aria-hidden="true"
																		className="size-4 ml-1 text-gray-400 group-hover:text-gray-500"
																	/>
																</Tooltip>
															</label>

															<div className="mt-2">
																<input
																	id="number-of-images"
																	name="number-of-images"
																	value={ drawerData.numberOfImages || '' }
																	onChange={ ( e ) => {
																		if ( isViewMode ) {
																			return;
																		}
																		let value = parseInt( e.target.value ) || 0;
																		const maxLimit = wpsolvex_autoaiblogger_localized_data.pro_available ? 5 : 1;

																		// Enforce limits
																		if ( value > maxLimit ) {
																			value = maxLimit;
																		} else if ( value < 0 ) {
																			value = 0;
																		}

																		setDrawerData( { ...drawerData, numberOfImages: value } );
																	} }
																	onWheel={ ( e ) => e.target.blur() }
																	type="number"
																	min="1"
																	max={ wpsolvex_autoaiblogger_localized_data.pro_available ? 5 : 1 }
																	readOnly={ isViewMode }
																	disabled={ wpsolvex_autoaiblogger_localized_data.pro_available ? false : true }
																	placeholder={ wpsolvex_autoaiblogger_localized_data.pro_available ? __( 'e.g., 3', 'solvex-ai-blogger' ) : __( '1 (Free limit)', 'solvex-ai-blogger' ) }
																	className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 ${ isViewMode ? 'bg-gray-50 outline-gray-200' : 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand' }` }
																/>
															</div>
														</div>

														{ /* Phase 2: Per-campaign Content Tone & Demographic */ }
														<div>
															<label htmlFor="campaign-content-tone" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Content Tone', 'solvex-ai-blogger' ) }
															</label>
															<div className="mt-2">
																<select
																	id="campaign-content-tone"
																	value={ drawerData.contentTone || '' }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, contentTone: e.target.value } ) }
																	disabled={ isViewMode }
																	className={ `w-full ${ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }` }
																>
																	<option value="">{ __( 'Use global default', 'solvex-ai-blogger' ) }</option>
																	<option value="Professional">{ __( 'Professional', 'solvex-ai-blogger' ) }</option>
																	<option value="Conversational">{ __( 'Conversational', 'solvex-ai-blogger' ) }</option>
																	<option value="Academic">{ __( 'Academic', 'solvex-ai-blogger' ) }</option>
																	<option value="Humorous">{ __( 'Humorous', 'solvex-ai-blogger' ) }</option>
																	<option value="Urgent">{ __( 'Urgent', 'solvex-ai-blogger' ) }</option>
																</select>
																<p className="mt-1 text-xs text-gray-500">
																	{ __( 'Leave empty to use your global setting.', 'solvex-ai-blogger' ) }
																</p>
															</div>
														</div>

														<div>
															<label htmlFor="campaign-target-demographic" className="block text-sm/6 font-medium text-gray-900">
																{ __( 'Target Demographic', 'solvex-ai-blogger' ) }
															</label>
															<div className="mt-2">
																<select
																	id="campaign-target-demographic"
																	value={ drawerData.targetDemographic || '' }
																	onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, targetDemographic: e.target.value } ) }
																	disabled={ isViewMode }
																	className={ `w-full ${ isViewMode ? 'wpsolvex-autoaiblogger-select-control-readonly' : 'wpsolvex-autoaiblogger-select-control' }` }
																>
																	<option value="">{ __( 'Use global default', 'solvex-ai-blogger' ) }</option>
																	<option value="General Public">{ __( 'General Public', 'solvex-ai-blogger' ) }</option>
																	<option value="Beginners">{ __( 'Beginners', 'solvex-ai-blogger' ) }</option>
																	<option value="Intermediate">{ __( 'Intermediate', 'solvex-ai-blogger' ) }</option>
																	<option value="Experts/Professionals">{ __( 'Experts / Professionals', 'solvex-ai-blogger' ) }</option>
																</select>
																<p className="mt-1 text-xs text-gray-500">
																	{ __( 'Leave empty to use your global setting.', 'solvex-ai-blogger' ) }
																</p>
															</div>
														</div>

														<div className="flex items-center justify-between">
															<label htmlFor="override-site-persona" className="flex items-center text-sm/6 font-medium text-gray-900">
																{ __( 'Override Site Persona for this Campaign?', 'solvex-ai-blogger' ) }
																<Tooltip
																	text={ wpsolvex_autoaiblogger_localized_data.pro_available
																		? __( 'Customize site persona specifically for this campaign. This overrides your global site settings.', 'solvex-ai-blogger' )
																		: __( 'Pro feature: Customize site persona per campaign. Upgrade to unlock.', 'solvex-ai-blogger' )
																	}
																	delay={ 100 }
																	className="z-[99999] bg-black text-white shadow-md p-2 rounded-md"
																>
																	<QuestionMarkCircleIcon
																		aria-hidden="true"
																		className="size-4 ml-1 text-gray-400 group-hover:text-gray-500"
																	/>
																</Tooltip>
															</label>
															<div className="mt-2">
																<SwitchControl
																	checked={ drawerData.overrideSitePersona }
																	onChange={ () => ! isViewMode && setDrawerData( { ...drawerData, overrideSitePersona: ! drawerData.overrideSitePersona } ) }
																	id="override-site-persona"
																	disabled={ isViewMode || ! wpsolvex_autoaiblogger_localized_data.pro_available }
																/>
															</div>
														</div>

														{
															drawerData.overrideSitePersona && (
																<>
																	<div>
																		<label htmlFor="blog-for" className="block text-sm/6 font-medium text-gray-900">
																			{ __( 'Campaign For', 'solvex-ai-blogger' ) }
																		</label>
																		<div className="mt-2">
																			<input
																				id="blog-for"
																				name="blog-for"
																				type="text"
																				defaultValue={ drawerData.overrideSiteFor }
																				onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, overrideSiteFor: e.target.value } ) }
																				readOnly={ isViewMode }
																				className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 transition-colors duration-200 ${
																					fieldErrors[ 'blog-for' ]
																						? 'bg-red-50 outline-red-300 focus:outline-red-500 text-red-900'
																						: isViewMode
																							? 'bg-gray-50 outline-gray-200'
																							: 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand'
																				}` }
																				placeholder={ __( 'e.g., Fitness enthusiasts and health-conscious individuals', 'solvex-ai-blogger' ) }
																			/>
																			{ fieldErrors[ 'blog-for' ] && (
																				<p className="mt-1 text-sm text-red-600">
																					{ fieldErrors[ 'blog-for' ] }
																				</p>
																			) }
																		</div>
																	</div>

																	<div>
																		<label htmlFor="more-about-blog" className="block text-sm/6 font-medium text-gray-900">
																			{ __( 'Campaign Description', 'solvex-ai-blogger' ) }
																		</label>
																		<div className="mt-2">
																			<textarea
																				id="more-about-blog"
																				name="more-about-blog"
																				rows={ 3 }
																				className={ `block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 sm:text-sm/6 transition-colors duration-200 ${
																					fieldErrors[ 'more-about-blog' ]
																						? 'bg-red-50 outline-red-300 focus:outline-red-500 text-red-900'
																						: isViewMode
																							? 'bg-gray-50 outline-gray-200'
																							: 'bg-white outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-brand'
																				}` }
																				value={ drawerData.overrideSiteDescription }
																				onChange={ ( e ) => ! isViewMode && setDrawerData( { ...drawerData, overrideSiteDescription: e.target.value } ) }
																				readOnly={ isViewMode }
																				placeholder={ __( 'e.g., A comprehensive guide to yoga and wellness practices', 'solvex-ai-blogger' ) }
																			/>
																			{ fieldErrors[ 'more-about-blog' ] && (
																				<p className="mt-1 text-sm text-red-600">
																					{ fieldErrors[ 'more-about-blog' ] }
																				</p>
																			) }
																		</div>
																	</div>
																</>
															)
														}														<div>
															<div className="mt-4 flex text-sm">
																<a href="#" className="group inline-flex items-center text-gray-500 hover:text-gray-900">
																	<QuestionMarkCircleIcon
																		aria-hidden="true"
																		className="size-5 text-gray-400 group-hover:text-gray-500"
																	/>
																	<span className="ml-2">
																		{ __( 'Learn more about how to configure your campaign.', 'solvex-ai-blogger' ) }
																	</span>
																</a>
															</div>
														</div>

														{ ! wpsolvex_autoaiblogger_localized_data.pro_available &&
															<DynamicCard
																heading={ __( 'Unlock Premium Features', 'solvex-ai-blogger' ) }
																subHeading={ __( 'Upgrade to Pro for more features and benefits.', 'solvex-ai-blogger' ) }
																linkText={ __( 'Upgrade Now', 'solvex-ai-blogger' ) }
																linkUrl={ wpsolvex_autoaiblogger_localized_data.pro_purchase_url }
																colorScheme="brand"
																size="medium"
																ariaLabel={ __( 'Upgrade Now', 'solvex-ai-blogger' ) }
															/>
														}
													</div>
												</div>
											</div>
										)
									}
								</div>

								<div className="flex shrink-0 justify-between items-center px-4 py-4">
									{ errorMessage && (
										<div className="flex items-center px-2 py-1 rounded bg-red-50 border border-red-200 max-w-[60%]">
											<svg className="w-3 h-3 text-red-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
											</svg>
											{ errorMessage.length > 80 ? (
												<span className="text-xs text-red-700 font-medium">
													{ __( 'An error occurred.', 'solvex-ai-blogger' ) }
													{ ' ' }
													<button
														type="button"
														onClick={ () => setErrorDialogOpen( true ) }
														className="text-red-600 underline hover:text-red-800 bg-transparent border-none cursor-pointer text-xs font-medium p-0"
													>
														{ __( 'View Details', 'solvex-ai-blogger' ) }
													</button>
												</span>
											) : (
												<span className="text-xs text-red-700 font-medium">
													{ errorMessage }
												</span>
											) }
										</div>
									) }

									{ /* Error Details Dialog */ }
									{ errorDialogOpen && (
										<div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50" onClick={ () => setErrorDialogOpen( false ) }>
											<div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" onClick={ ( e ) => e.stopPropagation() }>
												<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
													<h3 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
														<svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
														</svg>
														{ __( 'Error Details', 'solvex-ai-blogger' ) }
													</h3>
													<button
														type="button"
														onClick={ () => setErrorDialogOpen( false ) }
														className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1"
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
														</svg>
													</button>
												</div>
												<div className="px-4 py-3 overflow-y-auto">
													<pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono bg-gray-50 rounded p-3 m-0">{ errorMessage }</pre>
												</div>
												<div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
													<button
														type="button"
														onClick={ () => {
															navigator.clipboard.writeText( errorMessage );
														} }
														className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
													>
														{ __( '📋 Copy', 'solvex-ai-blogger' ) }
													</button>
													<button
														type="button"
														onClick={ () => setErrorDialogOpen( false ) }
														className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-brand-700 cursor-pointer border-none"
													>
														{ __( 'Close', 'solvex-ai-blogger' ) }
													</button>
												</div>
											</div>
										</div>
									) }

									<div className={ `flex items-center space-x-2 ${ ! errorMessage ? 'ml-auto' : '' }` }>
										<button
											type="button"
											onClick={ closePopup }
											className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
										>
											{ isViewMode ? __( 'Close', 'solvex-ai-blogger' ) : __( 'Cancel', 'solvex-ai-blogger' ) }
										</button>

										{ ! isViewMode && (
											<button
												onClick={ handleCampaign }
												disabled={ handlingCampaign || ( () => {
												// Check if campaign is completed to disable update button
													if ( drawerData.type === 'new' ) {
														return false;
													} // Allow creation of new campaigns

													const postsCreated = parseInt( drawerData.postsCreated ) || 0;
													const postsTarget = parseInt( drawerData.postsTarget ) || 0;
													const postsRemaining = Math.max( 0, postsTarget - postsCreated );

													// Campaign is completed if:
													// 1. Status is draft (inactive), OR
													// 2. Target is met (created >= target), OR
													// 3. All attempts completed (campaignCompleted flag is true), OR
													// 4. All attempts have been made AND undelivered posts are showing
													const isTargetMet = postsTarget > 0 && postsCreated >= postsTarget;
													const isAllAttemptsCompleted = drawerData.campaignCompleted === true;
													const isCompletedBase = drawerData.status === 'draft' || isTargetMet || isAllAttemptsCompleted;
													const isAllAttemptsMadeWithFailures = postsTarget > 0 && postsRemaining > 0 && isCompletedBase && ( postsCreated + postsRemaining ) >= postsTarget;

													return isCompletedBase || isAllAttemptsMadeWithFailures;
												} )() }
												className={ `ml-4 inline-flex justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
													handlingCampaign || ( drawerData.type === 'edit' && ( () => {
														const postsCreated = parseInt( drawerData.postsCreated ) || 0;
														const postsTarget = parseInt( drawerData.postsTarget ) || 0;
														const postsRemaining = Math.max( 0, postsTarget - postsCreated );
														const isTargetMet = postsTarget > 0 && postsCreated >= postsTarget;
														const isAllAttemptsCompleted = drawerData.campaignCompleted === true;
														const isCompletedBase = drawerData.status === 'draft' || isTargetMet || isAllAttemptsCompleted;
														const isAllAttemptsMadeWithFailures = postsTarget > 0 && postsRemaining > 0 && isCompletedBase && ( postsCreated + postsRemaining ) >= postsTarget;
														return isCompletedBase || isAllAttemptsMadeWithFailures;
													} )() )
														? 'cursor-not-allowed opacity-50 bg-gray-400 text-gray-200 focus-visible:outline-gray-400'
														: 'bg-brand text-white hover:bg-brand-700 focus-visible:outline-brand'
												}` }
												title={ drawerData.type === 'edit' && ( () => {
													const postsCreated = parseInt( drawerData.postsCreated ) || 0;
													const postsTarget = parseInt( drawerData.postsTarget ) || 0;
													const postsRemaining = Math.max( 0, postsTarget - postsCreated );
													const isTargetMet = postsTarget > 0 && postsCreated >= postsTarget;
													const isAllAttemptsCompleted = drawerData.campaignCompleted === true;
													const isCompletedBase = drawerData.status === 'draft' || isTargetMet || isAllAttemptsCompleted;
													const isAllAttemptsMadeWithFailures = postsTarget > 0 && postsRemaining > 0 && isCompletedBase && ( postsCreated + postsRemaining ) >= postsTarget;
													return isCompletedBase || isAllAttemptsMadeWithFailures;
												} )() ? __( 'Campaign completed - Updates disabled', 'solvex-ai-blogger' ) : '' }
											>
												{ ( drawerData.type === 'new' ) ? __( 'Create', 'solvex-ai-blogger' ) : __( 'Update', 'solvex-ai-blogger' ) }
											</button>
										) }
									</div>

								</div>
							</form>
						</DialogPanel>
					</div>
				</div>
			</div>
		</Dialog>
	);
}
