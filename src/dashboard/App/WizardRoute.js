import React from 'react';
import { useLocation } from 'react-router-dom';
import { WelcomeStep, PersonaFormStep, LicenseStep } from '@WizardSteps';
import { NavigationBar, FooterNavigationBar } from '@WizardFields';

const WizardRoute = () => {
	// Add a "solvex-ai-blogger-wizard" class to the body tag.
	document.body.classList.add( 'solvex-ai-blogger-wizard' );

	const query = new URLSearchParams( useLocation().search );
	const action = query.get( 'step' );
	const maxSteps = 3;

	let previous_step = 'dashboard',
		next_step = '',
		step_sequence = '';

	const get_route_page = () => {
		let route_page = '';

		switch ( action ) {
			case 'welcome':
				route_page = <WelcomeStep />;
				previous_step = 'dashboard';
				next_step = 'license';
				step_sequence = 0;
				break;
			case 'license':
				route_page = <LicenseStep />;
				previous_step = 'welcome';
				next_step = 'persona-form';
				step_sequence = 1;
				break;
			case 'persona-form':
				route_page = <PersonaFormStep />;
				previous_step = 'license';
				next_step = '';
				step_sequence = 2;
				break;
			default:
				route_page = <WelcomeStep />;
				next_step = 'license';
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
