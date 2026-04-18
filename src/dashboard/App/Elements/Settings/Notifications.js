import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { Mail, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import SwitchControl from '@Components/SwitchControl';
import SettingsContainer from '@Components/SettingsContainer';
import InfoCard from '@Components/InfoCard';
import { updateApiData } from '@Utils/ApiData';

// Enhanced notification type component.
const NotificationCard = memo( ( {
	icon,
	title,
	description,
	enabled,
	onToggle,
	inputValue,
	onInputChange,
	inputPlaceholder,
	inputType = 'text',
	helpText,
	validationPattern,
	disabled = false,
} ) => {
	const [ isValid, setIsValid ] = useState( true );
	const [ validationMessage, setValidationMessage ] = useState( '' );

	// Enhanced validation
	const validateInput = useCallback( ( value ) => {
		// If notification is enabled, the field is required
		if ( enabled && ( ! value || ! value.trim() ) ) {
			setIsValid( false );
			if ( inputType === 'email' ) {
				setValidationMessage( __( 'Email address is required when notifications are enabled', 'solvex-ai-blogger' ) );
			} else if ( inputType === 'tel' ) {
				setValidationMessage( __( 'Phone number is required when notifications are enabled', 'solvex-ai-blogger' ) );
			} else {
				setValidationMessage( __( 'This field is required when notifications are enabled', 'solvex-ai-blogger' ) );
			}
			return false;
		}

		// If notification is disabled or field is empty, it's valid
		if ( ! enabled || ! value.trim() ) {
			setIsValid( true );
			setValidationMessage( '' );
			return true;
		}

		if ( validationPattern ) {
			const isValidPattern = validationPattern.test( value );
			setIsValid( isValidPattern );

			if ( ! isValidPattern ) {
				if ( inputType === 'email' ) {
					setValidationMessage( __( 'Please enter valid email address(es)', 'solvex-ai-blogger' ) );
				} else if ( inputType === 'tel' ) {
					setValidationMessage( __( 'Please enter a valid phone number', 'solvex-ai-blogger' ) );
				} else {
					setValidationMessage( __( 'Invalid format', 'solvex-ai-blogger' ) );
				}
			} else {
				setValidationMessage( '' );
			}
			return isValidPattern;
		}

		setIsValid( true );
		setValidationMessage( '' );
		return true;
	}, [ enabled, validationPattern, inputType ] );

	const handleInputChange = useCallback( ( e ) => {
		const value = e.target.value;
		onInputChange( value );
		validateInput( value );
	}, [ onInputChange, validateInput ] );

	// Validate when the enabled state changes
	useEffect( () => {
		if ( enabled ) {
			// When enabling, validate the current input value
			validateInput( inputValue );
		} else {
			// When disabling, clear validation
			setIsValid( true );
			setValidationMessage( '' );
		}
	}, [ enabled, inputValue, validateInput ] );

	return (
		<div className={ `border rounded-lg transition-all duration-200 p-4 ${ enabled ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-gray-50' }` }>
			{ /* Header */ }
			<div className="flex items-center justify-between">
				<div className="flex items-start gap-3">
					<div className={ `flex p-2 rounded-lg ${ enabled ? 'bg-brand-100' : 'bg-gray-100' }` }>
						{ React.cloneElement( icon, {
							className: `flex w-5 h-5 ${ enabled ? 'text-brand' : 'text-gray-400' }`,
						} ) }
					</div>

					<div className="flex flex-col gap-1">
						<h3 className={ `text-lg font-semibold p-0 m-0 ${ enabled ? 'text-brand-900' : 'text-gray-900' }` }>
							{ title }
						</h3>
						<p className={ `text-sm ${ enabled ? 'text-brand-700' : 'text-gray-600' }` }>
							{ description }
						</p>
					</div>
				</div>

				<SwitchControl
					checked={ enabled }
					onChange={ onToggle }
					disabled={ disabled }
					aria-label={ __( 'Toggle', 'solvex-ai-blogger' ) + ` ${ title }` }
				/>
			</div>

			{ /* Input field */ }
			{ enabled && (
				<div className="space-y-3 mt-4">
					<div className="relative">
						<input
							type={ inputType }
							value={ inputValue }
							onChange={ handleInputChange }
							placeholder={ inputPlaceholder }
							disabled={ disabled }
							required={ enabled }
							className={ `
								block w-full px-3 py-2 text-sm border rounded-lg
								bg-white text-gray-900 placeholder:text-gray-400
								focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
								transition-colors duration-200
								${ ! isValid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300' }
								${ disabled ? 'bg-gray-50 cursor-not-allowed' : '' }
							` }
							aria-describedby={ `${ title.toLowerCase().replace( ' ', '-' ) }-help` }
							aria-invalid={ ! isValid }
							aria-required={ enabled }
						/>

						{ /* Validation indicator */ }
						<div className="absolute inset-y-0 right-0 flex items-center pr-3">
							{ enabled && (
								! isValid ? (
									<AlertCircle className="w-4 h-4 text-red-500" />
								) : inputValue && inputValue.trim() ? (
									<CheckCircle2 className="w-4 h-4 text-green-500" />
								) : null
							) }
						</div>
					</div>

					{ /* Help text and validation */ }
					<div className="space-y-1">
						{ validationMessage && (
							<p className="text-xs text-red-600 flex items-center gap-1">
								<AlertCircle className="w-3 h-3" />
								{ validationMessage }
							</p>
						) }
						{ helpText && (
							<p id={ `${ title.toLowerCase().replace( ' ', '-' ) }-help` } className="text-xs text-gray-500">
								{ helpText }
							</p>
						) }
					</div>
				</div>
			) }
		</div>
	);
} );

NotificationCard.displayName = 'NotificationCard';

// Enhanced notifications settings component
const Notifications = memo( () => {
	const dispatch = useDispatch();

	// Get notification settings from Redux store or set defaults
	const emailNotificationEnabled = useSelector( ( state ) => state.emailNotificationEnabled ) ?? false;
	const emailNotificationValue = useSelector( ( state ) => state.emailNotificationValue ) ??
		( ( typeof solvex_aib_localized_data !== 'undefined' && solvex_aib_localized_data?.admin_email ) || '' );

	// Get Redux config for API calls
	const adminNonce = useSelector( ( state ) => state.adminNonce );
	const ajaxUrl = useSelector( ( state ) => state.ajaxUrl );

	// Local state for notifications - initialized from Redux
	const [ notifications, setNotifications ] = useState( {
		email: {
			enabled: emailNotificationEnabled,
			value: emailNotificationValue,
		},
	} );

	// Sync local state with Redux when Redux state changes
	useEffect( () => {
		setNotifications( {
			email: {
				enabled: emailNotificationEnabled,
				value: emailNotificationValue,
			},
		} );
	}, [ emailNotificationEnabled, emailNotificationValue ] );

	// Email validation pattern (supports multiple emails)
	const emailPattern = useMemo( () =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+(?:\s*,\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/,
	[]
	);

	// Helper to save setting to database
	const saveSetting = useCallback( async ( key, value ) => {
		try {
			await updateApiData( key, value, dispatch, {
				ajaxUrl,
				security: adminNonce,
			} );
		} catch ( error ) {
			console.error( `Failed to save ${ key }:`, error );
		}
	}, [ dispatch, ajaxUrl, adminNonce ] );

	// Toggle handlers - update both local state, Redux, and database
	const toggleEmail = useCallback( () => {
		const newEnabled = ! notifications.email.enabled;
		setNotifications( ( prev ) => ( {
			...prev,
			email: { ...prev.email, enabled: newEnabled },
		} ) );
		// Update Redux store
		dispatch( { type: 'UPDATE_EMAIL_NOTIFICATION_ENABLED', payload: newEnabled } );
		// Save to database
		saveSetting( 'emailNotificationEnabled', newEnabled );
	}, [ dispatch, notifications.email.enabled, saveSetting ] );

	// Input change handlers - update both local state, Redux, and database
	const updateEmail = useCallback( ( value ) => {
		setNotifications( ( prev ) => ( {
			...prev,
			email: { ...prev.email, value },
		} ) );
		// Update Redux store
		dispatch( { type: 'UPDATE_EMAIL_NOTIFICATION_VALUE', payload: value } );
		// Save to database (debounced in real implementation)
		saveSetting( 'emailNotificationValue', value );
	}, [ dispatch, saveSetting ] );

	return (
		<div className="space-y-6">
			{ /* Settings container */ }
			<SettingsContainer
				element={
					<div className="space-y-6">
						{ /* Email notifications */ }
						<NotificationCard
							icon={ <Mail /> }
							title={ __( 'Email Notifications', 'solvex-ai-blogger' ) }
							description={ __( 'Receive notifications via email.', 'solvex-ai-blogger' ) }
							enabled={ notifications.email.enabled }
							onToggle={ toggleEmail }
							inputValue={ notifications.email.value }
							onInputChange={ updateEmail }
							inputPlaceholder={ __( 'admin@example.com, editor@example.com', 'solvex-ai-blogger' ) }
							inputType="email"
							helpText={ __( 'Enter multiple email addresses separated by commas for team notifications.', 'solvex-ai-blogger' ) }
							validationPattern={ emailPattern }
						/>

						{ /* Information box */ }
						<InfoCard
							icon={ Bell }
							title={ __( 'Notification Types', 'solvex-ai-blogger' ) }
							items={ [
								__( 'Campaign started', 'solvex-ai-blogger' ),
								__( 'New post created', 'solvex-ai-blogger' ),
								__( 'Campaign completed', 'solvex-ai-blogger' ),
							] }
							colorScheme="blue"
							className="mt-6"
							ariaLabel={ __( 'Types of notifications you can receive', 'solvex-ai-blogger' ) }
						/>
					</div>
				}
				className="bg-white shadow-sm rounded-lg border border-gray-200"
			/>
		</div>
	);
} );

Notifications.displayName = 'NotificationSettings';

export default Notifications;
