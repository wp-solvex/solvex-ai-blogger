import { createRoot } from 'react-dom/client';
import './MainApp.scss';
import { Provider } from 'react-redux';
import globalDataStore from '@AdminRoot/store/globalDataStore';
import Entry from '@DashboardApp/Entry';
import ErrorBoundary from '@Components/ErrorBoundary';
import { BrowserRouter as Router } from 'react-router-dom';

const currentState = globalDataStore.getState();

// Since all initial state is already set from localized data, just mark the flag as set
if ( ! currentState.initialStateSetFlag ) {
	globalDataStore.dispatch( {
		type: 'UPDATE_INITIAL_STATE_FLAG',
		payload: true,
	} );
}

const container = document.getElementById( 'solvex-ai-blogger-main-page--wrapper' );

if ( container ) {
	const root = createRoot( container );

	root.render(
		<ErrorBoundary>
			<Provider store={ globalDataStore }>
				<Router>
					<Entry />
				</Router>
			</Provider>
		</ErrorBoundary>
	);
}
