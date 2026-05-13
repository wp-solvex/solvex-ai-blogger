import React, { memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import Mail from 'lucide-react/dist/esm/icons/mail';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import { Switch } from '@Components/ui/switch';
import { Label } from '@Components/ui/label';
import { notificationsSchema } from './schemas';
import { cn } from '@Utils/cn';

const NOTIFICATION_TYPES = [
	__( 'Campaign started', 'solvex-ai-blogger' ),
	__( 'New post created', 'solvex-ai-blogger' ),
	__( 'Campaign completed', 'solvex-ai-blogger' ),
];

const SettingsNotifications = memo( function SettingsNotifications() {
	const dispatch = useDispatch();
	const enabled = useSelector( ( s ) => Boolean( s.emailNotificationEnabled ) );
	const recipient = useSelector( ( s ) => s.emailNotificationValue || '' );

	const values = useMemo(
		() => ( { emailNotificationEnabled: enabled, emailNotificationValue: recipient } ),
		[ enabled, recipient ]
	);

	const parsed = notificationsSchema.safeParse( values );
	const fieldError =
		! parsed.success && parsed.error.issues.find( ( i ) => i.path[ 0 ] === 'emailNotificationValue' );

	// Persistence is owned by the Settings page Save button; this panel
	// just keeps Redux in sync as the user toggles or types.
	const onToggle = ( next ) =>
		dispatch( { type: 'UPDATE_EMAIL_NOTIFICATION_ENABLED', payload: next } );
	const onRecipient = ( e ) =>
		dispatch( { type: 'UPDATE_EMAIL_NOTIFICATION_VALUE', payload: e.target.value } );

	return (
		<div className="space-y-8">
			<section>
				<header className="mb-5">
					<h2 className="text-xl font-semibold tracking-tight">
						{ __( 'Email notifications', 'solvex-ai-blogger' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'Get notified when campaigns run.', 'solvex-ai-blogger' ) }
					</p>
				</header>

				<div className="space-y-5 rounded-xl border border-border bg-card p-6 ring-1 ring-black/[0.02]">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-start gap-3">
							<div
								className={ cn(
									'flex size-9 items-center justify-center rounded-lg',
									enabled ? 'bg-brand-soft text-brand' : 'bg-muted text-muted-foreground'
								) }
							>
								<Mail className="size-4" aria-hidden="true" />
							</div>
							<div>
								<Label className="text-sm font-semibold">
									{ __( 'Send email when campaigns run', 'solvex-ai-blogger' ) }
								</Label>
								<p className="text-xs text-muted-foreground">
									{ __( 'Receive a heads-up for the events listed below.', 'solvex-ai-blogger' ) }
								</p>
							</div>
						</div>
						<Switch checked={ enabled } onCheckedChange={ onToggle } aria-label={ __( 'Toggle email notifications', 'solvex-ai-blogger' ) } />
					</div>

					{ enabled && (
						<div className="space-y-1.5">
							<Label htmlFor="settings-email-recipient">
								{ __( 'Recipient email(s)', 'solvex-ai-blogger' ) }
							</Label>
							<input
								id="settings-email-recipient"
								type="email"
								value={ recipient }
								onChange={ onRecipient }
								placeholder={ __( 'admin@example.com, editor@example.com', 'solvex-ai-blogger' ) }
								className={ cn(
									'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
									fieldError && 'border-destructive focus-visible:ring-destructive'
								) }
								aria-invalid={ Boolean( fieldError ) }
								aria-describedby="settings-email-recipient-hint"
							/>
							<p
								id="settings-email-recipient-hint"
								className={ cn(
									'text-xs',
									fieldError ? 'text-destructive' : 'text-muted-foreground'
								) }
							>
								{ fieldError
									? fieldError.message
									: __( 'Comma-separate multiple recipients.', 'solvex-ai-blogger' ) }
							</p>
						</div>
					) }
				</div>
			</section>

			<section>
				<header className="mb-5">
					<h2 className="text-xl font-semibold tracking-tight">
						{ __( 'Notification types', 'solvex-ai-blogger' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( "We'll email you for each of these events while notifications are on.", 'solvex-ai-blogger' ) }
					</p>
				</header>
				<ul className="space-y-2 flex items-center justify-between gap-4">
					{ NOTIFICATION_TYPES.map( ( type ) => (
						<li
							key={ type }
							className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 w-full"
						>
							<CheckCircle2 className="size-4 text-brand" aria-hidden="true" />
							<span className="text-sm font-medium">{ type }</span>
						</li>
					) ) }
				</ul>
			</section>
		</div>
	);
} );

SettingsNotifications.displayName = 'SettingsNotifications';

export default SettingsNotifications;
