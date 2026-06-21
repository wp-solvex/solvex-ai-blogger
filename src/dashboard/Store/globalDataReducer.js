/**
 * Global data reducer with improved error handling and structure
 *
 * This reducer handles state updates for the AI Blogger Dashboard application.
 * All initial state values are provided through WordPress localized data in menu.php
 * to maintain a single source of truth for default values and configuration.
 *
 * @param {Object} state  - Current state (initialized by globalDataStore.js from WordPress data)
 * @param {Object} action - Action object with type and payload
 * @return {Object} New state object
 */
const globalDataReducer = ( state = {}, action ) => {
	// Apply WordPress hooks filter for action type
	const actionType = wp?.hooks?.applyFilters?.( 'ai_blogger_dashboard/data_reducer_action', action.type ) || action.type;

	// Validate action structure
	if ( ! action || typeof action !== 'object' || ! action.type ) {
		console.warn( 'Invalid action dispatched to globalDataReducer:', action );
		return state;
	}

	// Handle loading states
	if ( actionType.endsWith( '_REQUEST' ) ) {
		return {
			...state,
			isLoading: true,
			error: null,
		};
	}

	if ( actionType.endsWith( '_SUCCESS' ) ) {
		return {
			...state,
			isLoading: false,
			error: null,
		};
	}

	if ( actionType.endsWith( '_FAILURE' ) ) {
		return {
			...state,
			isLoading: false,
			error: action.payload?.message || 'An error occurred',
		};
	}

	// Action handlers with type safety
	const actionHandlers = {
		UPDATE_INITIAL_STATE: () => {
			// Validate that payload is an object
			if ( ! action.payload || typeof action.payload !== 'object' ) {
				console.warn( 'UPDATE_INITIAL_STATE: Invalid payload', action.payload );
				return state;
			}
			return { ...state, ...action.payload };
		},
		UPDATE_INITIAL_STATE_FLAG: () => ( { ...state, initialStateSetFlag: Boolean( action.payload ) } ),
		UPDATE_SETTINGS_ACTIVE_NAVIGATION_TAB: () => ( { ...state, activeSettingsNavigationTab: String( action.payload || 'general' ) } ),
		UPDATE_SETTINGS_SAVED_NOTIFICATION: () => ( { ...state, settingsSavedNotification: action.payload } ),
		UPDATE_API_ERROR_PANEL: () => ( { ...state, apiErrorPanel: action.payload || null } ),
		UPDATE_CONFETTI_SHOW: () => ( { ...state, confettiShow: Boolean( action.payload ) } ),
		UPDATE_ONBOARDING_TAB: () => ( { ...state, onboardingTab: Number( action.payload ) || 0 } ),
		UPDATE_SITE_TITLE: () => ( { ...state, siteTitle: String( action.payload || '' ) } ),
		UPDATE_SITE_FOR: () => ( { ...state, siteFor: String( action.payload || '' ) } ),
		UPDATE_SITE_DESCRIPTION: () => ( { ...state, siteDescription: String( action.payload || '' ) } ),
		UPDATE_LICENSE: () => ( { ...state, license: String( action.payload || '' ) } ),
		UPDATE_USER_ONBOARDED: () => ( { ...state, userOnboarded: Boolean( action.payload ) } ),
		UPDATE_USER_NAME: () => ( { ...state, userName: String( action.payload || '' ) } ),
		UPDATE_USER_EMAIL: () => ( { ...state, userEmail: String( action.payload || '' ) } ),
		UPDATE_PLUGIN_SETTINGS: () => {
			const settings = action.payload && typeof action.payload === 'object' ? action.payload : {};
			return { ...state, pluginSettings: { ...state.pluginSettings, ...settings } };
		},
		UPDATE_TEMPERATURE: () => {
			const temp = Number( action.payload );
			const validTemp = isNaN( temp ) ? 1.0 : Math.max( 0, Math.min( 2, temp ) ); // Clamp between 0 and 2
			return { ...state, temperature: validTemp };
		},
		UPDATE_HARASSMENT: () => {
			const value = action.payload !== undefined ? Number( action.payload ) : 2;
			const validValue = isNaN( value ) ? 2 : Math.max( 0, Math.min( 4, Math.floor( value ) ) ); // Clamp between 0 and 4
			return { ...state, harassment: validValue };
		},
		UPDATE_HATE: () => {
			const value = action.payload !== undefined ? Number( action.payload ) : 2;
			const validValue = isNaN( value ) ? 2 : Math.max( 0, Math.min( 4, Math.floor( value ) ) ); // Clamp between 0 and 4
			return { ...state, hate: validValue };
		},
		UPDATE_SEXUALLY_EXPLICIT: () => {
			const value = action.payload !== undefined ? Number( action.payload ) : 2;
			const validValue = isNaN( value ) ? 2 : Math.max( 0, Math.min( 4, Math.floor( value ) ) ); // Clamp between 0 and 4
			return { ...state, sexuallyExplicit: validValue };
		},
		UPDATE_DANGEROUS_CONTENT: () => {
			const value = action.payload !== undefined ? Number( action.payload ) : 2;
			const validValue = isNaN( value ) ? 2 : Math.max( 0, Math.min( 4, Math.floor( value ) ) ); // Clamp between 0 and 4
			return { ...state, dangerousContent: validValue };
		},
		UPDATE_POST_IDEAS: () => {
			// Convert any input to string format for consistent storage
			let stringValue = '';

			if ( Array.isArray( action.payload ) ) {
				// Convert array to newline-separated string
				stringValue = action.payload.filter( ( idea ) => idea && typeof idea === 'string' && idea.trim() ).join( '\n' );
			} else if ( typeof action.payload === 'string' ) {
				// Already a string, just sanitize
				stringValue = action.payload.trim();
			}

			return { ...state, postIdeas: stringValue };
		},
		UPDATE_CREATED_POST_IDEAS: () => {
			// Store created post ideas as an object mapping title to edit URL
			// Payload should be an object like { title: editUrl, ... }
			const createdPosts = action.payload && typeof action.payload === 'object' ? action.payload : {};
			return { ...state, createdPostIdeas: createdPosts };
		},
		ADD_CREATED_POST_IDEA: () => {
			// Add a single created post idea
			// Payload should be { title: string, editUrl: string }
			if ( ! action.payload || ! action.payload.title || ! action.payload.editUrl ) {
				console.warn( 'ADD_CREATED_POST_IDEA: Invalid payload', action.payload );
				return state;
			}
			const currentCreatedPosts = state.createdPostIdeas || {};
			return {
				...state,
				createdPostIdeas: {
					...currentCreatedPosts,
					[ action.payload.title ]: action.payload.editUrl,
				},
			};
		},
		UPDATE_TOKEN_TOTAL: () => ( { ...state, tokenTotal: Number( action.payload ) || 0 } ),
		UPDATE_TOKEN_REMAINING: () => ( { ...state, tokenRemaining: Number( action.payload ) || 0 } ),
		UPDATE_LICENSE_STATUS: () => ( { ...state, license_status: String( action.payload || 'inactive' ) } ),

		// Store connection (one-click connect).
		UPDATE_CONNECTED_EMAIL: () => ( { ...state, connectedEmail: String( action.payload || '' ) } ),
		UPDATE_PLAN: () => ( { ...state, plan: String( action.payload || '' ) } ),

		// Static configuration updates (rarely used but available if needed)
		UPDATE_HOME_SLUG: () => ( { ...state, homeSlug: String( action.payload || 'solvex-ai-blogger' ) } ),
		UPDATE_ADMIN_NONCE: () => ( { ...state, adminNonce: String( action.payload || '' ) } ),
		UPDATE_AJAX_URL: () => ( { ...state, ajaxUrl: String( action.payload || '' ) } ),
		UPDATE_EDIT_POST_LINK: () => ( { ...state, editPostLink: String( action.payload || '/wp-admin/post.php?post={{POST_ID}}&action=edit' ) } ),
		UPDATE_ALL_CAMPAIGNS: () => {
			const campaigns = action.payload && typeof action.payload === 'object' ? action.payload : {};
			return { ...state, allCampaigns: campaigns };
		},
		UPDATE_POSTMETA_DEFAULTS: () => {
			const defaults = action.payload && typeof action.payload === 'object' ? action.payload : {};
			return { ...state, postmetaDefaults: defaults };
		},
		UPDATE_LICENSING_NONCE: () => ( { ...state, licensingNonce: String( action.payload || '' ) } ),
		UPDATE_UPGRADE_LINK: () => ( { ...state, upgradeLink: String( action.payload || '#' ) } ),
		UPDATE_ADMIN_EMAIL: () => ( { ...state, adminEmail: String( action.payload || '' ) } ),
		UPDATE_ADMIN_APP_URL: () => ( { ...state, adminAppUrl: String( action.payload || '' ) } ),
		UPDATE_ADMIN_BASE_URL: () => ( { ...state, adminBaseUrl: String( action.payload || '' ) } ),
		UPDATE_PRO_PURCHASE_URL: () => ( { ...state, proPurchaseUrl: String( action.payload || 'https://wpaiblogger.com/' ) } ),
		UPDATE_PRO_AVAILABLE: () => ( { ...state, proAvailable: Boolean( action.payload ) } ),
		UPDATE_VERSION: () => ( { ...state, version: String( action.payload || '1.0.0' ) } ),
		UPDATE_PRO_VERSION: () => ( { ...state, proVersion: String( action.payload || '' ) } ),
		UPDATE_POST_TYPES: () => {
			const postTypes = action.payload && typeof action.payload === 'object' ? action.payload : {};
			return { ...state, postTypes };
		},

		// Notification settings
		UPDATE_EMAIL_NOTIFICATION_ENABLED: () => ( { ...state, emailNotificationEnabled: Boolean( action.payload ) } ),
		UPDATE_EMAIL_NOTIFICATION_VALUE: () => ( { ...state, emailNotificationValue: String( action.payload || '' ) } ),

		UPDATE_TOUR_COMPLETED: () => ( { ...state, tourCompleted: Boolean( action.payload ) } ),

		// Server-paginated campaigns list.
		// Suffixes deliberately avoid `_REQUEST/_SUCCESS/_FAILURE` so the
		// generic loading-state early-return at the top of this reducer
		// doesn't swallow these actions before the slice can update.
		CAMPAIGNS_LIST_START: () => ( { ...state, campaignsListLoading: true, campaignsListError: null } ),
		CAMPAIGNS_LIST_LOADED: () => {
			const payload = action.payload && typeof action.payload === 'object' ? action.payload : {};
			return {
				...state,
				campaignsList: payload.items || {},
				campaignsPagination: {
					page: Number( payload.page ) || 1,
					perPage: Number( payload.perPage ) || 20,
					total: Number( payload.total ) || 0,
					totalPages: Number( payload.totalPages ) || 0,
				},
				campaignsListLoading: false,
				campaignsListError: null,
			};
		},
		CAMPAIGNS_LIST_ERRORED: () => ( {
			...state,
			campaignsListLoading: false,
			campaignsListError: action.payload?.message || 'Failed to load campaigns',
		} ),
		CAMPAIGNS_LIST_UPDATE_ITEM: () => {
			if ( ! action.payload?.id ) {
				return state;
			}
			const id = String( action.payload.id );
			const next = { ...( state.campaignsList || {} ) };
			if ( next[ id ] ) {
				next[ id ] = { ...next[ id ], ...action.payload.changes };
			}
			return { ...state, campaignsList: next };
		},
		CAMPAIGNS_LIST_REMOVE_ITEM: () => {
			if ( ! action.payload?.id ) {
				return state;
			}
			const next = { ...( state.campaignsList || {} ) };
			delete next[ String( action.payload.id ) ];
			return { ...state, campaignsList: next };
		},

		CLEAR_ERROR: () => ( { ...state, error: null } ),
		STORE_ERROR: () => ( { ...state, error: action.payload?.message || 'Store error occurred', isLoading: false } ),
		RESET_STATE: () => {
			// Reset to minimal state since full initial state comes from WordPress localized data
			return {
				initialStateSetFlag: false,
				isLoading: false,
				error: 'State reset - please reload',
			};
		},
	};

	const handler = actionHandlers[ actionType ];
	if ( handler && typeof handler === 'function' ) {
		try {
			return handler();
		} catch ( error ) {
			console.error( `Error in reducer handler for ${ actionType }:`, error );
			return {
				...state,
				error: `Reducer error: ${ error.message }`,
			};
		}
	}

	// Unknown action type
	if ( process.env.NODE_ENV === 'development' ) {
		console.warn( `Unknown action type: ${ actionType }` );
	}

	return state;
};

export default globalDataReducer;
