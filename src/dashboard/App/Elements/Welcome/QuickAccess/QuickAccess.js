import React from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import LifeBuoy from 'lucide-react/dist/esm/icons/life-buoy';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Star from 'lucide-react/dist/esm/icons/star';
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
	{
		icon: Star,
		label: __( 'Enjoying AutoBlogging? Leave a Review', 'solvex-ai-blogger' ),
		url: 'https://wordpress.org/support/plugin/solvex-ai-blogger/reviews/#new-post',
	},
];

export default function QuickAccess() {
	const licenseStatus = useSelector( ( s ) => s.license_status ) || 'unlicensed';
	if ( licenseStatus !== 'licensed' ) {
		return null;
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-black/2">
			<header className="border-b border-border px-5 py-4">
				<h2 className="text-base font-semibold tracking-tight">
					{ __( 'Quick Access', 'solvex-ai-blogger' ) }
				</h2>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{ __( 'Get help and connect.', 'solvex-ai-blogger' ) }
				</p>
			</header>
			<ul className="divide-y divide-border">
				{ links.map( ( link ) => {
					const Icon = link.icon;
					return (
						<li key={ link.url } className="m-0">
							<a
								href={ link.url }
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-center justify-between gap-3 px-5 py-3 text-left no-underline transition-colors hover:bg-muted/40"
							>
								<span className="flex items-center gap-3 text-sm font-normal text-foreground">
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
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
