import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';

/**
 * Pro upgrade card — rendered when the Pro plugin is not active.
 *
 * Lives in the Welcome aside. Free-licensed users still see the upsell
 * until the paid Pro plugin is installed and activated. Links to the
 * localized `upgradeLink` (with `proPurchaseUrl` as a fallback).
 */
export default function ProUpgradeCard() {
	const proAvailable = useSelector( ( state ) => Boolean( state.proAvailable ) );
	const upgradeLink = useSelector(
		( state ) => state.upgradeLink || state.proPurchaseUrl || 'https://wpaiblogger.com/#pricing'
	);

	if ( proAvailable ) {
		return null;
	}

	return (
		<a
			href={ upgradeLink }
			target="_blank"
			rel="noopener noreferrer"
			className="block rounded-xl bg-brand p-6 text-white no-underline shadow-lg shadow-brand/15 transition-transform hover:scale-[1.01]"
			data-testid="pro-upgrade-card"
		>
			<span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
				{ __( 'Pro plan', 'solvex-ai-blogger' ) }
			</span>
			<h3 className="mt-2 text-lg font-semibold leading-tight text-white">
				{ __( 'Scale your content engine', 'solvex-ai-blogger' ) }
			</h3>
			<p className="mt-2 text-xs leading-relaxed text-white/80">
				{ __( 'Unlimited ideas, advanced controls, and up to 5,000 words per post.', 'solvex-ai-blogger' ) }
			</p>
			<span className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand">
				{ __( 'Upgrade now', 'solvex-ai-blogger' ) }
			</span>
		</a>
	);
}
