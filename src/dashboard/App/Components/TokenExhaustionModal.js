import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Dialog, DialogPanel } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';
import ProButton from '@Components/ProButton';

const UPGRADE_URL = 'https://wpaiblogger.com/pricing/';

const TokenExhaustionModal = ( { isOpen, onClose } ) => {
	const [ open, setOpen ] = useState( isOpen );

	useEffect( () => {
		setOpen( isOpen );
	}, [ isOpen ] );

	const closeModal = () => {
		setOpen( false );
		onClose();
	};

	return (
		<Dialog open={ open } onClose={ closeModal } className="relative z-[999999] ai-blogger-container">
			<div className="fixed inset-0 bg-black/50 transition-opacity" />

			<div className="fixed inset-0 z-[999999] w-screen overflow-y-auto">
				<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
					<DialogPanel
						transition
						className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-md data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
					>
						<button
							type="button"
							onClick={ closeModal }
							className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1"
							aria-label={ __( 'Close', 'solvex-ai-blogger' ) }
						>
							<X className="w-5 h-5" />
						</button>

						<div className="bg-white px-6 pt-8 pb-6">
							<div className="flex flex-col items-center text-center">
								<div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 mb-4">
									<AlertTriangle className="h-7 w-7 text-amber-600" aria-hidden="true" />
								</div>

								<h3 className="text-lg font-semibold text-gray-900 m-0 mb-2">
									{ __( 'Out of Free Tokens!', 'solvex-ai-blogger' ) }
								</h3>

								<p className="text-sm text-gray-500 m-0 mb-1 leading-relaxed">
									{ __( "You've used up your token allowance for this month.", 'solvex-ai-blogger' ) }
								</p>
								<p className="text-sm text-gray-500 m-0 leading-relaxed">
									{ __( 'Upgrade to Pro to continue generating high-quality posts and campaigns instantly, or wait for your monthly reset.', 'solvex-ai-blogger' ) }
								</p>
							</div>
						</div>

						<div className="bg-gray-50 px-6 py-4 flex flex-col gap-2 sm:flex-row-reverse">
							<ProButton
								url={ UPGRADE_URL }
								isLink
								size="default"
							/>
							<button
								type="button"
								onClick={ closeModal }
								className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
							>
								{ __( 'Close', 'solvex-ai-blogger' ) }
							</button>
						</div>
					</DialogPanel>
				</div>
			</div>
		</Dialog>
	);
};

export default TokenExhaustionModal;
