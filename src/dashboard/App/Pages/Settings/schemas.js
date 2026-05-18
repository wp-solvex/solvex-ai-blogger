/**
 * Zod schemas for the redesigned Settings pages.
 *
 * Kept in one file so tests can exercise validation without
 * pulling in component code.
 */
import { z } from 'zod';

export const personaSchema = z.object( {
	siteTitle: z.string().min( 1, 'Site title is required' ).max( 100 ),
	siteFor: z.string().min( 10, 'Provide at least 10 characters' ).max( 200 ),
	siteDescription: z.string().min( 20, 'Provide at least 20 characters' ).max( 500 ),
	temperature: z.number().min( 0 ).max( 2 ),
	harassment: z.number().int().min( 0 ).max( 4 ),
	hate: z.number().int().min( 0 ).max( 4 ),
	sexuallyExplicit: z.number().int().min( 0 ).max( 4 ),
	dangerousContent: z.number().int().min( 0 ).max( 4 ),
} );

const emailListPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+(?:\s*,\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/;

export const notificationsSchema = z
	.object( {
		emailNotificationEnabled: z.boolean(),
		emailNotificationValue: z.string(),
	} )
	.superRefine( ( data, ctx ) => {
		if ( ! data.emailNotificationEnabled ) {
			return;
		}
		const value = ( data.emailNotificationValue || '' ).trim();
		if ( ! value ) {
			ctx.addIssue( {
				code: 'custom',
				path: [ 'emailNotificationValue' ],
				message: 'Recipient required when notifications are on',
			} );
			return;
		}
		if ( ! emailListPattern.test( value ) ) {
			ctx.addIssue( {
				code: 'custom',
				path: [ 'emailNotificationValue' ],
				message: 'Enter one or more valid email addresses, comma-separated',
			} );
		}
	} );

export const licenseSchema = z.object( {
	licenseKey: z.string().min( 1, 'License key is required' ),
} );
