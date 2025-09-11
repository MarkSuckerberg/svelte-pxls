import Discord from '@auth/core/providers/discord';
import Google from '@auth/core/providers/google';
import Twitch from '@auth/core/providers/twitch';
import type { SvelteKitAuthConfig } from '@auth/sveltekit';
import defaultConfig from '../config.example.json';

export let config: typeof defaultConfig;
try {
	config = (await import('../config.json')) as typeof defaultConfig;
} catch (error) {
	config = defaultConfig;
}

export const authConfig: SvelteKitAuthConfig = {
	providers: [
		Discord(config.providers.discord),
		Google(config.providers.google),
		Twitch(config.providers.twitch)
	],
	basePath: '/auth',
	trustHost: true,
	secret: config.authSecret
};
