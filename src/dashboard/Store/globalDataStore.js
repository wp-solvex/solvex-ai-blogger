import { legacy_createStore as createStore, compose } from 'redux';
import globalDataReducer from './globalDataReducer';

/**
 * Safely parse localized data with type conversion and fallbacks
 *
 * @param {*}       value        - Value to parse from localized data
 * @param {string}  type         - Target type: 'string', 'number', 'boolean', 'array', 'object'
 * @param {*}       defaultValue - Default value returned if parsing fails
 * @param {boolean} parseJSON    - Whether to parse JSON strings for object types
 * @return {*} Parsed value with correct type or default value
 */
const safeParseLocalizedData = ( value, type = 'string', defaultValue = '', parseJSON = false ) => {
	try {
		switch ( type ) {
			case 'number':
				// Handle 0 values properly - don't treat them as falsy
				if ( value === 0 || value === '0' ) {
					return 0;
				}
				const num = parseFloat( value );
				return isNaN( num ) ? defaultValue : num;
			case 'boolean':
				return Boolean( parseInt( value ) );
			case 'array':
				return Array.isArray( value ) ? value : ( value ? [ value ] : [] );
			case 'object':
				if ( parseJSON && typeof value === 'string' ) {
					try {
						const parsed = JSON.parse( value );
						return typeof parsed === 'object' && parsed !== null ? parsed : defaultValue;
					} catch ( e ) {
						return defaultValue;
					}
				}
				return value && typeof value === 'object' ? value : defaultValue;
			default:
				return value !== undefined && value !== null ? String( value ) : defaultValue;
		}
	} catch ( error ) {
		if ( process.env.NODE_ENV === 'development' ) {
			console.warn( `Failed to parse localized data for type ${ type }:`, error, 'Value:', value );
		}
		return defaultValue;
	}
};

/**
 * Get safely parsed initial state from WordPress localized data
 *
 * @return {Object} Complete initial state object for Redux store
 */
const getInitialState = () => {
	// Ensure wpsolvex_autoaiblogger_localized_data exists
	if ( typeof wpsolvex_autoaiblogger_localized_data === 'undefined' ) {
		if ( process.env.NODE_ENV === 'development' ) {
			console.warn( 'wpsolvex_autoaiblogger_localized_data is not defined, using minimal fallback state' );
		}
		return {
			initialStateSetFlag: false,
			activeSettingsNavigationTab: 'general',
			settingsSavedNotification: false,
			apiErrorPanel: null,
			confettiShow: false,
			onboardingTab: 0,
			isLoading: false,
			error: 'Localized data not available',
		};
	}

	// Build initial state with safe parsing
	const parsedState = {
		initialStateSetFlag: false,
		activeSettingsNavigationTab: 'general',
		settingsSavedNotification: false,
		apiErrorPanel: null,
		confettiShow: false,
		onboardingTab: 0,
		userName: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.current_user_name, 'string', '' ),
		userEmail: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.current_user_email, 'string', '' ),
		userOnboarded: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.userOnboarded, 'boolean', false ),
		pluginSettings: {},
		siteTitle: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.site_title, 'string', '' ),
		siteFor: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.site_for, 'string', '' ),
		siteDescription: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.site_description, 'string', '' ),
		temperature: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.temperature, 'number', 1.0 ),
		harassment: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.harassment, 'number', 2 ),
		hate: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.hate, 'number', 2 ),
		sexuallyExplicit: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.sexually_explicit, 'number', 2 ),
		dangerousContent: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.dangerous_content, 'number', 2 ),
		license: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.license, 'string', '' ),
		postIdeas: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.postIdeas, 'string', '' ),
		createdPostIdeas: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.createdPostIdeas, 'object', {}, true ),
		tokenTotal: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.token_total, 'number', 0 ),
		tokenRemaining: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.token_remaining, 'number', 0 ),
		license_status: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.license_status, 'string', 'inactive' ),

		// Store connection (one-click connect).
		connectedEmail: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.connected_email, 'string', '' ),
		plan: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.plan, 'string', '' ),

		// Static configuration data that doesn't change during app lifecycle.
		homeSlug: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.home_slug, 'string', 'solvex-ai-blogger' ),
		adminNonce: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.admin_nonce, 'string', '' ),
		ajaxUrl: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.ajax_url, 'string', '' ),
		editPostLink: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.edit_post_link, 'string', '/wp-admin/post.php?post={{POST_ID}}&action=edit' ),
		allCampaigns: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.all_campaigns, 'object', {} ),
		postmetaDefaults: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.postmeta_defaults, 'object', {} ),
		licensingNonce: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.licensing_nonce, 'string', '' ),
		upgradeLink: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.upgrade_link, 'string', '#' ),
		noLicenseKeyUrl: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.registration_url, 'string', '#' ),
		adminEmail: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.admin_email, 'string', '' ),
		adminAppUrl: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.admin_app_url, 'string', '' ),
		adminBaseUrl: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.admin_base_url, 'string', '' ),
		proPurchaseUrl: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.pro_purchase_url, 'string', 'https://wpaiblogger.com/#pricing' ),
		proAvailable: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.pro_available, 'boolean', false ),
		version: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.version, 'string', '1.0.0' ),
		proVersion: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.pro_version, 'string', '' ),
		postTypes: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.post_types, 'object', {} ),
		tourCompleted: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.tour_completed, 'boolean', false ),

		// Notification settings - default to false/empty
		emailNotificationEnabled: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.email_notification_enabled, 'boolean', false ),
		emailNotificationValue: safeParseLocalizedData( wpsolvex_autoaiblogger_localized_data.email_notification_value, 'string', wpsolvex_autoaiblogger_localized_data.admin_email || '' ),

		isLoading: false,
		error: null,
	};

	// Apply WordPress hooks filter if available
	return wp?.hooks?.applyFilters?.( 'ai_blogger_dashboard/datastore', parsedState ) || parsedState;
};

