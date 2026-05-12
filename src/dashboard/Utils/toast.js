/**
 * Toast wrapper around Sonner — single source of truth for in-app notifications.
 *
 * Mounting: <Toaster /> is rendered once inside AppShell. Emit with
 *   toast.success('Saved'), toast.error('Failed'), toast.loading('Saving...').
 *
 * Legacy emit sites that dispatched UPDATE_SETTINGS_SAVED_NOTIFICATION should
 * migrate to this wrapper.
 */
import { toast as sonner } from 'sonner';

export const toast = {
	success: ( message, options = {} ) => sonner.success( message, options ),
	error: ( message, options = {} ) => sonner.error( message, options ),
	info: ( message, options = {} ) => sonner.info( message, options ),
	warning: ( message, options = {} ) => sonner.warning( message, options ),
	loading: ( message, options = {} ) => sonner.loading( message, options ),
	dismiss: ( id ) => sonner.dismiss( id ),
	promise: ( promise, messages ) => sonner.promise( promise, messages ),
};

export default toast;
