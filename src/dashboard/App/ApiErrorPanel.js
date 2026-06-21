import { Fragment, useCallback, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useSelector, useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import {
	AlertCircle,
	X,
	Copy,
	Check,
	LifeBuoy,
	BookOpen,
} from 'lucide-react';

/**
 * Support links (mirrors the Welcome tab Quick Access links).
 */
const SUPPORT_TICKET_URL = 'https://wpaiblogger.com/contact/';
const HELP_CENTER_URL = 'https://wpaiblogger.com/docs/';

/**
 * A single labelled detail row.
 *
 * @param {Object}  root0       Component props.
 * @param {string}  root0.label The field label.
 * @param {*}       root0.value The field value.
 * @param {boolean} root0.mono  Whether to render the value in a monospace font.
 * @return {JSX.Element|null} The rendered row, or null when there is no value.
 */
function DetailRow( { label, value, mono = false } ) {
	if ( value === undefined || value === null || value === '' ) {
		return null;
	}

	return (
		<div className="flex flex-col gap-1 py-2.5 border-b border-gray-100 last:border-b-0">
			<span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
				{ label }
			</span>
			<span
				className={ `text-[13px] text-gray-900 break-words ${
					mono ? 'font-mono whitespace-pre-wrap leading-5' : ''
				}` }
			>
				{ value }
			</span>
		</div>
	);
}

/**
 * Right-side slide-in panel that shows the full details of an API error,
 * styled to match the MS Fabric Lakehouse error panel with brand colors.
 */
export default function ApiErrorPanel() {
	const dispatch = useDispatch();
	const panel = useSelector( ( state ) => state.apiErrorPanel );
	const [ copied, setCopied ] = useState( false );

	const isOpen = Boolean( panel && panel.open );

	const close = useCallback( () => {
		dispatch( { type: 'UPDATE_API_ERROR_PANEL', payload: null } );
	}, [ dispatch ] );

	// Build a copyable, formatted block of the error details.
	const copyText = useMemo( () => {
		if ( ! panel ) {
			return '';
		}
		const lines = [
			`Summary: ${ panel.message || '' }`,
			`Error code: ${ panel.code || '' }`,
			`HTTP status: ${ panel.status || '' }`,
			`Provider status: ${ panel.providerStatus || '' }`,
			`Detail: ${ panel.detail || '' }`,
		];
		return lines.join( '\n' );
	}, [ panel ] );

	const handleCopy = useCallback( async () => {
		const markCopied = () => {
			setCopied( true );
			setTimeout( () => setCopied( false ), 2000 );
		};

		// Preferred: async Clipboard API (requires a secure context).
		if ( navigator.clipboard && window.isSecureContext ) {
			try {
				await navigator.clipboard.writeText( copyText );
				markCopied();
				return;
			} catch ( e ) {
				// Fall through to the legacy approach below.
			}
		}

		// Fallback for non-secure contexts / older browsers (works inside wp-admin).
		try {
			const textarea = document.createElement( 'textarea' );
			textarea.value = copyText;
			textarea.setAttribute( 'readonly', '' );
			textarea.style.position = 'fixed';
			textarea.style.top = '-9999px';
			textarea.style.opacity = '0';
			document.body.appendChild( textarea );
			textarea.focus();
			textarea.select();
			document.execCommand( 'copy' );
			document.body.removeChild( textarea );
			markCopied();
		} catch ( e ) {
			// Clipboard unavailable; fail silently.
		}
	}, [ copyText ] );

	return (
		<Transition show={ isOpen } as={ Fragment }>
			<Dialog as="div" className="relative z-[1000002]" onClose={ close }>
				{ /* Backdrop */ }
				<Transition.Child
					as={ Fragment }
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-gray-900/30 backdrop-blur-[1px]" aria-hidden="true" />
				</Transition.Child>

				{ /* Panel container */ }
				<div className="fixed inset-0 overflow-hidden">
					<div className="absolute inset-0 overflow-hidden">
						<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
							<Transition.Child
								as={ Fragment }
								enter="transform transition ease-out duration-300"
								enterFrom="translate-x-full"
								enterTo="translate-x-0"
								leave="transform transition ease-in duration-200"
								leaveFrom="translate-x-0"
								leaveTo="translate-x-full"
							>
								<Dialog.Panel className="pointer-events-auto w-screen max-w-md">
									<div className="flex h-full flex-col bg-white shadow-2xl">
										{ /* Header */ }
										<div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
											<div className="flex items-center gap-2.5">
												<span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
													<AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
												</span>
												<Dialog.Title className="text-[15px] font-semibold text-gray-900">
													{ __( 'Error details', 'solvex-ai-blogger' ) }
												</Dialog.Title>
											</div>
											<button
												type="button"
												onClick={ close }
												className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 border-none bg-transparent cursor-pointer"
												aria-label={ __( 'Close', 'solvex-ai-blogger' ) }
											>
												<X className="h-4 w-4" aria-hidden="true" />
											</button>
										</div>

										{ /* Body */ }
										<div className="flex-1 overflow-y-auto px-5 py-4">
											{ /* Friendly summary */ }
											{ panel?.message && (
												<div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3">
													<p className="m-0 text-[13px] font-medium text-red-800">
														{ panel.message }
													</p>
												</div>
											) }

											{ /* Structured detail rows */ }
											<div className="rounded-lg border border-gray-200 px-3.5">
												<DetailRow label={ __( 'Error code', 'solvex-ai-blogger' ) } value={ panel?.code } />
												<DetailRow label={ __( 'HTTP status', 'solvex-ai-blogger' ) } value={ panel?.status } />
												<DetailRow label={ __( 'Provider status', 'solvex-ai-blogger' ) } value={ panel?.providerStatus } />
												<DetailRow label={ __( 'Technical detail', 'solvex-ai-blogger' ) } value={ panel?.detail } mono />
											</div>

											{ /* Copy button */ }
											<button
												type="button"
												onClick={ handleCopy }
												className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-100 cursor-pointer"
											>
												{ copied ? (
													<>
														<Check className="h-3.5 w-3.5" aria-hidden="true" />
														{ __( 'Copied', 'solvex-ai-blogger' ) }
													</>
												) : (
													<>
														<Copy className="h-3.5 w-3.5" aria-hidden="true" />
														{ __( 'Copy details', 'solvex-ai-blogger' ) }
													</>
												) }
											</button>
										</div>

										{ /* Footer: support links */ }
										<div className="border-t border-gray-200 px-5 py-4">
											<p className="m-0 mb-2.5 text-[12px] text-gray-500">
												{ __( 'Need help? Reach out to our team.', 'solvex-ai-blogger' ) }
											</p>
											<div className="flex items-center justify-between gap-3">
												<a
													href={ SUPPORT_TICKET_URL }
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700 no-underline"
												>
													<LifeBuoy className="h-4 w-4 flex-shrink-0 block" aria-hidden="true" />
													<span className="leading-none">{ __( 'Open a support ticket', 'solvex-ai-blogger' ) }</span>
												</a>
												<a
													href={ HELP_CENTER_URL }
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700 no-underline"
												>
													<BookOpen className="h-4 w-4 flex-shrink-0 block" aria-hidden="true" />
													<span className="leading-none">{ __( 'Visit the Help Center', 'solvex-ai-blogger' ) }</span>
												</a>
											</div>
										</div>
									</div>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
