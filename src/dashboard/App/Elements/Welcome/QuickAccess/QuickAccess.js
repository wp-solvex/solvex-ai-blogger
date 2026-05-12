import React from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import LifeBuoy from 'lucide-react/dist/esm/icons/life-buoy';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';

const links = [
	{
		icon: LifeBuoy,
		label: __( 'Open Support Ticket', 'solvex-ai-blogger' ),
		url: 'https://wpaiblogger.com/contact/',
	},
	{
		icon: BookOpen,
		label: __( 'Help Center', 'solvex-ai-blogger' ),
		url: 'https://wpaiblogger.com/docs/',
	},
	{
		icon: LayoutDashboard,
		label: __( 'Access Dashboard', 'solvex-ai-blogger' ),
		url: 'https://wpaiblogger.com/customer-dashboard/',
	},
];

export default function QuickAccess() {
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	if ( licenseStatus !== 'licensed' ) {
		return null;
	}

	return (
		<div>
			<h2 className="text-xl font-semibold tracking-tight">
				{ __( 'Quick Access', 'solvex-ai-blogger' ) }
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				{ __( 'Get help and connect.', 'solvex-ai-blogger' ) }
			</p>
			<div className="mt-5 grid gap-2">
				{ links.map( ( link ) => {
					const Icon = link.icon;
					return (
						<a
							key={ link.url }
							href={ link.url }
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left no-underline transition-all hover:border-brand/30"
						>
							<span className="flex items-center gap-3 text-sm font-medium text-foreground">
								<Icon
									className="size-4 text-muted-foreground transition-colors group-hover:text-brand"
									aria-hidden="true"
								/>
								{ link.label }
							</span>
							<ArrowUpRight
								className="size-3.5 text-muted-foreground/60 transition-colors group-hover:text-brand"
								aria-hidden="true"
							/>
						</a>
					);
				} ) }
			</div>
		</div>
	);
}
