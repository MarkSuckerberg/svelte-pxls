import fs from 'fs';
import YAML from 'yaml';
import type { Dimensions } from './lib/types.js';

interface ProviderCredentials {
	clientId: string;
	clientSecret: string;
	enabled: boolean;
	registrationDisabled?: boolean;
}

interface Config {
	boardFile: string;
	size: Dimensions;
	port: number;
	authSecret: string;
	motd: string;
	db: {
		url: string;
	};
	legacyDB?: {
		url: string
	}
	providers: {
		discord?: ProviderCredentials;
		google?: ProviderCredentials;
		tumblr?: ProviderCredentials;
		twitch?: ProviderCredentials;
	};
}

const example = fs.readFileSync('./data/config.example.yml', 'utf8');
export let config: Config = YAML.parse(example) satisfies Config;

try {
	const file = fs.readFileSync('./data/config.yml', 'utf8');
	const userConf = YAML.parse(file) satisfies Config;
	config = { ...config, ...userConf };
} catch (error) {
	console.error('Error loading user config:', error);
}
