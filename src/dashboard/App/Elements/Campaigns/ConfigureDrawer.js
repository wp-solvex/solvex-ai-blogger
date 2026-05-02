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

		updateCampaign( drawerData, drawerData.type === 'new', abortControllerRef )
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

														<div className="grid grid-cols-1 gap-2">
															<div className="flex items-center justify-between">
																<label htmlFor="campaign-target" className="flex items-center text-sm/6 font-medium text-gray-900">
																	{ __( 'Posts Target', 'solvex-ai-blogger' ) }
																	<Tooltip
																		text={ drawerData.type === 'edit'
																			? __( 'Post Target can not be updated.', 'solvex-ai-blogger' )
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
																	{ __( 'Once set, campaign targets are unchangeable.', 'solvex-ai-blogger' ) }
																</div>
															) }
														</div>

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
										<div className="flex items-center px-2 py-1 rounded bg-red-50 border border-red-200">
											<svg className="w-3 h-3 text-red-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
											</svg>
											<span className="text-xs text-red-700 font-medium">
												{ errorMessage }
											</span>
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
