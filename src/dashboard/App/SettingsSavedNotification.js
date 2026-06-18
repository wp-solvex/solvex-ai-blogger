import { Fragment, useEffect, useCallback, useMemo } from 'react';
import { CheckCircleIcon, XIcon, AlertCircleIcon, InfoIcon } from 'lucide-react';
import { Transition } from '@headlessui/react';
import { useSelector, useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Notification styling tokens — modeled on the MS Fabric Lakehouse
 * (Fluent UI) toast: a clean white surface with a colored status icon,
 * subtle border, and an accent bar. Uses our brand purple for info.
 */
const NotificationTypes = {
	success: {
		icon: CheckCircleIcon,
		iconColor: 'text-emerald-600',
		iconBg: 'bg-emerald-100',
		accentColor: 'bg-emerald-500',
	},
	error: {
		icon: AlertCircleIcon,
		iconColor: 'text-red-600',
		iconBg: 'bg-red-100',
		accentColor: 'bg-red-500',
	},
	warning: {
		icon: AlertCircleIcon,
		iconColor: 'text-amber-600',
		iconBg: 'bg-amber-100',
		accentColor: 'bg-amber-500',
	},
	info: {
		icon: InfoIcon,
		iconColor: 'text-brand-600',
		iconBg: 'bg-brand-100',
		accentColor: 'bg-brand-500',
	},
};

const DEFAULT_DURATION = 3000;
const ERROR_DURATION = 8000;

/**
 * Toast notification component styled like the Fabric Lakehouse message,
 * with our brand colors. Supports a friendly title, wrapping body, and an
 * optional "View details" action that opens the API error side panel.
 */
export default function SettingsSavedNotification() {
	const dispatch = useDispatch();

	// Normalize the notification into a consistent object shape.
	const notification = useSelector( ( state ) => {
		const raw = state.settingsSavedNotification;

		if ( typeof raw === 'string' ) {
			if ( ! raw ) {
				return null;
			}
			return { message: raw, type: 'success', duration: DEFAULT_DURATION };
		}

		if ( raw && typeof raw === 'object' ) {
			const type = raw.type || 'success';
			return {
				title: raw.title || '',
				message: raw.message || '',
				type,
				duration: raw.duration || ( type === 'error' ? ERROR_DURATION : DEFAULT_DURATION ),
				details: raw.details || null,
				link: raw.link || null,
			};
		}

		return null;
	} );

	const dismissNotification = useCallback( () => {
		dispatch( {
			type: 'UPDATE_SETTINGS_SAVED_NOTIFICATION',
			payload: '',
		} );
	}, [ dispatch ] );

	// Open the error details side panel with the structured error info.
	const openDetails = useCallback( () => {
		if ( ! notification?.details ) {
			return;
		}
		const d = notification.details;
		dispatch( {
			type: 'UPDATE_API_ERROR_PANEL',
			payload: {
				open: true,
				message: d.user_message || notification.message || '',
				code: d.error_code || '',
				status: d.http_status || '',
				providerStatus: d.provider_status || '',
				detail: d.detail || '',
			},
		} );
	}, [ dispatch, notification ] );

	// Auto-dismiss after the type-appropriate duration.
	useEffect( () => {
		if ( notification?.message ) {
			const timer = setTimeout( () => {
				dismissNotification();
			}, notification.duration );

			return () => clearTimeout( timer );
		}
	}, [ notification, dismissNotification ] );

	const style = useMemo( () => {
		if ( ! notification?.type ) {
			return NotificationTypes.success;
		}
		return NotificationTypes[ notification.type ] || NotificationTypes.success;
	}, [ notification?.type ] );

	if ( ! notification?.message ) {
		return null;
	}

	const { icon: IconComponent, iconColor, iconBg, accentColor } = style;
	const hasDetails = Boolean( notification.details );

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
					enterFrom="translate-y-1 opacity-0 sm:translate-y-0 sm:translate-x-2"
					enterTo="translate-y-0 opacity-100 sm:translate-x-0"
					leave="transition ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div
						className="
							max-w-md w-full bg-white
							shadow-lg shadow-gray-200/60
							rounded-lg pointer-events-auto
							ring-1 ring-black/5
							overflow-hidden
							border border-gray-200
							relative
						"
						role="alert"
					>
						{ /* Accent progress bar */ }
						<div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-100 overflow-hidden">
							<div
								className={ `h-full ${ accentColor } transform origin-left notification-progress` }
								style={ { '--duration': `${ notification.duration }ms` } }
							/>
						</div>

						<div className="p-3">
							<div className="flex items-start gap-3">
								{ /* Status icon */ }
								<div className={ `
									flex-shrink-0 w-7 h-7 ${ iconBg } rounded-full
									flex items-center justify-center mt-0.5
								` }>
									<IconComponent
										className={ `h-4 w-4 ${ iconColor }` }
										aria-hidden="true"
									/>
								</div>

								{ /* Message content */ }
								<div className="flex-1 min-w-0">
									{ notification.title && (
										<p className="text-[13px] font-semibold text-gray-900 m-0 p-0 leading-5">
											{ notification.title }
										</p>
									) }
									<p
										className="text-[13px] text-gray-700 m-0 p-0 leading-5 break-words"
										id="notification-message"
									>
										{ notification.message }
									</p>

									{ /* View details action */ }
									{ hasDetails && (
										<button
											type="button"
											onClick={ openDetails }
											className="mt-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700 bg-transparent border-none p-0 cursor-pointer"
										>
											{ __( 'View details', 'solvex-ai-blogger' ) }
										</button>
									) }

									{ /* Success link action (e.g. View post) */ }
									{ notification.link && notification.link.url && (
										<a
											href={ notification.link.url }
											target="_blank"
											rel="noopener noreferrer"
											className="mt-1.5 inline-block text-[13px] font-medium text-brand-600 hover:text-brand-700 no-underline cursor-pointer"
										>
											{ notification.link.label || __( 'View post', 'solvex-ai-blogger' ) }
										</a>
									) }
								</div>

								{ /* Close button */ }
								<div className="flex-shrink-0">
									<button
										type="button"
										className="
											rounded-md inline-flex text-gray-400 hover:text-gray-600
											focus:outline-none focus:ring-1 focus:ring-gray-300
											border-none bg-transparent p-1 transition-colors duration-150
											hover:bg-gray-100 cursor-pointer
										"
										onClick={ dismissNotification }
										aria-label={ __( 'Close notification', 'solvex-ai-blogger' ) }
										aria-describedby="notification-message"
									>
										<span className="sr-only">
											{ __( 'Close notification', 'solvex-ai-blogger' ) }
										</span>
										<XIcon className="h-3.5 w-3.5" aria-hidden="true" />
									</button>
								</div>
							</div>
						</div>

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
