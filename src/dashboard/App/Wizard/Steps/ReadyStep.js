import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { __ } from '@wordpress/i18n';
import confetti from 'canvas-confetti';
import { useDispatch, useSelector } from 'react-redux';
import { updateApiData } from '@Utils/ApiData';
import {
	CheckCircle2,
	Sparkles,
	ArrowRight,
	Star,
	Loader2,
	Trophy,
	PlayCircle,
	ExternalLink,
	Gift,
} from 'lucide-react';

// Enhanced success feature component
const SuccessFeature = memo( ( { icon: Icon, title, description, highlight = false } ) => (
	<div className={ `
		p-4 rounded-xl border transition-all duration-200 hover:shadow-md
		${ highlight
		? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
		: 'bg-gray-50 border-gray-200'
	}
	` }>
		<div className="flex items-start gap-3">
			<div className={ `
				p-2 rounded-lg shrink-0
				${ highlight ? 'bg-green-100' : 'bg-gray-100' }
			` }>
				<Icon className={ `w-5 h-5 ${ highlight ? 'text-green-600' : 'text-gray-600' }` } aria-hidden="true" />
			</div>
			<div>
				<h3 className="text-sm font-semibold text-gray-900 mb-1">
					{ title }
				</h3>
				<p className="text-xs text-gray-600 leading-relaxed">
					{ description }
				</p>
			</div>
		</div>
	</div>
) );

SuccessFeature.displayName = 'ReadySuccessFeature';

// Enhanced next steps component
const NextStepsCard = memo( () => (
	<div className="mt-8 p-6 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 rounded-xl">
		<div className="flex items-center gap-3 mb-4">
			<div className="p-2 bg-brand-100 rounded-lg">
				<PlayCircle className="w-6 h-6 text-brand-600" aria-hidden="true" />
			</div>
			<div>
				<h3 className="text-lg font-semibold text-gray-900">
					{ __( 'What\'s Next?', 'solvex-ai-blogger' ) }
				</h3>
				<p className="text-sm text-gray-600">
					{ __( 'Learn how to get the most out of Solvex AI Blogger', 'solvex-ai-blogger' ) }
				</p>
			</div>
		</div>

		<div className="space-y-3">
			<div className="flex items-center gap-3 text-sm">
				<CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
				<span className="text-gray-700">{ __( 'Create your first AI-powered blog post', 'solvex-ai-blogger' ) }</span>
			</div>
			<div className="flex items-center gap-3 text-sm">
				<CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
				<span className="text-gray-700">{ __( 'Set up automated content schedules', 'solvex-ai-blogger' ) }</span>
			</div>
			<div className="flex items-center gap-3 text-sm">
				<CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
				<span className="text-gray-700">{ __( 'Optimize your content for search engines', 'solvex-ai-blogger' ) }</span>
			</div>
		</div>

		<a
			href="#"
			className="
				inline-flex items-center gap-2 mt-4 text-sm font-medium text-brand-600
				hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500
				focus:ring-offset-2 rounded transition-colors duration-200
			"
			aria-label={ __( 'Watch getting started video', 'solvex-ai-blogger' ) }
		>
			<PlayCircle className="w-4 h-4" aria-hidden="true" />
			{ __( 'Watch Getting Started Video', 'solvex-ai-blogger' ) }
			<ExternalLink className="w-3 h-3" aria-hidden="true" />
		</a>
	</div>
) );

NextStepsCard.displayName = 'ReadyNextStepsCard';

// Enhanced finish button
const FinishButton = memo( ( { onClick, loading, children } ) => {
	const handleClick = useCallback( ( e ) => {
		e.preventDefault();
		if ( ! loading ) {
			onClick( e );
		}
	}, [ onClick, loading ] );

	return (
		<button
			type="button"
			onClick={ handleClick }
			disabled={ loading }
			className="
				group inline-flex items-center gap-3 px-10 py-5
				bg-gradient-to-r from-green-600 to-emerald-600
				text-white font-bold text-lg rounded-xl shadow-lg
				hover:from-green-700 hover:to-emerald-700
				focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
				transform transition-all duration-200 hover:scale-105 hover:shadow-xl
				disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
			"
			aria-label={ __( 'Complete setup and go to dashboard', 'solvex-ai-blogger' ) }
		>
			{ loading ? (
				<Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
			) : (
				<Trophy className="w-6 h-6" aria-hidden="true" />
			) }
			<span>{ children }</span>
			{ ! loading && (
				<ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
			) }
		</button>
	);
} );

FinishButton.displayName = 'ReadyFinishButton';

