import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@Components/ui/dialog';
import { Button } from '@Components/ui/button';
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

	const handleOpenChange = ( next ) => {
		if ( ! next ) {
			closeModal();
		}
	};

	return (
		<Dialog open={ open } onOpenChange={ handleOpenChange }>
			<DialogContent className="ai-blogger-container z-[999999] max-w-md rounded-xl border border-border bg-card p-6">
				<DialogHeader className="items-center text-center sm:text-center">
					<div className="mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
						<AlertTriangle className="size-7" aria-hidden="true" />
					</div>

					<DialogTitle className="text-foreground">
						{ __( 'Out of Free Tokens!', 'solvex-ai-blogger' ) }
					</DialogTitle>

					<DialogDescription className="text-muted-foreground">
						{ __(
							"You've used up your token allowance for this month.",
							'solvex-ai-blogger'
						) }
					</DialogDescription>
					<DialogDescription className="text-muted-foreground">
						{ __(
							'Upgrade to Pro to continue generating high-quality posts and campaigns instantly, or wait for your monthly reset.',
							'solvex-ai-blogger'
						) }
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="gap-2 sm:justify-center">
					<Button type="button" variant="outline" onClick={ closeModal }>
						{ __( 'Close', 'solvex-ai-blogger' ) }
					</Button>
					<ProButton url={ UPGRADE_URL } isLink size="default" />
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default TokenExhaustionModal;
