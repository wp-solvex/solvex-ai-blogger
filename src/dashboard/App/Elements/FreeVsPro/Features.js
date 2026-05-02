import React, { memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { Check, X, Crown, BarChart3, Calendar, Sparkles, Target, Shield, Headphones } from 'lucide-react';

// Enhanced feature categories for better organization
export const FeatureCategories = {
	CONTENT: {
		id: 'content',
		label: __( 'Content Generation', 'solvex-ai-blogger' ),
		icon: <Sparkles className="w-5 h-5" />,
		description: __( 'AI-powered content creation capabilities', 'solvex-ai-blogger' ),
	},
	AUTOMATION: {
		id: 'automation',
		label: __( 'Automation & Scheduling', 'solvex-ai-blogger' ),
		icon: <Calendar className="w-5 h-5" />,
		description: __( 'Automated publishing and management features', 'solvex-ai-blogger' ),
	},
	SEO: {
		id: 'seo',
		label: __( 'SEO & Optimization', 'solvex-ai-blogger' ),
		icon: <Target className="w-5 h-5" />,
		description: __( 'Search engine optimization tools', 'solvex-ai-blogger' ),
	},
	ANALYTICS: {
		id: 'analytics',
		label: __( 'Analytics & Insights', 'solvex-ai-blogger' ),
		icon: <BarChart3 className="w-5 h-5" />,
		description: __( 'Performance tracking and analytics', 'solvex-ai-blogger' ),
	},
	SUPPORT: {
		id: 'support',
		label: __( 'Support & Updates', 'solvex-ai-blogger' ),
		icon: <Headphones className="w-5 h-5" />,
		description: __( 'Customer support and product updates', 'solvex-ai-blogger' ),
	},
};

// Enhanced features with better categorization and metadata
export const FeaturesList = [
	{
		id: 'ai-tokens',
		name: __( 'Content Generation Tokens', 'solvex-ai-blogger' ),
		category: 'content',
		free: __( '20,000 Tokens/month', 'solvex-ai-blogger' ),
		pro: __( '50,000+ Tokens/month', 'solvex-ai-blogger' ),
		description: __( 'Token allocation for AI content generation', 'solvex-ai-blogger' ),
		priority: 'high',
	},
	{
		id: 'blog-topics',
		name: __( 'Blog Post Suggestions', 'solvex-ai-blogger' ),
		category: 'content',
		free: __( 'Upto 5 Ideas', 'solvex-ai-blogger' ),
		pro: __( 'Unlimited Ideas', 'solvex-ai-blogger' ),
		description: __( 'AI-generated blog post ideas tailored to your niche', 'solvex-ai-blogger' ),
		priority: 'high',
	},
	{
		id: 'content-generation',
		name: __( 'Post Content Words', 'solvex-ai-blogger' ),
		category: 'content',
		free: __( 'Upto 1000 Words/post', 'solvex-ai-blogger' ),
		pro: __( 'Upto 5000 Words/post', 'solvex-ai-blogger' ),
		description: __( 'Full-length article generation with advanced AI models', 'solvex-ai-blogger' ),
		priority: 'high',
	},
	{
		id: 'content-images',
		name: __( 'Content Images', 'solvex-ai-blogger' ),
		category: 'content',
		free: __( '1 Image/post', 'solvex-ai-blogger' ),
		pro: __( 'Upto 5 Images/post', 'solvex-ai-blogger' ),
		description: __( 'Make AI content sound natural and engaging', 'solvex-ai-blogger' ),
		priority: 'medium',
	},
	{
		id: 'featured-image',
		name: __( 'Featured Image', 'solvex-ai-blogger' ),
		category: 'automation',
		free: 'yes',
		pro: 'yes',
		description: __( 'Automatically schedule and publish content', 'solvex-ai-blogger' ),
		priority: 'high',
	},
	{
		id: 'campaigns',
		name: __( 'Campaigns', 'solvex-ai-blogger' ),
		category: 'seo',
		free: __( 'Unlimited', 'solvex-ai-blogger' ),
		pro: __( 'Unlimited', 'solvex-ai-blogger' ),
		description: __( 'Target high-ranking keywords for better SEO', 'solvex-ai-blogger' ),
		priority: 'high',
	},

	// Automation Features
	{
		id: 'analytics',
		name: __( 'Analytics', 'solvex-ai-blogger' ),
		category: 'seo',
		free: __( 'Basic Campaign Analytics', 'solvex-ai-blogger' ),
		pro: __( 'Basic + AI Backed Campaign Analytics [Soon]', 'solvex-ai-blogger' ),
		description: __( 'Target high-ranking keywords for better SEO', 'solvex-ai-blogger' ),
		priority: 'high',
	},

	// Notification
	{
		id: 'notifications',
		name: __( 'Notifications', 'solvex-ai-blogger' ),
		category: 'notifications',
		free: __( 'Email Based', 'solvex-ai-blogger' ),
		pro: __( 'Email + WhatsApp [Soon]', 'solvex-ai-blogger' ),
		description: __( 'Get help when you need it most', 'solvex-ai-blogger' ),
		priority: 'medium',
	},

	// Support Features
	{
		id: 'support',
		name: __( 'Support', 'solvex-ai-blogger' ),
		category: 'support',
		free: __( 'Free Basic Support', 'solvex-ai-blogger' ),
		pro: __( 'One Year Premium Support', 'solvex-ai-blogger' ),
		description: __( 'Get help when you need it most', 'solvex-ai-blogger' ),
		priority: 'medium',
	},
	{
		id: 'updates',
		name: __( 'Updates & Features', 'solvex-ai-blogger' ),
		category: 'support',
		free: __( 'Free Product Updates', 'solvex-ai-blogger' ),
		pro: __( 'One Year Premium Updates', 'solvex-ai-blogger' ),
		description: __( 'Access to the latest features and improvements', 'solvex-ai-blogger' ),
		priority: 'low',
	},
];

// Enhanced feature comparison component.
export const FeatureComparisonTable = memo( () => {
	// Group features by category
	const featuresByCategory = useMemo( () => {
		const grouped = {};
		FeaturesList.forEach( ( feature ) => {
			if ( ! grouped[ feature.category ] ) {
				grouped[ feature.category ] = [];
			}
			grouped[ feature.category ].push( feature );
		} );
		return grouped;
	}, [] );

	// Feature status component
	const FeatureStatus = memo( ( { status, isProColumn = false } ) => {
		const getStatusDisplay = useMemo( () => {
			if ( status === 'yes' ) {
				return {
					icon: <Check className="w-4 h-4 text-green-600" />,
					text: __( 'Included', 'solvex-ai-blogger' ),
					className: 'text-green-600 bg-green-50 border-green-200',
				};
			}

			if ( status === 'no' ) {
				return {
					icon: <X className="w-4 h-4 text-red-500" />,
					text: __( 'Not included', 'solvex-ai-blogger' ),
					className: 'text-red-500 bg-red-50 border-red-200',
				};
			}

			// Custom status (like "Limited", "5 per month", etc.)
			return {
				icon: isProColumn ? <Crown className="w-4 h-4 text-amber-600" /> : <Shield className="w-4 h-4 text-blue-600" />,
				text: status,
				className: isProColumn ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-blue-700 bg-blue-50 border-blue-200',
			};
		}, [ status, isProColumn ] );

		return (
			<div className={ `inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${ getStatusDisplay.className }` }>
				{ getStatusDisplay.icon }
				<span>{ getStatusDisplay.text }</span>
			</div>
		);
	} );

	FeatureStatus.displayName = 'FeatureStatus';

	return (
		<div className="space-y-8">
			{ Object.entries( featuresByCategory ).map( ( [ categoryId, features ] ) => {
				const category = FeatureCategories[ categoryId.toUpperCase() ];
				if ( ! category ) {
					return null;
				}

				return (
					<div key={ categoryId } className="bg-white border border-gray-200 rounded-lg overflow-hidden">
						{ /* Category header */ }
						<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-white rounded-lg border border-gray-200">
									{ category.icon }
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										{ category.label }
									</h3>
									<p className="text-sm text-gray-600">
										{ category.description }
									</p>
								</div>
							</div>
						</div>

						{ /* Features table */ }
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gradient-to-r from-brand-50 to-indigo-50">
									<tr>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											{ __( 'Feature', 'solvex-ai-blogger' ) }
										</th>
										<th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											{ __( 'Free Version', 'solvex-ai-blogger' ) }
										</th>
										<th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											{ __( 'Pro Version', 'solvex-ai-blogger' ) }
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{ features.map( ( feature ) => (
										<tr key={ feature.id } className="hover:bg-gray-50 transition-colors duration-150">
											<td className="px-6 py-4">
												<div>
													<div className="text-sm font-medium text-gray-900">
														{ feature.name }
													</div>
													<div className="text-sm text-gray-500">
														{ feature.description }
													</div>
												</div>
											</td>
											<td className="px-6 py-4 text-center">
												<FeatureStatus status={ feature.free } isProColumn={ false } />
											</td>
											<td className="px-6 py-4 text-center">
												<FeatureStatus status={ feature.pro } isProColumn={ true } />
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</div>
					</div>
				);
			} ) }
		</div>
	);
} );

FeatureComparisonTable.displayName = 'FeatureComparisonTable';

// Enhanced features for backward compatibility (legacy format)
export const Features = FeaturesList.map( ( feature ) => ( {
	name: feature.name,
	free: feature.free,
	pro: feature.pro,
	description: feature.description,
	category: feature.category,
	priority: feature.priority,
} ) );

// Export default as the comparison table
export default FeatureComparisonTable;
