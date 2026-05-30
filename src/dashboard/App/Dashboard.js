import React from 'react';
import MainNav from './MainNav';
import PagesRoute from './PagesRoute';
import SettingsSavedNotification from './SettingsSavedNotification';
import ErrorBoundary from '@Components/ErrorBoundary';
import TeachingBubbleManager from '@Components/TeachingBubbleManager';

/**
 * Enhanced Dashboard component with error handling and performance optimization
 */
const Dashboard = () => {
	return (
		<div className="solvex-ai-blogger-dashboard" role="main">
			<ErrorBoundary>
				<TeachingBubbleManager>
					<MainNav />
					<SettingsSavedNotification />
					<PagesRoute />
				</TeachingBubbleManager>
			</ErrorBoundary>
		</div>
	);
};

export default Dashboard;