/**
 * Configure Redux DevTools with enhanced debugging options
 *
 * @return {Function|undefined} Redux DevTools enhancer or undefined if not available
 */
const configureDevTools = () => {
	if ( typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		return window.__REDUX_DEVTOOLS_EXTENSION__( {
			name: 'AI Blogger Dashboard',
			trace: process.env.NODE_ENV === 'development',
			traceLimit: 25,
			maxAge: 50, // Keep last 50 actions for debugging
			serialize: {
				options: {
					undefined: true,
					function: true,
				},
			},
		} );
	}
	return undefined;
};

/**
 * Create enhanced Redux store with middleware, DevTools, and error handling
 *
 * @return {Object} Configured Redux store instance
 */
const createEnhancedStore = () => {
	try {
		const initialState = getInitialState();
		const devTools = configureDevTools();

		// Validate initial state structure
		if ( ! initialState || typeof initialState !== 'object' ) {
			console.error( 'Invalid initial state, using minimal fallback' );
			const fallbackState = {
				initialStateSetFlag: false,
				isLoading: false,
				error: 'Invalid initial state',
			};
			return createStore( globalDataReducer, fallbackState );
		}

		// Use compose to properly combine enhancers
		const enhancers = devTools ? compose( devTools ) : undefined;

		const store = createStore(
			globalDataReducer,
			initialState,
			enhancers
		);

		// Add enhanced error handling for dispatch operations
		const originalDispatch = store.dispatch;
		store.dispatch = ( action ) => {
			try {
				return originalDispatch( action );
			} catch ( error ) {
				console.error( 'Store dispatch error:', error, 'Action:', action );
				// Dispatch error action instead of throwing to maintain app stability
				return originalDispatch( {
					type: 'STORE_ERROR',
					payload: { message: error.message, action: action.type },
				} );
			}
		};

		// Log store creation in development with state summary
		if ( process.env.NODE_ENV === 'development' ) {
			const state = store.getState();
			console.log( 'AI Blogger Dashboard store created successfully' );
			console.log( 'Initial state summary:', {
				userOnboarded: state.userOnboarded,
				siteTitle: state.siteTitle || 'Not set',
				temperature: state.temperature,
				safetyFilters: {
					harassment: state.harassment,
					hate: state.hate,
					sexuallyExplicit: state.sexuallyExplicit,
					dangerousContent: state.dangerousContent,
				},
				licenseStatus: state.license_status,
				totalProperties: Object.keys( state ).length,
			} );
		}

		return store;
	} catch ( error ) {
		console.error( 'Critical error: Failed to create Redux store:', error );
		// Return a minimal emergency store as final fallback
		const emergencyState = {
			initialStateSetFlag: false,
			isLoading: false,
			error: 'Failed to initialize store',
		};
		return createStore( globalDataReducer, emergencyState );
	}
};

// Create and export the global store instance
const globalDataStore = createEnhancedStore();

export default globalDataStore;
