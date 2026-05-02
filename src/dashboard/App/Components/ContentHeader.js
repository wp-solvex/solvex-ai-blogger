import { __ } from '@wordpress/i18n';
import { useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { updateApiData } from '@Utils/ApiData';
import { Save, Gift } from 'lucide-react';

/**
 * Enhanced ContentHeader component with improved error handling and UX
 *
 * @param {Object}      props                                  Component properties
 * @param {string}      [props.title='']                       Header title
 * @param {string}      [props.tab='']                         Current active tab
 * @param {string}      [props.siteTitle='']                   Site title setting
 * @param {string}      [props.siteFor='']                     Site for setting
 * @param {string}      [props.siteDescription='']             Site description setting
 * @param {number}      [props.temperature=0.7]                Temperature setting for AI responses
 * @param {number}      [props.harassment=2]                   Harassment content filter setting
 * @param {number}      [props.hate=2]                         Hate content filter setting
 * @param {number}      [props.sexuallyExplicit=2]             Sexually explicit content filter
 * @param {number}      [props.dangerousContent=2]             Dangerous content filter setting
 * @param {boolean}     [props.emailNotificationEnabled=false] Email notification enabled state
 * @param {string}      [props.emailNotificationValue='']      Email notification value
 * @param {string}      [props.className='']                   Additional CSS classes
 * @param {Function}    [props.onSaveStart]                    Callback when save starts
 * @param {Function}    [props.onSaveComplete]                 Callback when save completes successfully
 * @param {Function}    [props.onSaveError]                    Callback when save fails
 * @param {JSX.Element} [props.icon=Gift]                      Icon component to display in header
 * @return {JSX.Element|null} Rendered header component or null if tab is 'license'
 */
const ContentHeader = ( {
	title = '',
	tab = '',
	siteTitle = '',
	siteFor = '',
	siteDescription = '',
	icon: Icon = Gift,
	temperature = 0.7,
	harassment = 2,
	hate = 2,
	sexuallyExplicit = 2,
	dangerousContent = 2,
	emailNotificationEnabled = false,
	emailNotificationValue = '',
	className = '', // eslint-disable-line no-unused-vars
	onSaveStart,
	onSaveComplete,
	onSaveError,
} ) => {
	const abortControllerRef = useRef( {} ); // eslint-disable-line
	const dispatch = useDispatch(); // eslint-disable-line
	const [ processing, setProcessing ] = useState( false ); // eslint-disable-line
	const [ lastSaveTime, setLastSaveTime ] = useState( null ); // eslint-disable-line

	// Memoize settings object to prevent unnecessary re-renders.
	const settingsToSave = useMemo( () => { // eslint-disable-line
		const settings = {
			siteTitle,
			siteFor,
			siteDescription,
			temperature,
			harassment,
			hate,
			sexuallyExplicit,
			dangerousContent,
			emailNotificationEnabled,
			emailNotificationValue: emailNotificationEnabled ? emailNotificationValue : '',
		};

		// Filter out undefined and null values.
		return Object.entries( settings )
			.filter( ( [ , value ] ) => value !== undefined && value !== null )
			.reduce( ( acc, [ key, value ] ) => ( { ...acc, [ key ]: value } ), {} );
	}, [
		siteTitle,
		siteFor,
		siteDescription,
		temperature,
		harassment,
		hate,
		sexuallyExplicit,
		dangerousContent,
		emailNotificationEnabled,
		emailNotificationValue,
	] );

	// Enhanced save function with better error handling
	const saveSettings = useCallback( async () => { // eslint-disable-line
		// Prevent multiple simultaneous saves
		if ( processing ) {
			return;
		}

		try {
			setProcessing( true );
			onSaveStart?.();

			// Validate settings before saving
			if ( Object.keys( settingsToSave ).length === 0 ) {
				throw new Error( __( 'No settings to save', 'solvex-ai-blogger' ) );
			}

			// Validate notification settings
			if ( emailNotificationEnabled && ( ! emailNotificationValue || ! emailNotificationValue.trim() ) ) {
				throw new Error( __( 'Email address cannot be empty.', 'solvex-ai-blogger' ) );
			}

			// Save settings sequentially to avoid race conditions and database conflicts
			const saveResults = [];
			const totalSettings = Object.entries( settingsToSave ).length;
			let currentIndex = 0;

			for ( const [ key, value ] of Object.entries( settingsToSave ) ) {
				currentIndex++;

				// Update processing state to show progress.
				dispatch( {
					type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
					payload: {
						message: __( 'Saving setting', 'solvex-ai-blogger' ) + ` ${ currentIndex } ` + __( 'of', 'solvex-ai-blogger' ) + ` ${ totalSettings }...`,
						type: 'info',
						duration: 0, // Don't auto-hide while saving
					},
				} );

				try {
					const result = await updateApiData( key, value, dispatch, abortControllerRef );
					saveResults.push( { key, success: true, result } );
				} catch ( error ) {
					console.error( `Failed to save setting: ${ key }`, error );
					saveResults.push( { key, success: false, error } );
					// Continue with other settings instead of failing completely
				}
			}

			// Check if any settings failed to save
			const failedSettings = saveResults.filter( ( result ) => ! result.success );
			if ( failedSettings.length > 0 ) {
				const failedKeys = failedSettings.map( ( result ) => result.key ).join( ', ' );
				throw new Error( `Failed to save some settings: ${ failedKeys }` );
			}

			// Success feedback.
			const successMessage = __( 'Settings saved successfully', 'solvex-ai-blogger' );

			dispatch( {
				type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
				payload: {
					message: successMessage,
					type: 'success',
					duration: 3000,
				},
			} );

			setLastSaveTime( new Date() );
			onSaveComplete?.( settingsToSave );
		} catch ( error ) {
			console.error( 'Failed to save settings:', error );

			const errorMessage = error?.message || __( 'Failed to save settings. Please try again.', 'solvex-ai-blogger' );

			dispatch( {
				type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
				payload: {
					message: errorMessage,
					type: 'error',
					duration: 5000,
				},
			} );

			onSaveError?.( error );
		} finally {
			setProcessing( false );
		}
	}, [ processing, settingsToSave, dispatch, onSaveStart, onSaveComplete, onSaveError ] );

	// Memoize header title
	const headerTitle = useMemo( () => { // eslint-disable-line
		if ( ! title ) {
			return __( 'Settings', 'solvex-ai-blogger' );
		}
		return `${ title } ${ __( 'Settings', 'solvex-ai-blogger' ) }`;
	}, [ title ] );

	return (
		<div className={ `flex items-center w-full justify-between mb-8 wpsolvex-autoaiblogger-content-header bg-gradient-to-r from-brand-50 to-indigo-50 border rounded-xl border-b border-gray-200 p-6` }>
			<div className={ `flex items-center w-full gap-4` }>
				{ Icon && (
					<div className={ `p-3 bg-brand-100 rounded-lg flex` }>
						<Icon className={ `w-6 h-6 text-brand-600` } aria-hidden="true" />
					</div>
				) }

				<div className="flex justify-between items-center gap-2 w-full">
					{ headerTitle && (
						<h1 className={ `text-xl font-bold text-gray-900 m-0 p-0` }>
							{ headerTitle }
						</h1>
					) }

					{
						tab !== 'license' && (
							<button
								type="button"
								disabled={ processing || Object.keys( settingsToSave ).length === 0 }
								onClick={ saveSettings }
								className="cursor-pointer inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
								aria-label={ processing ? __( 'Saving settings…', 'solvex-ai-blogger' ) : __( 'Save settings', 'solvex-ai-blogger' ) }
								aria-describedby={ lastSaveTime ? 'last-save-time' : undefined }
							>
								{ processing ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										<span>{ __( 'Saving…', 'solvex-ai-blogger' ) }</span>
									</>
								) : (
									<>
										<Save className="w-4 h-4 mr-2" aria-hidden="true" />
										<span>{ __( 'Save', 'solvex-ai-blogger' ) }</span>
									</>
								) }
							</button>
						)
					}

				</div>
			</div>
		</div>
	);
};

export default ContentHeader;
