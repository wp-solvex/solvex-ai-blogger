import { __ } from '@wordpress/i18n';
import { useState, useRef, useCallback } from 'react';
import { Tooltip } from '@wordpress/components';
import { RefreshCw } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updateApiData } from '@Utils/ApiData';

/**
 * Core version display component with enhanced accessibility
 */
export const CoreVersion = () => {
	const version = useSelector( ( state ) => state.version ) || '1.0.0';
	const proVersion = useSelector( ( state ) => state.proVersion ) || '';
	const proAvailable = useSelector( ( state ) => state.proAvailable ) || false;

	return (
		<>
			<div className="flex items-center">
				<Tooltip
					text={ __( 'CORE', 'solvex-ai-blogger' ) }
					delay={ 100 }
					className="z-[99999] bg-black text-white shadow-md p-2 rounded-md uppercase"
				>
					<span
						className="select-none cursor-help"
						aria-label={ `Core version ${ version }` }
					>
						V-{ version }
					</span>
				</Tooltip>
			</div>

			{ proAvailable && proVersion && (
				<>
					<span>-</span>
					<Tooltip
						text={ wpsolvex_autoaiblogger_localized_data?.pro_plugin_name || 'PRO' }
						delay={ 100 }
						className="z-[99999] bg-black text-white shadow-md p-2 rounded-md uppercase"
					>
						<span
							className="select-none cursor-help"
							aria-label={ `Pro version ${ proVersion }` }
						>
							V-{ proVersion }
						</span>
					</Tooltip>
				</>
			) }

			{ wp?.hooks?.applyFilters?.(
				'wpsolvex_autoaiblogger_dashboard.after_navigation_version',
				<span />
			) }
		</>
	);
};

/**
 * Token Display and Refresh Component
 */
export const TokenDisplayAndRefresh = () => {
	const dispatch = useDispatch();
	const [ processing, setProcessing ] = useState( false );
	const licenseStatus = useSelector( ( state ) => state.license_status ) || 'unlicensed';
	const tokenTotal = useSelector( ( state ) => state.tokenTotal ) || 0;
	const tokenRemaining = useSelector( ( state ) => state.tokenRemaining ) || 0;
	const license = useSelector( ( state ) => state.license ) || '';
	const abortControllerRef = useRef( {} );

	// Calculate tokens used and format numbers
	const tokensUsed = licenseStatus === 'licensed' ? tokenTotal - tokenRemaining : 0;
	const totalTokens = licenseStatus === 'licensed' ? tokenTotal : 0;

	const refreshTokens = useCallback( async () => {
		if ( licenseStatus !== 'licensed' || processing || ! license ) {
			return;
		}

		setProcessing( true );

		try {
			// Fetch fresh token data using the license key from Redux store
			const response = await fetch( `https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=${ license }`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			} );

			if ( ! response.ok ) {
				throw new Error( `HTTP error! status: ${ response.status }` );
			}

			const tokenData = await response.json();

			if ( tokenData && tokenData.success && tokenData.data ) {
				// Update the store with fresh token data
				dispatch( {
					type: 'UPDATE_TOKEN_TOTAL',
					payload: tokenData.data.total,
				} );
				dispatch( {
					type: 'UPDATE_TOKEN_REMAINING',
					payload: tokenData.data.remaining,
				} );

				// Update API data
				await updateApiData( 'tokenTotal', tokenData.data.total, dispatch, abortControllerRef );
				await updateApiData( 'tokenRemaining', tokenData.data.remaining, dispatch, abortControllerRef );

				dispatch( {
					type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
					payload: __( 'Tokens refreshed successfully!', 'solvex-ai-blogger' ),
				} );
			} else {
				throw new Error( 'Invalid response from token API.' );
			}
		} catch ( error ) {
			console.error( 'Token refresh error:', error );
			dispatch( {
				type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
				payload: __( 'Failed to refresh token data', 'solvex-ai-blogger' ),
			} );
		} finally {
			setProcessing( false );
		}
	}, [ licenseStatus, processing, license, dispatch ] );

	if ( licenseStatus !== 'licensed' ) {
		return null;
	}

	const isError = tokenRemaining < 100;
	const isWarning = tokenRemaining <= 1000;

	const formattedTokensUsed = tokensUsed.toLocaleString();
	const formattedTotalTokens = totalTokens.toLocaleString();

	// Calculate progress percentage and status
	const progressPercentage = totalTokens > 0 ? ( ( totalTokens - tokenRemaining ) / totalTokens ) * 100 : 0;
	const getTokenStatus = () => {
		const remaining = tokenRemaining;
		if ( remaining >= 2000 ) {
			return {
				text: __( 'Plenty of tokens', 'solvex-ai-blogger' ),
				color: 'bg-green-500',
			};
		}
		if ( remaining >= 1000 ) {
			return {
				text: __( 'Moderate', 'solvex-ai-blogger' ),
				color: 'bg-amber-500',
			};
		}
		return {
			text: __( 'Low', 'solvex-ai-blogger' ),
			color: 'bg-red-500',
		};
	};
	const tokenStatus = getTokenStatus();

	return (
		<div className="flex items-center gap-2 pl-4" data-tour-target="token-display">
			<div className="flex flex-col gap-1">
				<p className={ `text-sm m-0 p-0 ${
					isError ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-500'
				}` }>
					{ formattedTokensUsed }
					{ '/' }
					{ formattedTotalTokens }
					{ ' ' }
					{ __( 'Tokens', 'solvex-ai-blogger' ) }
				</p>

				{ /* Progress bar */ }
				<Tooltip
					text={ tokenStatus.text }
					delay={ 100 }
					className="z-[99999] bg-black text-xs text-white shadow-md p-2 rounded-md"
				>
					<div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden cursor-help">
						<div
							className={ `h-full transition-all duration-500 ease-in-out ${ tokenStatus.color }` }
							style={ { width: `${ Math.min( progressPercentage, 100 ) }%` } }
						/>
					</div>
				</Tooltip>
			</div>

			<button
				disabled={ licenseStatus !== 'licensed' || processing || ! license }
				className={ `
					text-brand-700
					bg-brand-50
					border border-brand-200
					rounded-md p-1 mr-2
					flex items-center justify-center
					font-medium
					focus:outline-none focus:ring-0
					${ licenseStatus !== 'licensed' || processing || ! license
			? 'opacity-50 cursor-not-allowed'
			: 'cursor-pointer hover:text-brand-900 hover:bg-brand-100 hover:border-brand-300' }
					${ processing ? 'pointer-events-none' : '' }
				` }
				onClick={ refreshTokens }
				aria-label={ __( 'Refresh token data', 'solvex-ai-blogger' ) }
			>
				<Tooltip text={ __( 'Refresh', 'solvex-ai-blogger' ) } delay={ 100 } className="z-[99999] bg-black text-xs text-white shadow-md p-2 rounded-md">
					<div className="relative flex">
						<RefreshCw className={ `w-4 h-4 ${ processing ? 'animate-spin' : '' }` } />
					</div>
				</Tooltip>
			</button>

			<span className="wpsolvex-autoaiblogger-vertical-divider" />
		</div>
	);
};

// Default export for convenience
export default {
	CoreVersion,
	TokenDisplayAndRefresh,
};
