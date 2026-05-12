/**
 * Tests for the zod schemas backing the Settings forms.
 */
import {
	personaSchema,
	notificationsSchema,
	licenseSchema,
} from '../../src/dashboard/App/Pages/Settings/schemas';

const validPersona = {
	siteTitle: 'My Blog',
	siteFor: 'Small business owners',
	siteDescription: 'Practical AI tutorials for non-technical site owners.',
	temperature: 1,
	harassment: 2,
	hate: 2,
	sexuallyExplicit: 2,
	dangerousContent: 2,
};

describe( 'personaSchema', () => {
	it( 'accepts a fully filled persona', () => {
		expect( personaSchema.safeParse( validPersona ).success ).toBe( true );
	} );

	it( 'requires siteTitle', () => {
		const r = personaSchema.safeParse( { ...validPersona, siteTitle: '' } );
		expect( r.success ).toBe( false );
		expect( r.error.issues[ 0 ].path ).toEqual( [ 'siteTitle' ] );
	} );

	it( 'requires siteFor to be at least 10 chars', () => {
		const r = personaSchema.safeParse( { ...validPersona, siteFor: 'short' } );
		expect( r.success ).toBe( false );
	} );

	it( 'rejects temperature out of range', () => {
		expect( personaSchema.safeParse( { ...validPersona, temperature: 3 } ).success ).toBe( false );
		expect( personaSchema.safeParse( { ...validPersona, temperature: -0.1 } ).success ).toBe( false );
	} );

	it( 'rejects safety levels out of range', () => {
		expect( personaSchema.safeParse( { ...validPersona, hate: 5 } ).success ).toBe( false );
	} );
} );

describe( 'notificationsSchema', () => {
	it( 'accepts disabled with empty recipient', () => {
		expect(
			notificationsSchema.safeParse( {
				emailNotificationEnabled: false,
				emailNotificationValue: '',
			} ).success
		).toBe( true );
	} );

	it( 'requires recipient when enabled', () => {
		const r = notificationsSchema.safeParse( {
			emailNotificationEnabled: true,
			emailNotificationValue: '',
		} );
		expect( r.success ).toBe( false );
		expect( r.error.issues[ 0 ].path ).toEqual( [ 'emailNotificationValue' ] );
	} );

	it( 'rejects malformed email', () => {
		const r = notificationsSchema.safeParse( {
			emailNotificationEnabled: true,
			emailNotificationValue: 'not-an-email',
		} );
		expect( r.success ).toBe( false );
	} );

	it( 'accepts multiple comma-separated emails', () => {
		const r = notificationsSchema.safeParse( {
			emailNotificationEnabled: true,
			emailNotificationValue: 'a@b.co, c@d.co',
		} );
		expect( r.success ).toBe( true );
	} );
} );

describe( 'licenseSchema', () => {
	it( 'requires a non-empty key', () => {
		expect( licenseSchema.safeParse( { licenseKey: '' } ).success ).toBe( false );
		expect( licenseSchema.safeParse( { licenseKey: 'abc-123' } ).success ).toBe( true );
	} );
} );
