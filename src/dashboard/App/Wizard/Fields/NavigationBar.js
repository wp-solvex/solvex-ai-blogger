import React, { useRef, useCallback, useMemo, memo } from 'react';
import { __ } from '@wordpress/i18n';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Settings, User, CreditCard, Mail, CheckCircle2 } from 'lucide-react';
import BrandIcon from '@AppImages/brand-logo.svg';
import { updateApiData } from '@Utils/ApiData';
import { useDispatch } from 'react-redux';

// Enhanced step indicator component
const StepIndicator = memo( ( { menu, isActive, isCompleted, onClick } ) => {
	const getStepIcon = ( stepId ) => {
		const iconMap = {
			welcome: Settings,
			'persona-form': User,
			license: CreditCard,
			optin: Mail,
			ready: CheckCircle2,
		};
		return iconMap[ stepId ] || Settings;
	};

	const Icon = getStepIcon( menu.id );

	const handleClick = useCallback( ( e ) => {
		e.preventDefault();
		onClick( menu.id );
	}, [ onClick, menu.id ] );

	const handleKeyDown = useCallback( ( e ) => {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			handleClick( e );
		}
	}, [ handleClick ] );

	return (
		<button
			type="button"
			className={ `
				group inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
				transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
				${ isActive
			? 'bg-brand-100 text-brand-700 shadow-sm border-2 border-brand-200'
			: 'text-gray-600 hover:text-brand-600 hover:bg-brand-50 border-2 border-transparent'
		}
				${ isCompleted && ! isActive ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : '' }
			` }
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			aria-current={ isActive ? 'step' : undefined }
			aria-label={ `Go to ${ menu.name } step` }
		>
			<Icon
				className={ `
					w-4 h-4 transition-colors duration-200
					${ isActive ? 'text-brand-600' : '' }
					${ isCompleted && ! isActive ? 'text-green-500' : '' }
				` }
				aria-hidden="true"
			/>
			<span className="hidden lg:inline">{ menu.name }</span>

			{ /* Completion indicator */ }
			{ isCompleted && ! isActive && (
				<CheckCircle2 className="w-3 h-3 text-green-500 ml-1" aria-hidden="true" />
			) }
		</button>
	);
} );

StepIndicator.displayName = 'WizardStepIndicator';

// Enhanced exit button component
const ExitButton = memo( ( { onClick } ) => {
	const handleClick = useCallback( ( e ) => {
		e.preventDefault();
		if ( window.confirm( __( 'Are you sure you want to exit the setup wizard?', 'solvex-ai-blogger' ) ) ) {
			onClick();
		}
	}, [ onClick ] );

	const handleKeyDown = useCallback( ( e ) => {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			handleClick( e );
		}
	}, [ handleClick ] );

	return (
		<button
			type="button"
			className="flex group relative p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			aria-label={ __( 'Exit setup wizard', 'solvex-ai-blogger' ) }
			title={ __( 'Exit setup wizard', 'solvex-ai-blogger' ) }
		>
			<X className="w-5 h-5" aria-hidden="true" />

			{ /* Tooltip */ }
			<span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
				{ __( 'Exit Setup', 'solvex-ai-blogger' ) }
			</span>
		</button>
	);
} );

ExitButton.displayName = 'WizardExitButton';

