import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import { AlertTriangle, AlertOctagon, MoveRight } from 'lucide-react';

export default function TokenNotification() {
	const tokenRemaining = useSelector( ( state ) => state.tokenRemaining );
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';
	const tokenTotal = useSelector( ( state ) => state.tokenTotal );

	console.log( 'TokenNotification rendered with:', {
		tokenRemaining,
		licenseStatus,
		tokenTotal,
	} );

	// Don't show notification if:
	// 1. License is not active
	// 2. Tokens are more than 1000
	// 3. Token data hasn't been fetched yet (tokenRemaining is undefined or null)
	if ( licenseStatus !== 'licensed' ||
        tokenRemaining > 1000 ||
        tokenRemaining === undefined ||
        tokenRemaining === null ||
        tokenTotal === undefined ||
        tokenTotal === 0 ) {
		return null;
	}

	const isError = tokenRemaining < 100;

	return (
		<div className={ `w-full px-4 py-2 flex items-center justify-center ${
			isError ? 'bg-red-50' : 'bg-amber-50'
		}` }>
			<div className="flex items-center gap-4 max-w-3xl mx-auto">
				<div className="flex items-center gap-2">
					{ isError ? (
						<AlertOctagon className="w-5 h-5 text-red-600" />
					) : (
						<AlertTriangle className="w-5 h-5 text-amber-600" />
					) }
					<span className={ `text-sm font-medium ${
						isError ? 'text-red-600' : 'text-amber-600'
					}` }>
						{ isError
							? __( 'You don\'t have enough tokens to use AI features.', 'solvex-ai-blogger' )
							: `${ __( 'Low on tokens:', 'solvex-ai-blogger' ) } ${ tokenRemaining } ${ __( 'left. Time to get more.', 'solvex-ai-blogger' ) }`
						}
					</span>
				</div>
				<a
					href="https://wpaiblogger.com/pricing/"
					target="_blank"
					rel="noopener noreferrer"
					className="cursor-pointer inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 gap-1"
					style={ { color: 'white' } }
				>
					{ __( 'Upgrade Now', 'solvex-ai-blogger' ) }
					<MoveRight className="h-5 w-5" />
				</a>
			</div>
		</div>
	);
}
