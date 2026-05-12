import React, { memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Loading skeleton for the post-ideas row list.
 * Renders `rows` ghost rows matching the new Lovable layout.
 */
const Skeleton = memo( ( { rows = 5 } ) => {
	const items = useMemo(
		() =>
			Array.from( { length: rows }, ( _, i ) => (
				<li
					key={ `skeleton-${ i }` }
					className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4"
					aria-label={ __( 'Loading row', 'solvex-ai-blogger' ) }
				>
					<div
						className="h-4 animate-pulse rounded bg-muted"
						style={ { width: `${ ( ( i * 11 ) % 40 ) + 50 }%` } }
					/>
					<div className="h-4 w-16 animate-pulse rounded bg-muted" />
				</li>
			) ),
		[ rows ]
	);

	return <ul className="divide-y divide-border">{ items }</ul>;
} );
Skeleton.displayName = 'PostIdeasSkeleton';

export default Skeleton;
