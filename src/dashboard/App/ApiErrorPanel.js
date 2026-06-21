import { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import LifeBuoy from 'lucide-react/dist/esm/icons/life-buoy';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from '@Components/ui/sheet';
import { Button } from '@Components/ui/button';
import { cn } from '@Utils/cn';

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
		<div className="flex flex-col gap-1 py-2.5 border-b border-border last:border-b-0">
			<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
				{ label }
			</span>
			<span
				className={ cn(
					'text-[13px] text-foreground break-words',
					mono && 'font-mono whitespace-pre-wrap leading-5'
				) }
			>
				{ value }
			</span>
		</div>
	);
}

/**
 * Right-side slide-in Sheet that shows the full structured details of an API
 * error. Reads the `apiErrorPanel` Redux state (set via UPDATE_API_ERROR_PANEL)
 * and renders the structured error fields. Closing dispatches
 * UPDATE_API_ERROR_PANEL with a `null` payload.
 *
 * The panel accepts both the camelCase shape used by existing dispatchers
 * ( message / code / status / providerStatus / detail ) and the raw structured
 * shape ( user_message / error_code / http_status / provider_status / category
 * / title / detail ), so it surfaces every available field regardless of the
 * payload variant that opened it.
 *
 * @return {JSX.Element} The error details Sheet.
 */
export default function ApiErrorPanel() {
	const dispatch = useDispatch();
	const panel = useSelector( ( state ) => state.apiErrorPanel );
	const [ copied, setCopied ] = useState( false );

	const isOpen = Boolean( panel );

	const close = useCallback( () => {
		dispatch( { type: 'UPDATE_API_ERROR_PANEL', payload: null } );
	}, [ dispatch ] );

	// Normalise the payload into the structured fields the panel renders,
	// accepting both the camelCase and the raw structured key variants.
	const fields = useMemo( () => {
		if ( ! panel ) {
			return null;
		}
		return {
			title: panel.title || '',
			userMessage: panel.message || panel.user_message || '',
			errorCode: panel.code || panel.error_code || '',
			httpStatus: panel.status || panel.http_status || '',
			providerStatus: panel.providerStatus || panel.provider_status || '',
			category: panel.category || '',
			detail: panel.detail || '',
		};
	}, [ panel ] );

	// Build a copyable, formatted block of the error details.
	const copyText = useMemo( () => {
		if ( ! fields ) {
			return '';
		}
		const lines = [
			`Title: ${ fields.title }`,
			`Summary: ${ fields.userMessage }`,
			`Error code: ${ fields.errorCode }`,
			`HTTP status: ${ fields.httpStatus }`,
			`Provider status: ${ fields.providerStatus }`,
			`Category: ${ fields.category }`,
			`Detail: ${ fields.detail }`,
		];
		return lines.join( '\n' );
	}, [ fields ] );

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

	// Radix Sheet controls open state; closing (overlay click, Esc, close
	// button) routes back through the Redux dispatch so the store stays in sync.
	const handleOpenChange = useCallback(
		( next ) => {
			if ( ! next ) {
				close();
			}
		},
		[ close ]
	);

	return (
		<Sheet open={ isOpen } onOpenChange={ handleOpenChange }>
			<SheetContent
				side="right"
				className="z-[1000002] flex w-screen max-w-md flex-col gap-0 bg-card p-0 sm:max-w-md"
			>
				{ /* Header */ }
				<SheetHeader className="space-y-0 border-b border-border px-5 py-4 text-left">
					<div className="flex items-center gap-2.5">
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
							<AlertCircle
								className="h-4 w-4 text-destructive"
								aria-hidden="true"
							/>
						</span>
						<div className="flex flex-col">
							<SheetTitle className="text-[15px] font-semibold text-foreground">
								{ fields?.title || __( 'Error details', 'solvex-ai-blogger' ) }
							</SheetTitle>
							<SheetDescription className="sr-only">
								{ __(
									'Detailed information about the API error.',
									'solvex-ai-blogger'
								) }
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{ /* Body */ }
				<div className="flex-1 overflow-y-auto px-5 py-4">
					{ /* Friendly summary */ }
					{ fields?.userMessage && (
						<div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3">
							<p className="m-0 text-[13px] font-medium text-destructive">
								{ fields.userMessage }
							</p>
						</div>
					) }

					{ /* Structured detail rows */ }
					<div className="rounded-lg border border-border bg-background px-3.5">
						<DetailRow
							label={ __( 'Error code', 'solvex-ai-blogger' ) }
							value={ fields?.errorCode }
						/>
						<DetailRow
							label={ __( 'HTTP status', 'solvex-ai-blogger' ) }
							value={ fields?.httpStatus }
						/>
						<DetailRow
							label={ __( 'Provider status', 'solvex-ai-blogger' ) }
							value={ fields?.providerStatus }
						/>
						<DetailRow
							label={ __( 'Category', 'solvex-ai-blogger' ) }
							value={ fields?.category }
						/>
						<DetailRow
							label={ __( 'Technical detail', 'solvex-ai-blogger' ) }
							value={ fields?.detail }
							mono
						/>
					</div>

					{ /* Copy button */ }
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={ handleCopy }
						className="mt-4 border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand hover:brightness-95"
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
					</Button>
				</div>

				{ /* Footer: support links */ }
				<SheetFooter className="flex-col items-stretch space-x-0 border-t border-border px-5 py-4">
					<p className="m-0 mb-2.5 text-[12px] text-muted-foreground">
						{ __(
							'Need help? Reach out to our team.',
							'solvex-ai-blogger'
						) }
					</p>
					<div className="flex items-center justify-between gap-3">
						<a
							href={ SUPPORT_TICKET_URL }
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand no-underline hover:brightness-110"
						>
							<LifeBuoy
								className="h-4 w-4 flex-shrink-0 block"
								aria-hidden="true"
							/>
							<span className="leading-none">
								{ __( 'Open a support ticket', 'solvex-ai-blogger' ) }
							</span>
						</a>
						<a
							href={ HELP_CENTER_URL }
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand no-underline hover:brightness-110"
						>
							<BookOpen
								className="h-4 w-4 flex-shrink-0 block"
								aria-hidden="true"
							/>
							<span className="leading-none">
								{ __( 'Visit the Help Center', 'solvex-ai-blogger' ) }
							</span>
						</a>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
