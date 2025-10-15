import type { AuthConfig } from '@auth/core';
import type { Provider } from '@auth/core/providers';
import Discord, { type DiscordProfile } from '@auth/core/providers/discord';
import Google, { type GoogleProfile } from '@auth/core/providers/google';
import Twitch, { type TwitchProfile } from '@auth/core/providers/twitch';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { UUID } from 'crypto';
import { and, eq, gte } from 'drizzle-orm';
import { config } from './config.server.js';
import { accounts, bans, db, users } from './lib/server/db/index.js';
import { Tumblr, type TumblrProfile } from './lib/tumblrAuth.js';

const providers: Provider[] = [];

if (config.providers.discord?.enabled) {
	providers.push(
		Discord({
			...config.providers.discord,
			authorization: {
				params: { scope: 'identify' }
			}
		})
	);
}
if (config.providers.google?.enabled) {
	providers.push(
		Google({
			...config.providers.google,
			authorization: {
				params: {
					scope: 'openid profile'
				}
			}
		})
	);
}
if (config.providers.twitch?.enabled) {
	providers.push(
		Twitch({
			...config.providers.twitch,
			authorization: {
				params: {
					scope: 'openid',
					claims: {
						id_token: { picture: null, preferred_username: null }
					}
				}
			}
		})
	);
}
if (config.providers.tumblr?.enabled) {
	providers.push(Tumblr(config.providers.tumblr));
}

export type UserProfile = DiscordProfile | GoogleProfile | TwitchProfile | TumblrProfile;

export const authConfig = {
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts
	}),
	providers,
	basePath: '/auth',
	trustHost: true,
	secret: config.authSecret,
	session: {
		strategy: 'jwt'
	},
	callbacks: {
		async signIn({ user, profile }) {
			if (!user.id) {
				return true;
			}

			if (profile) {
				const profileData = profile as UserProfile;
				let newImage: string | undefined;

				if ('picture' in profileData) {
					newImage = profileData.picture;
				} else if ('image_url' in profileData) {
					newImage = profileData.image_url;
				}

				if (newImage) {
					db.update(users)
						.set({ image: newImage })
						.where(eq(users.id, user.id as UUID));
				}
			}

			//Get bans for the user ID, that have not expired
			const banCount = await db.$count(
				bans,
				and(eq(bans.userId, user.id), gte(bans.expires, new Date(Date.now())))
			);

			return banCount < 1;
		},
		jwt({ token, user }) {
			if (user?.id && !token.userId) {
				//TODO: Fix typing override of module
				token.userId = user.id as UUID;
			}

			return token;
		},
		session({ session, token }) {
			if (token) {
				session.user.id = token.userId;
			}

			return session;
		}
	}
} satisfies AuthConfig;
