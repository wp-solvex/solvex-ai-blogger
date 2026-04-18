import React from 'react';
import MainNav from './MainNav';
import PagesRoute from './PagesRoute';
import SettingsSavedNotification from './SettingsSavedNotification';
import ErrorBoundary from '@Components/ErrorBoundary';

/**
 * Enhanced Dashboard component with error handling and performance optimization
 */
const Dashboard = () => {
	return (
		<div className="auto-ai-blogger-dashboard" role="main">
			<ErrorBoundary>
				<MainNav />
				<SettingsSavedNotification />
				<PagesRoute />
			</ErrorBoundary>
		</div>
	);
};

export default Dashboard;
