import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import AlertOctagon from 'lucide-react/dist/esm/icons/alert-octagon';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import MoveRight from 'lucide-react/dist/esm/icons/move-right';
import { cn } from '@Utils/cn';

export default function TokenNotification() {
	const tokenRemaining = useSelector( ( s ) => s.tokenRemaining );
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	const tokenTotal = useSelector( ( s ) => s.tokenTotal );

	if (
		licenseStatus !== 'licensed' ||
		tokenRemaining > 1000 ||
		tokenRemaining === undefined ||
		tokenRemaining === null ||
		tokenTotal === undefined ||
		tokenTotal === 0
	) {
		return null;
	}

	const isError = tokenRemaining < 100;
	const Icon = isError ? AlertOctagon : AlertTriangle;

	return (
		<div
			className={ cn(
				'mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3',
				isError
					? 'border-destructive/30 bg-destructive/5 text-destructive'
					: 'border-amber-500/30 bg-amber-500/5 text-amber-700'
			) }
			role="alert"
		>
			<div className="flex items-center gap-2">
				<Icon className="size-5 shrink-0" aria-hidden="true" />
				<span className="text-sm font-medium">
					{ isError
						? __( "You don't have enough tokens to use AI features.", 'solvex-ai-blogger' )
						: `${ __( 'Low on tokens:', 'solvex-ai-blogger' ) } ${ tokenRemaining } ${ __( 'left. Time to get more.', 'solvex-ai-blogger' ) }` }
				</span>
			</div>
			<a
				href="https://wpaiblogger.com/pricing/"
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white no-underline transition-all hover:brightness-110"
			>
				{ __( 'Upgrade Now', 'solvex-ai-blogger' ) }
				<MoveRight className="size-4" aria-hidden="true" />
			</a>
		</div>
	);
}
