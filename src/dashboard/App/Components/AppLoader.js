import { __ } from '@wordpress/i18n';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@Utils/cn';

/**
 * Full-screen app boot loader shown by Entry.js while the lazy Dashboard
 * or Wizard chunk is fetching. Mirrors the AppShell brand mark so the
 * transition into the dashboard feels seamless.
 *
 * @param {Object} props             Component props.
 * @param {string} [props.message]   Optional override for the loading copy.
 * @param {string} [props.className] Extra CSS classes for the wrapper.
 */
const AppLoader = ( { message, className = '' } ) => {
	const text = message || __( 'Loading…', 'solvex-ai-blogger' );
	return (
		<div
			className={ cn(
				'flex min-h-screen items-center justify-center bg-background',
				className
			) }
			role="status"
			aria-live="polite"
			aria-label={ text }
		>
			<div className="flex flex-col items-center gap-4">
				<div className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/15">
					<Sparkles className="size-5" strokeWidth={ 2.5 } aria-hidden="true" />
				</div>
				<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<Loader2 className="size-4 animate-spin text-brand" aria-hidden="true" />
					<span>{ text }</span>
				</div>
			</div>
		</div>
	);
};

export default AppLoader;
