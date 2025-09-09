import type { Dimensions } from '$lib/socket';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({}) => {
	const server = globalThis.io;

	return {
		array: server.data.array,
		dimensions: { width: server.data.width, height: server.data.height } as Dimensions
	};
};
