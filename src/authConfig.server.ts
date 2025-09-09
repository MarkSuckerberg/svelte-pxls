import type { SvelteKitAuthConfig } from '@auth/sveltekit';
import Discord from '@auth/core/providers/discord';
import Google from '@auth/core/providers/google';
import Twitch from '@auth/core/providers/twitch';

export const authConfig: SvelteKitAuthConfig = {
	providers: [
		Discord({
			clientId: process.env['DISCORD_ID'],
			clientSecret: process.env['DISCORD_SECRET']
		}),
		Google,
		Twitch
	],
	basePath: '/auth',
	trustHost: true,
	secret: process.env['AUTH_SECRET']
};
