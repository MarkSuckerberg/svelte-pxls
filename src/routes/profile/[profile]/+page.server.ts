import { GetUserInfoUsername } from '$lib/userinfo';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const user = await GetUserInfoUsername(params.profile);

	if (user == null) {
		return error(404, 'User not found!');
	}

	return { user };
};
