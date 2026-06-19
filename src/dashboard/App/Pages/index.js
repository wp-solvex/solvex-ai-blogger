// Enhanced Pages module exports with better organization
// Import page components directly (lazy loading handled at routing level)
import Welcome from './Welcome';
import Settings from './Settings';
import FreeVsPro from './FreeVsPro';
import Campaigns from './Campaigns';
import SearchConsole from './SearchConsole';

// Page metadata for better organization and routing
export const pageMetadata = {
	WELCOME: {
		component: Welcome,
		path: '/welcome',
		title: 'Welcome',
		description: 'Dashboard overview and insights',
		icon: 'home',
	},
	SETTINGS: {
		component: Settings,
		path: '/settings',
		title: 'Settings',
		description: 'Configure your AI Blogger settings',
		icon: 'settings',
	},
	FREE_VS_PRO: {
		component: FreeVsPro,
		path: '/free-vs-pro',
		title: 'Free vs Pro',
		description: 'Compare features and upgrade options',
		icon: 'compare',
	},
	CAMPAIGNS: {
		component: Campaigns,
		path: '/campaigns',
		title: 'Campaigns',
		description: 'Manage your blog campaigns',
		icon: 'campaigns',
	},
	SEARCH_CONSOLE: {
		component: SearchConsole,
		path: '/search-console',
		title: 'Search Console',
		description: 'Connect Google Search Console and track search performance',
		icon: 'search',
	},
};

// Export individual components (maintaining backward compatibility)
export {
	Welcome,
	Settings,
	FreeVsPro,
	Campaigns,
	SearchConsole,
};

// Export page list for routing and navigation
export const pages = Object.values( pageMetadata );

// Export default pages object for easier imports
export default {
	Welcome,
	Settings,
	FreeVsPro,
	Campaigns,
	SearchConsole,
	pageMetadata,
	pages,
};
