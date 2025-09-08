import { WIDTH, HEIGHT } from '$lib/socket';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const search = url.searchParams;

	const x = search.get('x');
	const y = search.get('y');
	const scale = search.get('s');
	const edit = search.get('edit');

	return {
		pan: {
			x: x ? Number.parseFloat(x) : WIDTH / 2,
			y: y ? Number.parseFloat(y) : HEIGHT / 2
		},
		scale: scale ? Number.parseFloat(scale) : 1,
		edit: !!edit
	};
};
