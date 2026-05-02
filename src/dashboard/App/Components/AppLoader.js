import { __ } from '@wordpress/i18n';

/**
 * Enhanced App Loader component with better accessibility and animation
 *
 * @param {Object}      props                   Component properties
 * @param {string}      [props.size='default']  Size of the loader: 'small', 'default', or 'large'
 * @param {string|null} [props.message=null]    Custom loading message
 * @param {boolean}     [props.fullScreen=true] Whether to display the loader in full screen
 * @param {string}      [props.className='']    Additional CSS classes
 */
const AppLoader = ( {
	size = 'default',
	message = null,
	fullScreen = true,
	className = '',
} ) => {
	// Size variants
	const sizeClasses = {
		small: 'h-6 w-6',
		default: 'h-10 w-10',
		large: 'h-16 w-16',
	};

	const containerClasses = fullScreen
		? 'min-h-screen flex items-center justify-center bg-slate-50'
		: 'flex items-center justify-center p-6';

	const loaderMessage = message || __( 'Loading…', 'solvex-ai-blogger' );

	return (
		<div
			className={ `app-loader ${ containerClasses } ${ className }` }
			role="status"
			aria-live="polite"
			aria-label={ loaderMessage }
		>
			<div className="flex flex-col items-center space-y-4">
				<div className="relative">
					{ /* Main spinner */ }
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={ `${ sizeClasses[ size ] } text-brand-600 animate-spin` }
						aria-hidden="true"
					>
						<path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />
						<path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />
						<path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />
						<circle cx="12" cy="12" r="10" />
					</svg>

					{ /* Pulse animation overlay */ }
					<div className={ `absolute inset-0 ${ sizeClasses[ size ] } bg-brand-600 rounded-full opacity-75 animate-ping` }></div>
				</div>

				{ /* Loading text */ }
				<div className="text-center">
					<p className="text-slate-600 font-medium text-sm">
						{ loaderMessage }
					</p>
					<div className="flex justify-center space-x-1 mt-2">
						<div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce"></div>
						<div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce delay-100"></div>
						<div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce delay-200"></div>
					</div>
				</div>
			</div>

			{ /* Screen reader only text */ }
			<span className="sr-only">
				{ loaderMessage }
			</span>
		</div>
	);
};

export default AppLoader;
