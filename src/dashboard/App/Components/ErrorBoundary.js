import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Error Boundary component to catch and handle React errors
 */
class ErrorBoundary extends React.Component {
	constructor( props ) {
		super( props );
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError() {
		// Update state so the next render will show the fallback UI
		return { hasError: true };
	}

	componentDidCatch( error, errorInfo ) {
		// Log the error for debugging
		console.error( 'Solvex AI Blogger Error Boundary caught an error:', error, errorInfo );

		this.setState( {
			error,
			errorInfo,
		} );

		// You can also log the error to an error reporting service here
		if ( typeof wp !== 'undefined' && wp.hooks ) {
			wp.hooks.doAction( 'ai_blogger_dashboard/error_boundary', error, errorInfo );
		}
	}

	handleRetry = () => {
		this.setState( { hasError: false, error: null, errorInfo: null } );
	};

	render() {
		if ( this.state.hasError ) {
			// Custom error UI
			return (
				<div
					className="min-h-screen flex items-center justify-center bg-slate-50 p-6"
					role="alert"
					aria-live="assertive"
				>
					<div className="text-center max-w-lg">
						<div className="mb-6">
							<svg
								className="mx-auto h-20 w-20 text-red-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={ 1.5 }
									d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
								/>
							</svg>
						</div>

						<h1 className="text-3xl font-bold text-slate-900 mb-4">
							{ __( 'Something went wrong', 'solvex-ai-blogger' ) }
						</h1>

						<p className="text-slate-600 mb-6 text-base">
							{ __( 'The application encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.', 'solvex-ai-blogger' ) }
						</p>

						{ /* Error details in development mode */ }
						{ process.env.NODE_ENV === 'development' && this.state.error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
								<h3 className="text-sm font-medium text-red-800 mb-2">
									{ __( 'Error Details (Development Mode)', 'solvex-ai-blogger' ) }
								</h3>
								<pre className="text-xs text-red-700 whitespace-pre-wrap">
									{ this.state.error.toString() }
									{ this.state.errorInfo.componentStack }
								</pre>
							</div>
						) }

						<div className="space-y-3 mt-4">
							<button
								onClick={ this.handleRetry }
								className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
								type="button"
							>
								{ __( 'Try Again', 'solvex-ai-blogger' ) }
							</button>
							<button
								onClick={ () => window.location.reload() }
								className="w-full inline-flex justify-center items-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
								type="button"
							>
								{ __( 'Reload Page', 'solvex-ai-blogger' ) }
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
