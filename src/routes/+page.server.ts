import type { Dimensions } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({}) => {
	const server = globalThis.io;

	return {
		array: server.grid.array,
		dimensions: { width: server.grid.width, height: server.grid.height } satisfies Dimensions
	};
};