const NavigationBar = memo( () => {
	const abortControllerRef = useRef( {} );
	const dispatch = useDispatch();
	const location = useLocation();
	const navigate = useNavigate();

	// Enhanced URL parameter handling
	const currentStep = useMemo( () => {
		const params = new URLSearchParams( location.search );
		return params.get( 'step' ) || 'welcome';
	}, [ location.search ] );

	// Enhanced menu configuration with completion tracking
	const menus = useMemo( () => [
		{
			name: __( 'Welcome', 'solvex-ai-blogger' ),
			id: 'welcome',
		},
		{
			name: __( 'Site Info', 'solvex-ai-blogger' ),
			id: 'persona-form',
		},
		{
			name: __( 'License', 'solvex-ai-blogger' ),
			id: 'license',
		},
		{
			name: __( 'Subscribe', 'solvex-ai-blogger' ),
			id: 'optin',
		},
		{
			name: __( 'Done', 'solvex-ai-blogger' ),
			id: 'ready',
		},
	], [] );

	// Determine completed steps (simplified logic - can be enhanced with actual completion state)
	const getCompletedSteps = useCallback( () => {
		const currentIndex = menus.findIndex( ( menu ) => menu.id === currentStep );
		return menus.slice( 0, currentIndex ).map( ( menu ) => menu.id );
	}, [ menus, currentStep ] );

	const completedSteps = useMemo( () => getCompletedSteps(), [ getCompletedSteps ] );

	// Enhanced exit handler
	const handleExit = useCallback( async () => {
		try {
			dispatch( { type: 'UPDATE_USER_ONBOARDED', payload: true } );
			await updateApiData( 'userOnboarded', true, dispatch, abortControllerRef );

			// Navigate to dashboard or show success message
			window.location.href = solvex_aib_localized_data.admin_app_url;
		} catch ( error ) {
			console.error( 'Failed to exit wizard:', error );
		}
	}, [ dispatch ] );

	// Enhanced step navigation
	const handleStepNavigation = useCallback( ( stepId ) => {
		if ( stepId && stepId !== currentStep ) {
			navigate( `?step=${ stepId }` );
		}
	}, [ navigate, currentStep ] );

	return (
		<header
			className="solvex-aib-setup-header bg-white border-b border-gray-200 shadow-sm"
			role="banner"
			aria-label={ __( 'Setup wizard navigation', 'solvex-ai-blogger' ) }
		>
			<div className="px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between items-center">
					{ /* Brand section */ }
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0 flex">
							<img
								className="h-8 w-auto"
								src={ BrandIcon }
								alt="Solvex AI Blogger"
							/>
						</div>
						<div className="hidden sm:block">
							<h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
								{ __( 'Setup Wizard', 'solvex-ai-blogger' ) }
							</h1>
						</div>
					</div>

					{ /* Navigation steps */ }
					<nav
						className="hidden md:flex items-center space-x-2"
						aria-label={ __( 'Setup wizard steps', 'solvex-ai-blogger' ) }
						role="navigation"
					>
						{ menus.map( ( menu ) => (
							<StepIndicator
								key={ menu.id }
								menu={ menu }
								isActive={ currentStep === menu.id }
								isCompleted={ completedSteps.includes( menu.id ) }
								onClick={ handleStepNavigation }
							/>
						) ) }
					</nav>

					{ /* Mobile step indicator */ }
					<div className="md:hidden flex items-center">
						<span className="text-sm text-gray-600 font-medium">
							{ menus.find( ( menu ) => menu.id === currentStep )?.name || __( 'Setup', 'solvex-ai-blogger' ) }
						</span>
					</div>

					{ /* Exit button */ }
					<div className="flex items-center">
						<ExitButton onClick={ handleExit } />
					</div>
				</div>
			</div>

			{ /* Progress bar */ }
			<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200">
				<div
					className="h-full bg-brand-600 transition-all duration-300 ease-in-out"
					style={ {
						width: `${ ( ( menus.findIndex( ( m ) => m.id === currentStep ) + 1 ) / menus.length ) * 100 }%`,
					} }
					role="progressbar"
					aria-valuenow={ menus.findIndex( ( m ) => m.id === currentStep ) + 1 }
					aria-valuemin={ 1 }
					aria-valuemax={ menus.length }
				/>
			</div>

			{ /* Screen reader announcements */ }
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{ `Currently on step: ${ menus.find( ( menu ) => menu.id === currentStep )?.name }` }
			</div>
		</header>
	);
} );

NavigationBar.displayName = 'WizardNavigationBar';

export default NavigationBar;
