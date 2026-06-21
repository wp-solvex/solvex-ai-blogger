// Enhanced Welcome Elements module with direct imports (lazy loading handled at page level)
// Import components directly to avoid double lazy loading
import CampaignsInsights from './CampaignsInsights';
import PostIdeas from './PostIdeas/PostIdeas';
import QuickAccess from './QuickAccess/QuickAccess';
import TokenNotification from './TokenNotification';
import ProUpgradeCard from './ProUpgradeCard';
import WelcomeVideoCard from './WelcomeVideoCard';

// Component metadata for better organization
export const welcomeComponents = {
	CAMPAIGNS_INSIGHTS: {
		component: CampaignsInsights,
		name: 'CampaignsInsights',
		description: 'Dashboard insights showing campaign statistics and performance',
		category: 'analytics',
	},
	POST_IDEAS: {
		component: PostIdeas,
		name: 'PostIdeas',
		description: 'AI-generated blog post ideas and suggestions',
		category: 'content',
	},
	QUICK_ACCESS: {
		component: QuickAccess,
		name: 'QuickAccess',
		description: 'Quick access links to support, documentation and community',
		category: 'navigation',
	},
};

// Export individual components (maintaining backward compatibility)
export {
	CampaignsInsights,
	PostIdeas,
	QuickAccess,
	TokenNotification,
	ProUpgradeCard,
	WelcomeVideoCard,
};

// Export component list for dynamic rendering
export const components = Object.values( welcomeComponents );

// Export default for easier imports
export default {
	CampaignsInsights,
	PostIdeas,
	QuickAccess,
	welcomeComponents,
	components,
};
