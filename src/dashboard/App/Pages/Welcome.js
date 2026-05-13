import React, { useCallback, memo } from 'react';
import { __ } from '@wordpress/i18n';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import {
	CampaignsInsights,
	PostIdeas,
	QuickAccess,
	TokenNotification,
	WelcomeVideoCard,
} from '@Elements/Welcome';

class WelcomeErrorBoundary extends React.Component {
	constructor( props ) {
		super( props );
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError( error ) {
		return { hasError: true, error };
	}

	componentDidCatch( error, errorInfo ) {
		console.error( 'Welcome page error:', error, errorInfo );
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<div
					className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
					role="alert"
					aria-describedby="error-description"
				>
					<AlertCircle className="size-12 text-destructive" aria-hidden="true" />
					<h2 className="m-0 text-lg font-semibold text-destructive">
						{ __( 'Something went wrong', 'solvex-ai-blogger' ) }
					</h2>
					<p id="error-description" className="text-sm text-destructive/80">
						{ __( 'We encountered an error loading the welcome page. Please try refreshing.', 'solvex-ai-blogger' ) }
					</p>
					<button
						type="button"
						onClick={ () => this.setState( { hasError: false, error: null } ) }
						className="mt-2 inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
					>
						<RefreshCw className="size-4" aria-hidden="true" />
						{ __( 'Try Again', 'solvex-ai-blogger' ) }
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

function Welcome() {
	const handleComponentError = useCallback( ( error, errorInfo ) => {
		console.error( 'Welcome component error:', error, errorInfo );
	}, [] );

	return (
		<WelcomeErrorBoundary>
			<main
				aria-label={ __( 'Welcome dashboard', 'solvex-ai-blogger' ) }
			>
				<TokenNotification />

				<div className="grid grid-cols-12 gap-10">
					<section className="col-span-12 animate-reveal lg:col-span-8">
						<CampaignsInsights onError={ handleComponentError } />

						<div className="mt-12">
							<PostIdeas onError={ handleComponentError } />
						</div>
					</section>

					<aside
						className="col-span-12 animate-reveal space-y-8 lg:col-span-4"
						style={ { animationDelay: '120ms' } }
					>
						<WelcomeVideoCard />
						<QuickAccess onError={ handleComponentError } />
					</aside>
				</div>
			</main>
		</WelcomeErrorBoundary>
	);
}

Welcome.displayName = 'Welcome';

export default memo( Welcome );
