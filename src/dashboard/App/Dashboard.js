import React from 'react';
import AppShell from './AppShell';
import PagesRoute from './PagesRoute';
import ErrorBoundary from '@Components/ErrorBoundary';

/**
 * Dashboard — wraps the SPA routes in the modern AppShell (header, tabs,
 * token counter, Toaster). Onboarding renders outside Dashboard, so AppShell
 * always applies here.
 */
const Dashboard = () => {
	return (
		<div className="solvex-ai-blogger-dashboard">
			<ErrorBoundary>
				<AppShell>
					<PagesRoute />
				</AppShell>
			</ErrorBoundary>
		</div>
	);
};

export default Dashboard;
