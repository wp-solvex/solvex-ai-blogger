import React, { memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { Features } from '../Elements/FreeVsPro/Features';
import ProButton from '@Components/ProButton';
import { Sprout, Check, X, Star, Zap, LifeBuoy, Crown } from 'lucide-react';
import { useSelector } from 'react-redux';

// Enhanced status icon component with better accessibility
const StatusIcon = memo( ( { value, label } ) => {
	const iconConfig = useMemo( () => {
		switch ( value ) {
			case 'yes':
				return {
					icon: <Check className="w-6 h-6 p-1 text-green-600" aria-hidden="true" />,
					className: 'text-green-600 bg-green-50 border-green-200',
					label: __( 'Available', 'solvex-ai-blogger' ),
				};
			case 'no':
				return {
					icon: <X className="w-6 h-6 p-1 text-red-500" aria-hidden="true" />,
					className: 'text-red-500 bg-red-50 border-red-200',
					label: __( 'Not available', 'solvex-ai-blogger' ),
				};
			default:
				return {
					icon: <span className="text-sm font-medium">{ value }</span>,
					className: 'text-gray-600',
					label: typeof value === 'string' ? value : __( 'Custom', 'solvex-ai-blogger' ),
				};
		}
	}, [ value ] );

	return (
		<div
			className={ `inline-flex items-center justify-center rounded-full border-2 ${ iconConfig.className }` }
			aria-label={ `${ label }: ${ iconConfig.label }` }
			title={ iconConfig.label }
		>
			{ iconConfig.icon }
		</div>
	);
} );

StatusIcon.displayName = 'StatusIcon';

// Enhanced feature row component with better structure
const FeatureRow = memo( ( { feature, index } ) => {
	const isEvenRow = index % 2 === 0;

	return (
		<tr
			className={ `${ isEvenRow ? 'bg-white' : 'bg-gray-50' } hover:bg-blue-50 transition-colors duration-150` }
			role="row"
		>
			<td
				className="py-4 pl-4 pr-3 text-sm text-gray-900 font-medium sm:pl-8"
				role="rowheader"
			>
				<div className="flex items-center gap-2">
					<span>{ feature.name }</span>
					{ feature.isPremium && (
						<Star className="w-4 h-4 text-yellow-500" aria-label={ __( 'Premium feature', 'solvex-ai-blogger' ) } />
					) }
				</div>
			</td>
			<td className="px-3 py-4 text-center" role="gridcell">
				<StatusIcon value={ feature.free } label={ `${ feature.name } - ${ __( 'Free version', 'solvex-ai-blogger' ) }` } />
			</td>
			<td className="px-3 py-4 text-center" role="gridcell">
				<StatusIcon value={ feature.pro } label={ `${ feature.name } - ${ __( 'Pro version', 'solvex-ai-blogger' ) }` } />
			</td>
		</tr>
	);
} );

FeatureRow.displayName = 'FeatureRow';

// Enhanced CTA section component.
const CallToActionSection = memo( () => {
	// Get pro purchase URL from Redux store
	const proPurchaseUrl = useSelector( ( state ) => state.proPurchaseUrl );

	return (
		<section
			className="mt-8 py-12 px-6 bg-gradient-to-r from-brand-50 to-indigo-50 border border-indigo-200 rounded-xl shadow-lg"
			aria-labelledby="cta-heading"
		>
			<div className="flex flex-col items-center text-center">
				{ /* Enhanced icon with animation */ }
				<div className="relative">
					<div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
					<div className="relative bg-green-500 p-4 rounded-full">
						<Sprout className="w-8 h-8 text-white flex" aria-hidden="true" />
					</div>
				</div>

				{ /* Enhanced heading with better typography */ }
				<h2 id="cta-heading" className="text-3xl font-bold text-gray-900 mb-4 max-w-2xl">
					{ __( 'Let AI Run Your Blog - You Focus on Growth', 'solvex-ai-blogger' ) }
				</h2>

				{ /* Enhanced description with benefits */ }
				<div className="max-w-2xl space-y-3 mb-4">
					<p className="text-lg text-gray-700">
						{ __( 'Unlock all the features and take your blog to the next level with AI Blogger Pro.', 'solvex-ai-blogger' ) }
					</p>
					<div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
						<span className="flex items-center gap-1">
							<Zap className="w-4 h-4 text-yellow-500" aria-hidden="true" />
							{ __( 'Advanced AI Features', 'solvex-ai-blogger' ) }
						</span>
						<span className="flex items-center gap-1">
							<LifeBuoy className="w-4 h-4 text-green-500" aria-hidden="true" />
							{ __( 'Priority Support', 'solvex-ai-blogger' ) }
						</span>
						<span className="flex items-center gap-1">
							<Star className="w-4 h-4 text-yellow-500" aria-hidden="true" />
							{ __( 'AI Driven Analytics', 'solvex-ai-blogger' ) }
						</span>
					</div>
				</div>

				{ /* Enhanced CTA button */ }
				<ProButton url={ proPurchaseUrl } />

				{ /* Additional trust signals */ }
				<p className="force-mt-4 text-xs text-gray-500">
					{ __( '14-day Money-back Guarantee • Cancel Anytime • Instant Activation', 'solvex-ai-blogger' ) }
				</p>
			</div>
		</section>
	);
} );

CallToActionSection.displayName = 'CallToActionSection';

const FreeVsPro = () => {
	// Memoize features to prevent unnecessary re-renders.
	const memoizedFeatures = useMemo( () => Features || [], [] );

	// Get pro purchase URL from Redux store
	const proPurchaseUrl = useSelector( ( state ) => state.proPurchaseUrl );

	return (
		<div className="px-4 sm:px-6 lg:px-8 py-8">
			{ /* Enhanced header with statistics */ }
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex-1">
					<h2 id="free-vs-pro-heading" className="text-xl font-bold text-gray-900 p-0 m-0">
						{ __( 'Free vs Pro', 'solvex-ai-blogger' ) }
					</h2>
				</div>
				<div className="flex-shrink-0">
					<ProButton url={ proPurchaseUrl } />
				</div>
			</div>

			{ /* Enhanced comparison table with better accessibility */ }
			<div className="mt-6 flex flex-col">
				<div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
						<div className="overflow-hidden ring-1 ring-black/5 sm:rounded-xl">
							<table
								className="w-full divide-y divide-gray-300"
								role="table"
								aria-label={ __( 'Feature comparison between Free and Pro plans', 'solvex-ai-blogger' ) }
								aria-describedby="table-description"
							>
								<caption className="sr-only" id="table-description">
									{ __( 'Detailed comparison of features available in Free and Pro versions of AI Blogger', 'solvex-ai-blogger' ) }
								</caption>

								<thead className="bg-gradient-to-r from-brand-50 to-indigo-50">
									<tr role="row">
										<th
											scope="col"
											className="py-4 pl-4 pr-3 text-left text-base font-semibold text-gray-900 sm:pl-8"
											role="columnheader"
										>
											{ __( 'Features', 'solvex-ai-blogger' ) }
										</th>
										<th
											scope="col"
											className="px-3 py-4 text-center text-base font-semibold text-gray-900"
											role="columnheader"
										>
											<div className="flex flex-col items-center gap-1">
												<span>{ __( 'Free', 'solvex-ai-blogger' ) }</span>
												<span className="text-xs font-normal text-gray-600">
													{ __( '$0/month', 'solvex-ai-blogger' ) }
												</span>
											</div>
										</th>
										<th
											scope="col"
											className="px-3 py-4 text-center text-base font-semibold text-gray-900"
											role="columnheader"
										>
											<div className="flex flex-col items-center gap-1">
												<span className="flex items-center gap-1">
													{ __( 'Premium', 'solvex-ai-blogger' ) }
													<Crown className="w-4 h-4 text-[#9138c8]" aria-hidden="true" />
												</span>
												<span className="text-xs font-normal text-gray-600">
													{ __( 'Starting at $3.99/month', 'solvex-ai-blogger' ) }
												</span>
											</div>
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-gray-200 bg-white">
									{ memoizedFeatures.map( ( feature, index ) => (
										<FeatureRow key={ `feature-${ index }` } feature={ feature } index={ index } />
									) ) }
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			{ /* Enhanced call-to-action section */ }
			<CallToActionSection />
		</div>
	);
};

// Add display name for debugging
FreeVsPro.displayName = 'FreeVsPro';

export default memo( FreeVsPro );
