import React, { memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';

// Individual skeleton row component for better performance
const SkeletonRow = memo( ( { index } ) => (
	<tr
		className="animate-pulse even:bg-gray-50 hover:bg-blue-50/30 transition-colors duration-150"
		role="row"
		aria-label={ __( 'Loading row', 'auto-ai-blogger' ) + ' ' + ( index + 1 ) }
	>
		<td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
			<div className="flex items-center">
				{ /* Content placeholder - single line */ }
				<div className="h-4 bg-gray-300 rounded animate-pulse" style={ { width: `${ ( Math.random() * 40 ) + 60 }%` } } />
			</div>
		</td>

		<td className="whitespace-nowrap py-4 pl-3 pr-4 text-sm sm:pr-6">
			<div className="h-4 bg-gray-300 rounded animate-pulse w-16" />
		</td>
	</tr>
) );

SkeletonRow.displayName = 'SkeletonRow';

// Enhanced skeleton table component
const Skeleton = memo( ( { rows = 5 } ) => {
	// Memoize skeleton rows for performance
	const skeletonRows = useMemo( () =>
		Array.from( { length: rows }, ( _, index ) => (
			<SkeletonRow key={ `skeleton-${ index }` } index={ index } />
		) ),
	[ rows ]
	);

	// Return just the skeleton rows without table wrapper for inline use
	return (
		<>
			{ skeletonRows }
		</>
	);
} );

Skeleton.displayName = 'PostIdeasSkeleton';

export default Skeleton;
