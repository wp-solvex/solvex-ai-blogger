import React, { memo } from 'react';
import { __ } from '@wordpress/i18n';
import SettingsContainer from '@Components/SettingsContainer';

// Import the Persona component directly to avoid double lazy loading.
import { Persona } from '@Elements/Settings/Group';

// Enhanced General settings component.
const General = memo( () => {
	return (
		<main
			className="space-y-6"
			role="main"
			aria-labelledby="general-settings-heading"
		>
			{ /* Settings content */ }
			<section aria-labelledby="persona-section-heading">
				<SettingsContainer
					element={ <Persona /> }
					className="bg-white shadow-sm rounded-lg border border-gray-200"
				/>
			</section>

			{ /* Screen reader navigation summary */ }
			<div className="sr-only" aria-live="polite">
				{ __( 'General settings page loaded with persona configuration options', 'auto-ai-blogger' ) }
			</div>
		</main>
	);
} );

General.displayName = 'GeneralSettings';

export default General;
