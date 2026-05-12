/**
 * Tests for ProUpgradeCard — only renders when the site is unlicensed.
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import ProUpgradeCard from '../../src/dashboard/App/Elements/Welcome/ProUpgradeCard';

const makeStore = ( state ) =>
	createStore( ( s = state ) => s, state );

describe( 'ProUpgradeCard', () => {
	it( 'renders the upgrade CTA when license_status !== "licensed"', () => {
		const store = makeStore( {
			license_status: 'unlicensed',
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

	it( 'renders nothing when license_status === "licensed"', () => {
		const store = makeStore( {
			license_status: 'licensed',
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
			license_status: 'unlicensed',
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
