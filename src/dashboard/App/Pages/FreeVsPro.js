import React, { memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Star from 'lucide-react/dist/esm/icons/star';
import Zap from 'lucide-react/dist/esm/icons/zap';
import LifeBuoy from 'lucide-react/dist/esm/icons/life-buoy';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sprout from 'lucide-react/dist/esm/icons/sprout';
import { Features } from '../Elements/FreeVsPro/Features';
import ProButton from '@Components/ProButton';
import { cn } from '@Utils/cn';

const StatusIcon = memo( ( { value, label } ) => {
	if ( value === 'yes' ) {
		return (
			<span
				className="inline-flex size-7 items-center justify-center rounded-full bg-[oklch(0.95_0.05_155)] text-[oklch(0.4_0.16_155)]"
				aria-label={ `${ label }: ${ __( 'Available', 'solvex-ai-blogger' ) }` }
				title={ __( 'Available', 'solvex-ai-blogger' ) }
			>
				<Check className="size-4" aria-hidden="true" />
			</span>
		);
	}
	if ( value === 'no' ) {
		return (
			<span
				className="inline-flex size-7 items-center justify-center rounded-full bg-destructive/10 text-destructive"
				aria-label={ `${ label }: ${ __( 'Not available', 'solvex-ai-blogger' ) }` }
				title={ __( 'Not available', 'solvex-ai-blogger' ) }
			>
				<X className="size-4" aria-hidden="true" />
			</span>
		);
	}
	return (
		<span
			className="inline-flex items-center justify-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
			aria-label={ `${ label }: ${ value }` }
		>
			{ value }
		</span>
	);
} );
StatusIcon.displayName = 'StatusIcon';

const FeatureRow = memo( ( { feature, isLast } ) => (
	<tr className={ cn( ! isLast && 'border-b border-border' ) }>
		<th
			scope="row"
			className="px-6 py-4 text-left text-sm font-medium text-foreground"
		>
			<div className="flex items-center gap-2">
				<span>{ feature.name }</span>
				{ feature.isPremium && (
					<Star className="size-4 text-brand" aria-label={ __( 'Premium feature', 'solvex-ai-blogger' ) } />
				) }
			</div>
		</th>
		<td className="px-6 py-4 text-center">
			<StatusIcon value={ feature.free } label={ `${ feature.name } — ${ __( 'Free', 'solvex-ai-blogger' ) }` } />
		</td>
		<td className="px-6 py-4 text-center">
			<StatusIcon value={ feature.pro } label={ `${ feature.name } — ${ __( 'Pro', 'solvex-ai-blogger' ) }` } />
		</td>
	</tr>
) );
FeatureRow.displayName = 'FeatureRow';

const CallToActionSection = memo( () => {
	const proPurchaseUrl = useSelector( ( state ) => state.proPurchaseUrl );

	return (
		<section
			className="mt-10 overflow-hidden rounded-2xl border border-brand/20 bg-brand-soft/60 p-10 ring-1 ring-black/[0.02]"
			aria-labelledby="cta-heading"
		>
			<div className="flex flex-col items-center text-center">
				<div className="relative">
					<span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-20" />
					<span className="relative flex size-12 items-center justify-center rounded-full bg-brand">
						<Sprout className="size-6 text-white" aria-hidden="true" />
					</span>
				</div>

				<h2 id="cta-heading" className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
					{ __( 'Let AI run your blog - you focus on growth', 'solvex-ai-blogger' ) }
				</h2>
				<p className="mt-3 max-w-2xl text-base text-muted-foreground">
					{ __( 'Unlock every feature and take your blog to the next level with AI Blogger Pro.', 'solvex-ai-blogger' ) }
				</p>

				<div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
					<span className="inline-flex items-center gap-1">
						<Zap className="size-3.5 text-brand" aria-hidden="true" />
						{ __( 'Advanced AI features', 'solvex-ai-blogger' ) }
					</span>
					<span className="inline-flex items-center gap-1">
						<LifeBuoy className="size-3.5 text-brand" aria-hidden="true" />
						{ __( 'Priority support', 'solvex-ai-blogger' ) }
					</span>
					<span className="inline-flex items-center gap-1">
						<Star className="size-3.5 text-brand" aria-hidden="true" />
						{ __( 'AI-driven analytics', 'solvex-ai-blogger' ) }
					</span>
				</div>

				<div className="mt-7">
					<ProButton url={ proPurchaseUrl } />
				</div>

				<p className="mt-4 text-xs text-muted-foreground">
					{ __( '14-day money-back guarantee · Cancel anytime · Instant activation', 'solvex-ai-blogger' ) }
				</p>
			</div>
		</section>
	);
} );
CallToActionSection.displayName = 'CallToActionSection';

function FreeVsPro() {
	const memoizedFeatures = useMemo( () => Features || [], [] );
	const proPurchaseUrl = useSelector( ( state ) => state.proPurchaseUrl );

	return (
		<div className="animate-reveal">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{ __( 'Free vs Pro', 'solvex-ai-blogger' ) }
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __( 'See what unlocks when you upgrade.', 'solvex-ai-blogger' ) }
					</p>
				</div>
				<ProButton url={ proPurchaseUrl } />
			</header>

			<div className="mt-8 overflow-hidden rounded-xl border border-border bg-card ring-1 ring-black/[0.02]">
				<table
					className="w-full text-left"
					aria-label={ __( 'Feature comparison between Free and Pro plans', 'solvex-ai-blogger' ) }
				>
					<thead>
						<tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
							<th className="px-6 py-4">{ __( 'Features', 'solvex-ai-blogger' ) }</th>
							<th className="px-6 py-4 text-center">
								<div className="flex flex-col items-center gap-1">
									<span>{ __( 'Free', 'solvex-ai-blogger' ) }</span>
									<span className="text-[10px] font-medium normal-case tracking-normal text-muted-foreground/80">
										{ __( '$0/month', 'solvex-ai-blogger' ) }
									</span>
								</div>
							</th>
							<th className="px-6 py-4 text-center">
								<div className="flex flex-col items-center gap-1">
									<span className="inline-flex items-center gap-1 text-brand">
										{ __( 'Premium', 'solvex-ai-blogger' ) }
										<Crown className="size-3.5" aria-hidden="true" />
									</span>
									<span className="text-[10px] font-medium normal-case tracking-normal text-muted-foreground/80">
										{ __( 'From $3.99/month', 'solvex-ai-blogger' ) }
									</span>
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						{ memoizedFeatures.map( ( feature, index ) => (
							<FeatureRow
								key={ `feature-${ index }` }
								feature={ feature }
								isLast={ index === memoizedFeatures.length - 1 }
							/>
						) ) }
					</tbody>
				</table>
			</div>

			<CallToActionSection />
		</div>
	);
}

FreeVsPro.displayName = 'FreeVsPro';

export default memo( FreeVsPro );
