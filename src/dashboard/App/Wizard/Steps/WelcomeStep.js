import React, { useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { ArrowRight, Sparkles, Zap, Globe } from 'lucide-react';

// Enhanced feature card component with modern glass-morphism design
const FeatureCard = memo( ( { icon: Icon, title, description } ) => (
	<div className="group relative flex flex-col items-center p-3.5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 hover:border-brand-300/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
		{ /* Card background glow effect */ }
		<div className="absolute inset-0 bg-gradient-to-br from-brand-50/60 via-indigo-50/40 to-purple-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

		{ /* Icon container with enhanced styling */ }
		<div className="relative z-10 p-1.5 bg-gradient-to-br from-brand-100/80 to-indigo-100/80 backdrop-blur-sm rounded-xl mb-2.5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl">
			<Icon className="w-5 h-5 text-brand-600 group-hover:text-brand-700 transition-colors duration-300" aria-hidden="true" />
		</div>

		{ /* Content */ }
		<div className="relative z-10 text-center">
			<h3 className="text-[14px] font-bold text-gray-900 mb-0.5 group-hover:text-brand-700 transition-colors duration-300">
				{ title }
			</h3>
			<p className="text-[13px] text-gray-600 leading-relaxed font-medium group-hover:text-gray-700 transition-colors duration-300">
				{ description }
			</p>
		</div>
	</div>
) ); FeatureCard.displayName = 'WelcomeFeatureCard';

// Premium action button with advanced styling and animations
const ActionButton = memo( ( { onClick, children, icon: Icon } ) => {
	const handleClick = useCallback( ( e ) => {
		e.preventDefault();
		onClick( e );
	}, [ onClick ] );

	const handleKeyDown = useCallback( ( e ) => {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			handleClick( e );
		}
	}, [ handleClick ] );

	return (
		<div className="relative inline-block">
			{ /* Button glow effect */ }
			<div className="absolute -inset-1 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

			<button
				type="button"
				className="
					group relative inline-flex items-center gap-2.5 px-7 py-3.5
					bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600
					hover:from-brand-700 hover:via-indigo-700 hover:to-purple-700
					text-white font-bold text-[17px] rounded-2xl
					shadow-2xl hover:shadow-3xl
					focus:outline-none focus:ring-4 focus:ring-brand-300/50 focus:ring-offset-2
					transform transition-all duration-500 hover:scale-105 hover:-translate-y-1
					overflow-hidden border border-white/30
					backdrop-blur-sm
				"
				onClick={ handleClick }
				onKeyDown={ handleKeyDown }
				aria-label={ __( 'Start the setup wizard', 'solvex-ai-blogger' ) }
			>
				{ /* Animated background shimmer */ }
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

				{ /* Button content */ }
				<span className="relative z-10 tracking-wide">{ children }</span>
				{ Icon && (
					<Icon className="relative z-10 w-[18px] h-[18px] group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" aria-hidden="true" />
				) }
			</button>
		</div>
	);
} );

ActionButton.displayName = 'WelcomeActionButton';

const WelcomeStep = memo( () => {
	const navigate = useNavigate();

	// Enhanced navigation handler
	const handleStepRedirection = useCallback( ( e ) => {
		e.preventDefault();
		const targetStep = 'persona-form';
		navigate( `?step=${ targetStep }` );
	}, [ navigate ] );

	// Feature data - simplified and more focused
	const features = [
		{
			icon: Sparkles,
			title: __( 'AI Content Generation', 'solvex-ai-blogger' ),
			description: __( 'Create engaging blog posts automatically', 'solvex-ai-blogger' ),
		},
		{
			icon: Zap,
			title: __( 'Quick Setup', 'solvex-ai-blogger' ),
			description: __( 'Ready in under 5 minutes', 'solvex-ai-blogger' ),
		},
		{
			icon: Globe,
			title: __( 'Automated Scheduling', 'solvex-ai-blogger' ),
			description: __( 'Schedule AI-generated blog posts automatically', 'solvex-ai-blogger' ),
		},
	];

	return (
		<main
			className="bg-gradient-to-br from-brand-50 via-indigo-50 to-purple-100 flex items-center justify-center p-5 pt-10 relative overflow-hidden min-h-0"
			role="main"
			aria-labelledby="welcome-heading"
		>
			{ /* Enhanced background decorative elements */ }
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-[345px] h-[345px] bg-gradient-to-br from-brand-200/40 to-indigo-200/40 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" style={ { animationDelay: '1s' } } />
				<div className="absolute top-1/2 left-1/2 w-[230px] h-[230px] bg-gradient-to-br from-purple-200/25 to-pink-200/25 rounded-full blur-2xl animate-pulse" style={ { animationDelay: '2s' } } />
			</div>

			<div className="max-w-6xl mx-auto relative z-10">
				{ /* Enhanced hero section */ }
				<div className="text-center mb-11">
					{ /* Step indicator with enhanced styling */ }
					<div className="mb-5">
						<span className="inline-flex items-center px-5 py-2.5 bg-white/90 backdrop-blur-xl border border-brand-200/50 text-brand-700 text-[13px] font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
							<Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse text-brand-500" aria-hidden="true" />
							{ __( 'Step 1 of 5', 'solvex-ai-blogger' ) }
							<div className="ml-2 w-1.5 h-1.5 bg-brand-400 rounded-full animate-ping" />
						</span>
					</div>

					{ /* Enhanced main heading */ }
					<h1
						id="welcome-heading"
						className="text-2xl md:text-[36px] font-black text-gray-900 mb-3.5 leading-[1.1] tracking-tight"
					>
						{ __( 'Turn Ideas Into', 'solvex-ai-blogger' ) }
						<br />
						<span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
							{ __( 'AI-Powered Blogs', 'solvex-ai-blogger' ) }
						</span>
					</h1>

					{ /* Enhanced description with better typography */ }
					<h3 className="text-[15px] md:text-[17px] text-gray-700 mx-auto mb-5 leading-relaxed font-medium">
						{ __(
							'Set once and forget - automatically publish high-quality blog posts on schedule.',
							'solvex-ai-blogger'
						) }
					</h3>

					{ /* Enhanced CTA section */ }
					<div className="mb-7">
						<ActionButton
							onClick={ handleStepRedirection }
							icon={ ArrowRight }
						>
							{ __( 'Start Building', 'solvex-ai-blogger' ) }
						</ActionButton>
					</div>
				</div>

				{ /* Enhanced features grid */ }
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-7">
					{ features.map( ( feature, index ) => (
						<FeatureCard
							key={ index }
							icon={ feature.icon }
							title={ feature.title }
							description={ feature.description }
						/>
					) ) }
				</div>
			</div>

			{ /* Screen reader announcements */ }
			<div className="sr-only" aria-live="polite">
				{ __( 'Welcome to Solvex AI Blogger setup wizard. Use the Start Building button to begin.', 'solvex-ai-blogger' ) }
			</div>
		</main>
	);
} );

WelcomeStep.displayName = 'WizardWelcomeStep';

export default WelcomeStep;
