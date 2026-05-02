import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Dialog, DialogPanel } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Trash2 } from 'lucide-react';
import apiFetch from '@wordpress/api-fetch';

const CampaignDeleteModal = ( { isOpen, onClose, campaignId, onDeleted } ) => {
	const [ open, setOpen ] = useState( isOpen );
	const [ deleting, setDeleting ] = useState( false );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		setOpen( isOpen );
		if ( ! isOpen ) {
			setError( null );
			setDeleting( false );
		}
	}, [ isOpen ] );

	const closeModal = () => {
		if ( ! deleting ) {
			setOpen( false );
			onClose();
		}
	};

	const handleDelete = async () => {
		if ( ! campaignId || deleting ) {
			return;
		}

		setDeleting( true );
		setError( null );

		try {
			const formData = new FormData();
			formData.append( 'action', 'wpsolvex_autoaiblogger_delete_campaign' );
			formData.append( 'security', wpsolvex_autoaiblogger_localized_data.admin_nonce );
			formData.append( 'campaign_id', campaignId );

			const response = await apiFetch( {
				url: wpsolvex_autoaiblogger_localized_data.ajax_url,
				method: 'POST',
				body: formData,
			} );

			if ( response.success ) {
				// Success - notify parent and close modal.
				if ( onDeleted ) {
					onDeleted( campaignId );
				}
				closeModal();

				// Show success message (you can customize this).
				if ( window.wp && window.wp.data ) {
					window.wp.data.dispatch( 'core/notices' ).createNotice(
						'success',
						__( 'Campaign deleted successfully.', 'solvex-ai-blogger' ),
						{ isDismissible: true }
					);
				}
			} else {
				setError( response.data?.message || __( 'Failed to delete campaign.', 'solvex-ai-blogger' ) );
			}
		} catch ( err ) {
			console.error( 'Delete campaign error:', err );
			setError( __( 'An error occurred while deleting the campaign.', 'solvex-ai-blogger' ) );
		} finally {
			setDeleting( false );
		}
	};

	return (
		<Dialog open={ open } onClose={ closeModal } className="relative z-[999999] ai-blogger-container">
			<div className="fixed inset-0 bg-black/50 transition-opacity" />

			<div className="fixed inset-0 z-[999999] w-screen overflow-y-auto">
				<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
					<DialogPanel
						transition
						className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
					>
						<div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
							<div className="sm:flex sm:items-start">
								<div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
									<ExclamationTriangleIcon aria-hidden="true" className="h-6 w-6 text-red-600" />
								</div>
								<div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
									<h3 className="text-base font-semibold text-gray-900 m-0">
										{ __( 'Delete Campaign', 'solvex-ai-blogger' ) }
									</h3>
									<div className="mt-2">
										<p className="text-sm text-gray-500 m-0">
											{ __( 'Are you sure you want to delete this campaign?', 'solvex-ai-blogger' ) }
										</p>
										{ error && (
											<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
												<p className="text-sm text-red-600 m-0">{ error }</p>
											</div>
										) }
									</div>
								</div>
							</div>
						</div>
						<div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
							<button
								type="button"
								onClick={ handleDelete }
								disabled={ deleting }
								className={ `inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto items-center ${
									deleting
										? 'bg-gray-400 cursor-not-allowed'
										: 'bg-red-600 hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
								}` }
							>
								{ deleting ? (
									<>
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{ __( 'Deleting…', 'solvex-ai-blogger' ) }
									</>
								) : (
									<>
										<Trash2 className="w-4 h-4 mr-1" />
										{ __( 'Delete Campaign', 'solvex-ai-blogger' ) }
									</>
								) }
							</button>
							<button
								type="button"
								onClick={ closeModal }
								disabled={ deleting }
								className={ `mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:mt-0 sm:w-auto ${
									deleting
										? 'opacity-50 cursor-not-allowed'
										: 'hover:bg-gray-50'
								}` }
							>
								{ __( 'Cancel', 'solvex-ai-blogger' ) }
							</button>
						</div>
					</DialogPanel>
				</div>
			</div>
		</Dialog>
	);
};

export default CampaignDeleteModal;
