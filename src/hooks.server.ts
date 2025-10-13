import type { SvelteKitAuthConfig } from '@auth/sveltekit';
import { SvelteKitAuth } from '@auth/sveltekit';
import { authConfig } from './authConfig.server';

export const { handle, signIn, signOut } = SvelteKitAuth(
	authConfig as unknown as SvelteKitAuthConfig
);
