/**
 * Class-name composer used by shadcn/ui primitives.
 *
 * @param {...any} inputs Class name strings, objects, or arrays.
 * @return {string} Merged class name string.
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn( ...inputs ) {
	return twMerge( clsx( inputs ) );
}
