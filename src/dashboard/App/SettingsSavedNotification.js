import { Fragment, useEffect, useCallback, useMemo } from 'react';
import { CheckCircleIcon, XIcon, AlertCircleIcon, InfoIcon } from 'lucide-react';
import { Transition } from '@headlessui/react';
import { useSelector, useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Enhanced notification types with modern gradient designs and animations
 */
const NotificationTypes = {
	success: {
		icon: CheckCircleIcon,
		iconColor: 'text-emerald-500',
		bgGradient: 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50',
		borderColor: 'border-emerald-200',
		shadowColor: 'shadow-emerald-100/50',
		accentColor: 'bg-emerald-500',
		iconBg: 'bg-emerald-100',
	},
	error: {
		icon: AlertCircleIcon,
		iconColor: 'text-red-500',
		bgGradient: 'bg-gradient-to-r from-red-50 via-pink-50 to-red-50',
		borderColor: 'border-red-200',
		shadowColor: 'shadow-red-100/50',
		accentColor: 'bg-red-500',
		iconBg: 'bg-red-100',
	},
	warning: {
		icon: AlertCircleIcon,
		iconColor: 'text-amber-500',
		bgGradient: 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50',
		borderColor: 'border-amber-200',
		shadowColor: 'shadow-amber-100/50',
		accentColor: 'bg-amber-500',
		iconBg: 'bg-amber-100',
	},
	info: {
		icon: InfoIcon,
		iconColor: 'text-brand-500',
		bgGradient: 'bg-gradient-to-r from-brand-50 via-indigo-50 to-brand-50',
		borderColor: 'border-brand-200',
		shadowColor: 'shadow-brand-100/50',
		accentColor: 'bg-brand-500',
		iconBg: 'bg-brand-100',
	},
};

/**
 * Enhanced Settings Saved Notification component with premium styling and animations
 */
export default function SettingsSavedNotification() {
	const dispatch = useDispatch();

	// Enhanced selector to handle different notification types
	const notification = useSelector( ( state ) => {
		const settingsNotification = state.settingsSavedNotification;

		// Debug logging.
		if ( settingsNotification ) {
			console.log( 'SettingsSavedNotification received:', settingsNotification );
		}

		// Support both string and object notifications.
		if ( typeof settingsNotification === 'string' ) {
			return {
				message: settingsNotification,
				type: 'success',
				duration: 3000,
			};
		}

		if ( settingsNotification && typeof settingsNotification === 'object' ) {
			return {
				message: settingsNotification.message || '',
				type: settingsNotification.type || 'success',
				duration: settingsNotification.duration || 3000,
			};
		}

		return null;
	} );

	// Memoized dismiss action.
	const dismissNotification = useCallback( () => {
		dispatch( {
			type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
			payload: '',
		} );
	}, [ dispatch ] );

	// Auto-dismiss effect with proper cleanup.
	useEffect( () => {
		if ( notification?.message ) {
			const timer = setTimeout( () => {
				dismissNotification();
			}, notification.duration );

			return () => clearTimeout( timer );
		}
	}, [ notification, dismissNotification ] );

	// Memoized notification styles.
	const notificationStyle = useMemo( () => {
		if ( ! notification?.type ) {
			return NotificationTypes.success;
		}
		return NotificationTypes[ notification.type ] || NotificationTypes.success;
	}, [ notification?.type ] );

	// Early return if no notification.
	if ( ! notification?.message ) {
		return null;
	}

	const { icon: IconComponent, iconColor, bgGradient, borderColor, shadowColor, accentColor, iconBg } = notificationStyle;

	return (
		<div
			aria-live="assertive"
			aria-atomic="true"
			className="fixed flex px-2 py-2 pointer-events-none sm:py-3 sm:items-start top-[32px] right-[20px] w-full z-[1000001]"
			role="region"
			aria-label="Notifications"
		>
			<div className="w-full flex flex-col items-center space-y-2 sm:items-end">
				<Transition
					show={ Boolean( notification.message ) }
					as={ Fragment }
					enter="transform ease-out duration-300 transition-all"
					enterFrom="translate-y-1 opacity-0 sm:translate-y-0 sm:translate-x-2 scale-98"
					enterTo="translate-y-0 opacity-100 sm:translate-x-0 scale-100"
					leave="transition ease-in duration-200"
					leaveFrom="opacity-100 scale-100"
					leaveTo="opacity-0 scale-98"
				>
					<div
						className={ `
							max-w-xs w-full ${ bgGradient }
							shadow-lg ${ shadowColor }
							rounded-lg pointer-events-auto
							ring-1 ring-black/5
							overflow-hidden
							border ${ borderColor }
							notification-container notification-card
							transform transition-all duration-200
							relative
						` }
						role="alert"
					>
						{ /* Animated progress bar with CSS animation */ }
						<div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200/40 overflow-hidden">
							<div
								className={ `h-full ${ accentColor } transform origin-left notification-progress` }
								style={ { '--duration': `${ notification.duration }ms` } }
							/>
						</div>

						{ /* Main content */ }
						<div className="p-2.5">
							<div className="flex items-center gap-2.5">
								{ /* Compact icon */ }
								<div className={ `
									flex-shrink-0 w-6 h-6 ${ iconBg } rounded-full
									flex items-center justify-center
									ring-1 ring-white/50 shadow-sm
									transform transition-all duration-300
								` }>
									<IconComponent
										className={ `h-3.5 w-3.5 ${ iconColor }` }
										aria-hidden="true"
									/>
								</div>

								{ /* Message content */ }
								<div className="flex-1 min-w-0">
									<p
										className="text-xs font-medium text-gray-900 m-0 p-0 leading-4 truncate"
										id="notification-message"
									>
										{ notification.message }
									</p>
								</div>

								{ /* Compact close button */ }
								<div className="flex-shrink-0">
									<button
										type="button"
										className="
											bg-white/60 backdrop-blur-sm rounded-full
											inline-flex text-gray-400 hover:text-gray-600
											focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300
											border-none p-1 transition-all duration-150
											hover:bg-white/80 hover:shadow-md
											transform hover:scale-105
											group
										"
										onClick={ dismissNotification }
										aria-label={ __( 'Close notification', 'solvex-ai-blogger' ) }
										aria-describedby="notification-message"
									>
										<span className="sr-only">
											{ __( 'Close notification', 'solvex-ai-blogger' ) }
										</span>
										<XIcon
											className="h-3 w-3 transition-transform duration-150 group-hover:scale-110"
											aria-hidden="true"
										/>
									</button>
								</div>
							</div>
						</div>

						{ /* Add CSS for progress bar animation */ }
						<style>{ `
							.notification-progress {
								animation: shrinkWidth var(--duration) linear forwards;
							}
						` }</style>
					</div>
				</Transition>
			</div>
		</div>
	);
}
