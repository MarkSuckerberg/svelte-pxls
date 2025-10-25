import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({}) => {
	const server = globalThis.io;

	return {
		array: server.grid.array,
		dimensions: server.grid.size
	};
};
