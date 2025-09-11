import { SvelteKitAuth } from '@auth/sveltekit';
import { authConfig } from './config.server';

export const { handle, signIn, signOut } = SvelteKitAuth(authConfig);
