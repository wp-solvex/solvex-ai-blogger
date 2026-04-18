import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
	TrendingUp,
	MessageSquare,
	Trophy,
	Crown,
	Zap,
	BarChart3,
	CheckCircle,
	Eye,
} from 'lucide-react';
import apiFetch from '@wordpress/api-fetch';

const CampaignAnalyticsModal = ( { isOpen, onClose, campaignId, campaignData } ) => {
	const [ analyticsData, setAnalyticsData ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ open, setOpen ] = useState( isOpen );

	useEffect( () => {
		setOpen( isOpen );
		if ( isOpen && campaignId ) {
			fetchAnalyticsData();
		}
	}, [ isOpen, campaignId ] );

	const closeModal = () => {
		setOpen( false );
		onClose();
	};

	const fetchAnalyticsData = async () => {
		setLoading( true );
		setError( null );

		try {
			const formData = new FormData();
			formData.append( 'action', 'autoaib_get_campaign_analytics' );
			formData.append( 'security', autoaib_localized_data.admin_nonce );
			formData.append( 'campaign_id', campaignId );

			const response = await apiFetch( {
				url: autoaib_localized_data.ajax_url,
				method: 'POST',
				body: formData,
			} );

			if ( response.success ) {
				setAnalyticsData( response.data );
			} else {
				setError( response.data || __( 'Failed to fetch analytics data', 'auto-ai-blogger' ) );
			}
		} catch ( err ) {
			console.error( 'Analytics fetch error:', err );
			setError( __( 'Error fetching analytics data', 'auto-ai-blogger' ) );
		} finally {
			setLoading( false );
		}
	};

	const formatNumber = ( num ) => {
		if ( num >= 1000000 ) {
			return ( num / 1000000 ).toFixed( 1 ) + 'M';
		}
		if ( num >= 1000 ) {
			return ( num / 1000 ).toFixed( 1 ) + 'K';
		}
		return num?.toString() || '0';
	};

	const onUpgradePro = ( e ) => {
		if ( autoaib_localized_data.pro_available ) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		window.open( autoaib_localized_data.pro_purchase_url, '_blank' );
	};

	return (
		<Dialog open={ open } onClose={ closeModal } className="relative z-[999999] ai-blogger-container">
			<div className="fixed inset-0 bg-black/50 transition-opacity" />

			<div className="fixed inset-0 z-[999999] w-screen overflow-y-auto">
				<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
					<DialogPanel
						transition
						className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-4xl data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
					>
						{ /* Header */ }
						<div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-200">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-brand-100 rounded-lg flex">
									<BarChart3 className="w-5 h-5 text-brand-600" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900 m-0">
										{ __( 'Campaign Analytics', 'auto-ai-blogger' ) }
									</h3>
									<p className="text-sm text-gray-600 m-0">
										{ campaignData?.name || __( 'Campaign', 'auto-ai-blogger' ) }
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={ closeModal }
								className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 p-2"
							>
								<XMarkIcon className="h-6 w-6 flex" />
							</button>
						</div>

						{ /* Content */ }
						<div className="px-6 py-4">
							<div className="flex-1 overflow-y-auto">
								{ loading ? (
									<div className="flex items-center justify-center py-12">
										<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
										<span className="ml-3 text-gray-600">{ __( 'Loading analytics…', 'auto-ai-blogger' ) }</span>
									</div>
								) : error ? (
									<div className="text-center py-12">
										<div className="text-red-500 mb-2">{ error }</div>
										<button
											onClick={ fetchAnalyticsData }
											className="text-indigo-600 hover:text-indigo-500 text-sm p-2 rounded border border-indigo-200 hover:border-indigo-300 transition-colors"
										>
											{ __( 'Try again', 'auto-ai-blogger' ) }
										</button>
									</div>
								) : (
									<div className="space-y-6">
										{ /* Top Stats */ }
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											{ /* Published Posts */ }
											<div className="bg-gradient-to-r from-brand-50 to-indigo-50 p-4 rounded-lg border border-brand-200">
												<div className="flex items-center justify-between">
													<div className="flex flex-col gap-2">
														<p className="text-sm font-medium text-brand-600 m-0">{ __( 'Created Posts', 'auto-ai-blogger' ) }</p>
														<p className="text-2xl font-bold text-brand-900 m-0">{ analyticsData?.publishedPosts || campaignData?.postsCreated || 0 }</p>
													</div>
													<TrendingUp className="w-6 h-6 text-brand-500" />
												</div>
											</div>

											{ /* Total Visits */ }
											<div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
												<div className="flex items-center justify-between">
													<div className="flex flex-col gap-2">
														<p className="text-sm font-medium text-blue-600 m-0">{ __( 'Total Visits', 'auto-ai-blogger' ) }</p>
														<p className="text-2xl font-bold text-blue-900 m-0">{ formatNumber( analyticsData?.totalViews || campaignData?.postsVisit || 0 ) }</p>
													</div>
													<Eye className="w-6 h-6 text-blue-500" />
												</div>
											</div>

											{ /* Success Rate */ }
											<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
												<div className="flex items-center justify-between">
													<div className="flex flex-col gap-2">
														<p className="text-sm font-medium text-green-600 m-0">{ __( 'Success Rate', 'auto-ai-blogger' ) }</p>
														<p className="text-2xl font-bold text-green-900 m-0">{ analyticsData?.successRate || '95' }%</p>
													</div>
													<CheckCircle className="w-6 h-6 text-green-500" />
												</div>
											</div>

											{ /* Comments */ }
											<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
												<div className="flex items-center justify-between">
													<div className="flex flex-col gap-2">
														<p className="text-sm font-medium text-purple-600 m-0">{ __( 'Total Comments', 'auto-ai-blogger' ) }</p>
														<p className="text-2xl font-bold text-purple-900 m-0">{ formatNumber( analyticsData?.totalComments || 0 ) }</p>
													</div>
													<MessageSquare className="w-6 h-6 text-purple-500" />
												</div>
											</div>
										</div>

										{ /* Top Performing Posts */ }
										<div className="bg-white border border-gray-200 rounded-lg p-4">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center">
													<Trophy className="w-4 h-4 text-yellow-600 mr-2" />
													<h4 className="text-base font-semibold text-gray-900 m-0">{ __( 'Top Performing Posts', 'auto-ai-blogger' ) }</h4>
												</div>
												<span className="text-xs text-gray-500">{ __( 'By views', 'auto-ai-blogger' ) }</span>
											</div>

											<div className="space-y-2">
												{ analyticsData?.topPosts?.length > 0 ? (
													analyticsData.topPosts.slice( 0, 3 ).map( ( post, index ) => (
														<div key={ post.id } className="flex items-center justify-between p-2 bg-gray-50 rounded">
															<div className="flex items-center space-x-2">
																<span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
																	{ index + 1 }
																</span>
																<div className="min-w-0 flex flex-col flex-1 gap-1">
																	<p className="text-xs font-medium text-gray-900 truncate m-0">{ post.title }</p>
																	<p className="text-xs text-gray-500 m-0">{ post.date }</p>
																</div>
															</div>
															<div className="text-right flex flex-col gap-1">
																<p className="text-xs font-medium text-gray-900 m-0">{ formatNumber( post.views ) }</p>
																<p className="text-xs text-gray-500 m-0">{ __( 'views', 'auto-ai-blogger' ) }</p>
															</div>
														</div>
													) )
												) : (
													<div className="text-center py-4">
														<Trophy className="w-6 h-6 text-gray-300 mx-auto mb-1" />
														<p className="text-gray-500 text-xs">{ __( 'No posts data available yet', 'auto-ai-blogger' ) }</p>
													</div>
												) }
											</div>
										</div>

										{ /* Pro Upgrade CTA */ }
										<div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-3">
													<div className="p-2 bg-white bg-opacity-20 rounded-lg flex">
														<Crown className="w-5 h-5 text-white" />
													</div>
													<div>
														<h4 className="text-base font-bold m-0">{ __( 'Get more features with Pro', 'auto-ai-blogger' ) }</h4>
														<p className="text-indigo-100 text-sm m-0">
															{ __( 'Unlock premium tools, advanced controls, and more automation.', 'auto-ai-blogger' ) }
														</p>
													</div>
												</div>
												<button className="bg-white text-indigo-600 px-4 py-2 rounded font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-1 text-sm" onClick={ onUpgradePro }>
													<Zap className="w-4 h-4" />
													<span>
														{
															autoaib_localized_data.pro_available ? __( 'Soon', 'auto-ai-blogger' ) : __( 'Upgrade', 'auto-ai-blogger' )
														}
													</span>
												</button>
											</div>

											<div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
												<div className="flex items-center space-x-1">
													<CheckCircle className="w-4 h-4 text-green-300" />
													<span className="text-sm">{ __( 'Unlimited Ideas', 'auto-ai-blogger' ) }</span>
												</div>
												<div className="flex items-center justify-center space-x-1">
													<CheckCircle className="w-4 h-4 text-green-300" />
													<span className="text-sm">{ __( 'More tokens', 'auto-ai-blogger' ) }</span>
												</div>
												<div className="flex items-center justify-end space-x-1">
													<CheckCircle className="w-4 h-4 text-green-300" />
													<span className="text-sm">{ __( 'Up to 5000 words per post', 'auto-ai-blogger' ) }</span>
												</div>
											</div>
										</div>
									</div>
								) }
							</div>
						</div>
					</DialogPanel>
				</div>
			</div>
		</Dialog>
	);
};

export default CampaignAnalyticsModal;
