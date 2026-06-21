/**
 * Tests for ProUpgradeCard — only renders when the Pro plugin is inactive.
 *
 * Free-licensed users still see the upsell; the gate flips to hidden
 * only after the paid Pro plugin is installed and activated
 * (`proAvailable === true`).
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import ProUpgradeCard from '../../src/dashboard/App/Elements/Welcome/ProUpgradeCard';

const makeStore = ( state ) =>
	createStore( ( s = state ) => s, state );

describe( 'ProUpgradeCard', () => {
	it( 'renders the upgrade CTA when proAvailable is false', () => {
		const store = makeStore( {
			proAvailable: false,
			upgradeLink: 'https://example.test/upgrade',
		} );
		render(
			<Provider store={ store }>
				<ProUpgradeCard />
			</Provider>
		);
		const card = screen.getByTestId( 'pro-upgrade-card' );
		expect( card ).toBeInTheDocument();
		expect( card ).toHaveAttribute( 'href', 'https://example.test/upgrade' );
		expect( screen.getByText( /Pro plan/i ) ).toBeInTheDocument();
	} );

	it( 'still renders for free-licensed users while Pro plugin is inactive', () => {
		const store = makeStore( {
			license_status: 'licensed',
			proAvailable: false,
			upgradeLink: 'https://example.test/upgrade',
		} );
		render(
			<Provider store={ store }>
				<ProUpgradeCard />
			</Provider>
		);
		expect( screen.getByTestId( 'pro-upgrade-card' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing when the Pro plugin is active', () => {
		const store = makeStore( {
			proAvailable: true,
			upgradeLink: 'https://example.test/upgrade',
		} );
		const { container } = render(
			<Provider store={ store }>
				<ProUpgradeCard />
			</Provider>
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'falls back to proPurchaseUrl when upgradeLink is missing', () => {
		const store = makeStore( {
			proAvailable: false,
			upgradeLink: '',
			proPurchaseUrl: 'https://example.test/pro',
		} );
		render(
			<Provider store={ store }>
				<ProUpgradeCard />
			</Provider>
		);
		expect( screen.getByTestId( 'pro-upgrade-card' ) ).toHaveAttribute(
			'href',
			'https://example.test/pro'
		);
	} );
} );