const ReadyStep = memo( () => {
	const abortControllerRef = useRef( {} );
	const dispatch = useDispatch();

	// Redux state
	const showConfetti = useSelector( ( state ) => state.showConfetti );

	// Component state
	const [ isFinishingSetup, setIsFinishingSetup ] = useState( false );

	// Enhanced confetti effect
	const triggerConfetti = useCallback( () => {
		const ConfettiFrame = confetti.create(
			document.getElementById( 'solvex-aib-confetti-wrapper' ),
			{ resize: true }
		);

		// Multiple confetti bursts for better effect
		const colors = [ '#0e6ef1', '#f5b800', '#ff344c', '#98e027', '#9900f1' ];

		// Left side burst
		ConfettiFrame( {
			particleCount: 150,
			origin: { x: 0, y: 0.8 },
			gravity: 0.6,
			spread: 70,
			angle: 60,
			startVelocity: 80,
			colors,
		} );

		// Right side burst
		setTimeout( () => {
			ConfettiFrame( {
				particleCount: 150,
				origin: { x: 1, y: 0.8 },
				gravity: 0.6,
				spread: 70,
				angle: 120,
				startVelocity: 80,
				colors,
			} );
		}, 200 );

		// Center burst
		setTimeout( () => {
			ConfettiFrame( {
				particleCount: 100,
				origin: { x: 0.5, y: 0.6 },
				gravity: 0.8,
				spread: 90,
				angle: 90,
				startVelocity: 60,
				colors,
			} );
		}, 400 );

		dispatch( {
			type: 'UPDATE_CONFETTI_SHOW',
			payload: true,
		} );
	}, [ dispatch ] );

	// Setup effect
	useEffect( () => {
		// Mark user as onboarded
		dispatch( { type: 'UPDATE_USER_ONBOARDED', payload: true } );
		updateApiData( 'userOnboarded', true, dispatch, abortControllerRef );

		// Trigger confetti if not shown yet
		if ( ! showConfetti ) {
			setTimeout( triggerConfetti, 300 );
		}

		// Auto-redirect after delay (optional)
		const autoRedirectTimer = setTimeout( () => {
			if ( ! isFinishingSetup ) {
				const redirectUrl = '?page=solvex-ai-blogger';
				window.location.href = solvex_aib_localized_data.admin_base_url + redirectUrl;
			}
		}, 15000 ); // 15 seconds

		return () => clearTimeout( autoRedirectTimer );
	}, [ dispatch, showConfetti, triggerConfetti, isFinishingSetup ] );

	// Handle finish setup
	const handleFinishSetup = useCallback( ( e ) => {
		e.preventDefault();
		setIsFinishingSetup( true );

		// Small delay for better UX
		setTimeout( () => {
			const redirectUrl = '?page=solvex-ai-blogger';
			window.location.href = solvex_aib_localized_data.admin_base_url + redirectUrl;
		}, 1000 );
	}, [] );

	const successFeatures = [
		{
			icon: CheckCircle2,
			title: __( 'Setup Complete', 'solvex-ai-blogger' ),
			description: __( 'Your WordPress site is now connected to our AI-powered content generation system.', 'solvex-ai-blogger' ),
			highlight: true,
		},
		{
			icon: Star,
			title: __( 'AI Models Ready', 'solvex-ai-blogger' ),
			description: __( 'Advanced language models are configured and ready to create high-quality content.', 'solvex-ai-blogger' ),
		},
		{
			icon: Gift,
			title: __( 'Free Credits Applied', 'solvex-ai-blogger' ),
			description: __( 'Your account has been credited with free tokens to get you started immediately.', 'solvex-ai-blogger' ),
		},
	];

	return (
		<main
			className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden"
			role="main"
			aria-labelledby="ready-heading"
		>
			{ /* Confetti canvas */ }
			<canvas
				id="solvex-aib-confetti-wrapper"
				width={ typeof window !== 'undefined' ? window.innerWidth : 800 }
				height={ typeof window !== 'undefined' ? window.innerHeight : 600 }
				className="absolute inset-0 pointer-events-none z-10"
				aria-hidden="true"
			/>

			<div className="w-full max-w-4xl relative z-20">
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
					{ /* Header */ }
					<div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center relative">
						{ /* Decorative elements */ }
						<div className="absolute top-4 left-4">
							<Sparkles className="w-6 h-6 text-white opacity-60 animate-pulse" aria-hidden="true" />
						</div>
						<div className="absolute top-4 right-4">
							<Sparkles className="w-8 h-8 text-white opacity-40 animate-pulse" style={ { animationDelay: '0.5s' } } aria-hidden="true" />
						</div>

						<div className="mb-4">
							<span className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full tracking-wide uppercase">
								<Trophy className="w-4 h-4 mr-2" aria-hidden="true" />
								{ __( 'Setup Complete', 'solvex-ai-blogger' ) }
							</span>
						</div>
						<h1 id="ready-heading" className="text-4xl font-bold text-white mb-4">
							{ __( '🎉 Congratulations!', 'solvex-ai-blogger' ) }
						</h1>
						<p className="text-green-100 text-xl max-w-2xl mx-auto">
							{ __( 'Solvex AI Blogger is now ready to transform your content creation process with the power of artificial intelligence.', 'solvex-ai-blogger' ) }
						</p>
					</div>

					<div className="p-8">
						{ /* Success features grid */ }
						<div className="grid md:grid-cols-3 gap-4 mb-8">
							{ successFeatures.map( ( feature, index ) => (
								<SuccessFeature
									key={ index }
									icon={ feature.icon }
									title={ feature.title }
									description={ feature.description }
									highlight={ feature.highlight }
								/>
							) ) }
						</div>

						{ /* Next steps */ }
						<NextStepsCard />

						{ /* Finish button */ }
						<div className="flex justify-center mt-8">
							<FinishButton
								onClick={ handleFinishSetup }
								loading={ isFinishingSetup }
							>
								{ isFinishingSetup
									? __( 'Finishing Setup…', 'solvex-ai-blogger' )
									: __( 'Start Creating Amazing Content!', 'solvex-ai-blogger' )
								}
							</FinishButton>
						</div>

						{ /* Additional encouragement */ }
						<div className="mt-8 text-center">
							<p className="text-gray-600 text-sm leading-relaxed">
								{ __( 'You\'re all set! Your WordPress site is now equipped with powerful AI tools to help you create engaging, high-quality content faster than ever before.', 'solvex-ai-blogger' ) }
							</p>
						</div>
					</div>
				</div>
			</div>

			{ /* Screen reader announcements */ }
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{ isFinishingSetup && __( 'Finishing setup and redirecting to dashboard…', 'solvex-ai-blogger' ) }
				{ ! showConfetti && __( 'Congratulations! Setup completed successfully with celebration.', 'solvex-ai-blogger' ) }
			</div>
		</main>
	);
} );

ReadyStep.displayName = 'WizardReadyStep';

export default ReadyStep;
