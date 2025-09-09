import { DEFAULT_COLOR_INDEX } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url, data }) => {
	const search = url.searchParams;

	const x = search.get('x');
	const y = search.get('y');
	const scale = search.get('s');
	const edit = search.get('edit');
	const color = search.get('idx');

	return {
		pan: {
			x: x ? Number.parseFloat(x) : 0,
			y: y ? Number.parseFloat(y) : 0
		},
		scale: scale ? Number.parseFloat(scale) : 1,
		edit: !!edit,
		color: color ? Number.parseInt(color) : DEFAULT_COLOR_INDEX,
		array: data.array,
		dimensions: data.dimensions
	};
};
