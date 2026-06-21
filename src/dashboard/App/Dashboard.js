import React from 'react';
import AppShell from './AppShell';
import PagesRoute from './PagesRoute';
import ErrorBoundary from '@Components/ErrorBoundary';
import TeachingBubbleManager from '@Components/TeachingBubbleManager';
import ApiErrorPanel from './ApiErrorPanel';

/**
 * Dashboard — wraps the SPA routes in the modern AppShell (header, tabs,
 * token counter, Toaster). Onboarding renders outside Dashboard, so AppShell
 * always applies here.
 *
 * TeachingBubbleManager provides the first-run guided tour (it points at
 * [data-tour-target] anchors in the AppShell/pages). ApiErrorPanel is the
 * global error side-panel driven by the `apiErrorPanel` redux state.
 */
const Dashboard = () => {
	return (
		<div className="solvex-ai-blogger-dashboard">
			<ErrorBoundary>
				<TeachingBubbleManager>
					<AppShell>
						<PagesRoute />
					</AppShell>
				</TeachingBubbleManager>
				<ApiErrorPanel />
			</ErrorBoundary>
		</div>
	);
};

export default Dashboard;
