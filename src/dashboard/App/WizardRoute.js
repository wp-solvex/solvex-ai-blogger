import React from 'react';
import { useLocation } from 'react-router-dom';
import { WelcomeStep, PersonaFormStep, LicenseStep, OptinStep, ReadyStep } from '@WizardSteps';
import { NavigationBar, FooterNavigationBar } from '@WizardFields';

const WizardRoute = () => {
	// Add a "solvex-ai-blogger-wizard" class to the body tag.
	document.body.classList.add( 'solvex-ai-blogger-wizard' );

	const query = new URLSearchParams( useLocation().search );
	const action = query.get( 'step' );
	const maxSteps = 4;

	let previous_step = 'dashboard',
		next_step = '',
		step_sequence = '';

	const get_route_page = () => {
		let route_page = '';

		switch ( action ) {
			case 'welcome':
				route_page = <WelcomeStep />;
				previous_step = 'dashboard';
				next_step = 'persona-form'; //change next step
				step_sequence = 0;
				break;
			case 'persona-form': //Add new case
				route_page = <PersonaFormStep />;
				previous_step = 'welcome';
				next_step = 'license';
				step_sequence = 1;
				break;
			case 'license': //Add new case
				route_page = <LicenseStep />;
				previous_step = 'persona-form';
				next_step = 'optin';
				step_sequence = 2;
				break;
			case 'optin':
				route_page = <OptinStep />;
				previous_step = 'license';
				next_step = 'ready';
				step_sequence = 3;
				break;
			case 'ready':
				route_page = <ReadyStep />;
				previous_step = 'optin';
				step_sequence = 4;
				break;
			default:
				route_page = <WelcomeStep />;
				next_step = 'persona-form'; //change next step
				step_sequence = 0;
				break;
		}

		return route_page;
	};

	return (
		<>
			<NavigationBar />

			<main className="relative bg-white">
				{ get_route_page() }
			</main>

			<FooterNavigationBar
				previousStep={ previous_step }
				nextStep={ next_step }
				currentStep={ step_sequence }
				maxSteps={ maxSteps }
			/>
		</>
	);
};

export default WizardRoute;
