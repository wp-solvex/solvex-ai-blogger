/**
 * WelcomeVideoCard
 *
 * Intro card with a clickable video thumbnail (YouTube-style play button)
 * that opens the video in a fullscreen popup. Mirrors the SureRank
 * welcome-card pattern but lives inside the new Lovable-style aside.
 *
 * Video URL + thumbnail come from `wpsolvex_autoaiblogger_localized_data
 * .welcome_video` when present; otherwise sensible defaults are used.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { __ } from '@wordpress/i18n';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import X from 'lucide-react/dist/esm/icons/x';
import { cn } from '@Utils/cn';

const DEFAULT_VIDEO = {
	thumbnail: 'https://img.youtube.com/vi/Mzb5DjdXvLM/maxresdefault.jpg',
	url: 'https://www.youtube.com/embed/Mzb5DjdXvLM?autoplay=1&rel=0',
	docsUrl: 'https://wpaiblogger.com/docs/',
};

function getVideoConfig() {
	const data =
		typeof window !== 'undefined' && window.wpsolvex_autoaiblogger_localized_data
			? window.wpsolvex_autoaiblogger_localized_data
			: {};
	const cfg = data.welcome_video || {};
	return {
		thumbnail: cfg.thumbnail || DEFAULT_VIDEO.thumbnail,
		url: cfg.url || DEFAULT_VIDEO.url,
		docsUrl: cfg.docs_url || DEFAULT_VIDEO.docsUrl,
	};
}

export default function WelcomeVideoCard( { className = '' } ) {
	const [ open, setOpen ] = useState( false );
	const { thumbnail, url, docsUrl } = getVideoConfig();

	useEffect( () => {
		const onKey = ( e ) => {
			if ( e.key === 'Escape' ) {
				setOpen( false );
			}
		};
		window.addEventListener( 'keydown', onKey );
		return () => window.removeEventListener( 'keydown', onKey );
	}, [] );

	useEffect( () => {
		if ( ! open ) {
			return undefined;
		}
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [ open ] );

	const handleDocs = ( e ) => {
		e.preventDefault();
		const params = new URLSearchParams( {
			utm_source: 'plugin',
			utm_medium: 'dashboard',
			utm_campaign: 'welcome_card',
		} );
		window.open(
			`${ docsUrl }${ docsUrl.includes( '?' ) ? '&' : '?' }${ params.toString() }`,
			'_blank',
			'noopener,noreferrer'
		);
	};

	return (
		<>
			<div
				className={ cn(
					'overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-black/[0.02]',
					className
				) }
			>
				<button
					type="button"
					onClick={ () => setOpen( true ) }
					className="group relative block aspect-video w-full overflow-hidden rounded-md bg-muted"
					aria-label={ __( 'Play welcome video', 'solvex-ai-blogger' ) }
				>
					<img
						src={ thumbnail }
						alt={ __( 'Welcome to Solvex AI Blogger', 'solvex-ai-blogger' ) }
						className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>
					<span className="absolute inset-0 flex items-center justify-center bg-black/5 transition-colors group-hover:bg-black/10">
						<span className="flex h-12 w-[68px] items-center justify-center rounded-xl bg-[#FF0000] opacity-90 shadow-lg transition-transform group-hover:scale-110 group-hover:opacity-100">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								className="ml-1 size-6 fill-white"
								aria-hidden="true"
							>
								<path d="M8 5v14l11-7z" />
							</svg>
						</span>
					</span>
				</button>

				<div className="mt-5 flex flex-col gap-3">
					<h3 className="text-lg font-semibold tracking-tight">
						{ __( 'Welcome to Solvex AI Blogger!', 'solvex-ai-blogger' ) }
					</h3>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{ __(
							'Spin up automated AI campaigns, schedule posts, and grow your blog without the busywork. Watch the quick tour, then dive in.',
							'solvex-ai-blogger'
						) }
					</p>
					<a
						href={ docsUrl }
						onClick={ handleDocs }
						className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground no-underline transition-colors hover:border-brand/30"
					>
						{ __( 'Learn More', 'solvex-ai-blogger' ) }
						<ArrowRight className="size-3.5" aria-hidden="true" />
					</a>
				</div>
			</div>

			{ open &&
				createPortal(
					<div className="fixed inset-0 z-[100000] flex items-center justify-center">
						<button
							type="button"
							aria-label={ __( 'Close video', 'solvex-ai-blogger' ) }
							className="absolute inset-0 size-full cursor-pointer bg-black/80"
							onClick={ () => setOpen( false ) }
						/>
						<button
							type="button"
							onClick={ () => setOpen( false ) }
							className="absolute right-6 top-6 z-[1] inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
							aria-label={ __( 'Close video', 'solvex-ai-blogger' ) }
						>
							<X className="size-5" aria-hidden="true" />
						</button>
						<div
							className="relative z-[1] mx-4 aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"
							role="dialog"
							aria-modal="true"
							aria-label={ __( 'Welcome video', 'solvex-ai-blogger' ) }
						>
							<iframe
								className="absolute inset-0 size-full"
								src={ url }
								title={ __( 'Welcome to Solvex AI Blogger', 'solvex-ai-blogger' ) }
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
								frameBorder="0"
							></iframe>
						</div>
					</div>,
					document.body
				) }
		</>
	);
}
