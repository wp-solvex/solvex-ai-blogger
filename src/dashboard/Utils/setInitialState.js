import apiFetch from '@wordpress/api-fetch';

const setInitialState = ( store ) => {
	apiFetch( {
		path: '/solvex-ai-blogger/v1/admin/settings/',
	} )
		.then( ( wpAiBloggerSettings ) => {
			// Get current state to preserve certain values that are correctly initialized from PHP
			const currentState = store.getState();

			// Debug logging for license preservation
			console.log( 'setInitialState - License selection:', {
				currentLicense: currentState.license,
				currentLicenseStatus: currentState.license_status,
				apiLicense: wpAiBloggerSettings.license,
				selectedLicense: currentState.license || wpAiBloggerSettings.license || '',
				source: currentState.license ? 'current_state' : ( wpAiBloggerSettings.license ? 'api' : 'none' ),
			} );

			// Only update specific fields that should come from the API, preserve others
			const selectiveUpdate = {
				settingsSavedNotification: '',
				initialStateSetFlag: true,
				activeSettingsNavigationTab: 'home',
				// Only update these specific fields from API, preserve tokens and other critical data
				...( wpAiBloggerSettings.siteTitle && { siteTitle: wpAiBloggerSettings.siteTitle } ),
				...( wpAiBloggerSettings.siteFor && { siteFor: wpAiBloggerSettings.siteFor } ),
				...( wpAiBloggerSettings.siteDescription && { siteDescription: wpAiBloggerSettings.siteDescription } ),
				...( wpAiBloggerSettings.temperature !== undefined && { temperature: wpAiBloggerSettings.temperature } ),
				...( wpAiBloggerSettings.harassment !== undefined && { harassment: wpAiBloggerSettings.harassment } ),
				...( wpAiBloggerSettings.hate !== undefined && { hate: wpAiBloggerSettings.hate } ),
				...( wpAiBloggerSettings.sexually_explicit !== undefined && { sexuallyExplicit: wpAiBloggerSettings.sexually_explicit } ),
				...( wpAiBloggerSettings.dangerous_content !== undefined && { dangerousContent: wpAiBloggerSettings.dangerous_content } ),
				...( wpAiBloggerSettings.post_ideas && typeof wpAiBloggerSettings.post_ideas === 'string' && { postIdeas: wpAiBloggerSettings.post_ideas } ),
				// License handling: Use current state license if it exists, otherwise use API license.
				license: currentState.license || wpAiBloggerSettings.license || '',
				// Only update tokens if API returns better data than what we already have.
				...( wpAiBloggerSettings.tokenTotal > currentState.tokenTotal && { tokenTotal: wpAiBloggerSettings.tokenTotal } ),
				...( wpAiBloggerSettings.tokenRemaining > currentState.tokenRemaining && { tokenRemaining: wpAiBloggerSettings.tokenRemaining } ),
			};

			store.dispatch( {
				type: 'UPDATE_INITIAL_STATE',
				payload: selectiveUpdate,
			} );
		} )
		.catch( ( error ) => {
			console.error( 'Error occurred while setting the initial store data: ' + error );

			// Even if API fails, make sure we set the initial state flag
			store.dispatch( {
				type: 'UPDATE_INITIAL_STATE_FLAG',
				payload: true,
			} );
		} );
};

export default setInitialState;
