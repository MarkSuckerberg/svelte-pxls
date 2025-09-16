import defaultConfig from '../config.example.json' with { type: 'json' };
import userConfig from '../config.json' with { type: 'json' };
import type { Dimensions } from './lib/types.js';

interface ProviderCredentials {
	clientId: string;
	clientSecret: string;
	enabled: boolean;
	registrationDisabled?: boolean;
}

interface Config {
	size: Dimensions;
	port: number;
	authSecret: string;
	db: {
		url: string;
	};
	providers: {
		discord?: ProviderCredentials;
		google?: ProviderCredentials;
		tumblr?: ProviderCredentials;
		twitch?: ProviderCredentials;
	};
}

export let config: Config;
try {
	config = userConfig satisfies Config;
} catch (error) {
	config = defaultConfig;
}
