import { text } from '@sveltejs/kit';
import { config } from '../../../config.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({}) => {
	return text(config.info);
};
