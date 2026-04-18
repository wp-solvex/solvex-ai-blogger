import React from 'react';

/**
 * Error Boundary component to catch and handle React errors
 * Prevents the entire app from crashing when individual components fail
 */
class ErrorBoundary extends React.Component {
	constructor( props ) {
		super( props );
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError() {
		// Update state so the next render will show the fallback UI.
		return { hasError: true };
	}

	componentDidCatch( error, errorInfo ) {
		// Log the error for debugging.
		console.error( 'React Error Boundary caught an error:', error, errorInfo );

		// Store error details in state for display.
		this.setState( {
			error,
			errorInfo,
		} );

		// Log to WordPress if available.
		if ( window.console && window.console.error ) {
			console.error( 'Solvex AI Blogger React Error:', {
				error: error.toString(),
				errorInfo: errorInfo.componentStack,
				props: this.props,
			} );
		}
	}

	render() {
		if ( this.state.hasError ) {
			// Custom error UI
			const { fallback } = this.props;

			if ( fallback ) {
				return fallback;
			}

			// Default error UI
			return (
				<div className="autoaib-error-boundary" style={ {
					padding: '20px',
					border: '1px solid #dc3545',
					borderRadius: '4px',
					backgroundColor: '#f8d7da',
					color: '#721c24',
					margin: '20px',
				} }>
					<h3>Something went wrong</h3>
					<p>The Solvex AI Blogger interface encountered an error. Please try refreshing the page.</p>

					{ process.env.NODE_ENV === 'development' && this.state.error && (
						<details style={ { marginTop: '10px' } }>
							<summary>Error Details (Development Mode)</summary>
							<pre style={ {
								backgroundColor: '#fff',
								padding: '10px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								overflow: 'auto',
								fontSize: '12px',
								marginTop: '10px',
							} }>
								{ this.state.error.toString() }
								{ this.state.errorInfo && this.state.errorInfo.componentStack }
							</pre>
						</details>
					) }

					<button
						onClick={ () => window.location.reload() }
						style={ {
							marginTop: '10px',
							padding: '8px 16px',
							backgroundColor: '#dc3545',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						} }
					>
						Refresh Page
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
