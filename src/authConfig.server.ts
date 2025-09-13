import Discord from '@auth/core/providers/discord';
import Google from '@auth/core/providers/google';
import Twitch from '@auth/core/providers/twitch';
import type { SvelteKitAuthConfig } from '@auth/sveltekit';
import { eq } from 'drizzle-orm';
import { config } from './config.server.js';
import { db } from './lib/server/db/index.js';
import { oauthLinks, users } from './lib/server/db/schema.js';
import { Tumblr } from './lib/tumblrAuth.js';
import { User } from './user.js';

export const authConfig: SvelteKitAuthConfig = {
	providers: [
		Discord({
			...config.providers.discord,
			authorization: {
				params: { scope: 'identify' }
			}
		}),
		Google({
			...config.providers.google,
			authorization: {
				params: { scope: 'openid profile' }
			}
		}),
		Twitch({
			...config.providers.twitch,
			authorization: {
				params: { scope: 'openid profile' }
			}
		}),
		Tumblr(config.providers.tumblr)
	],
	basePath: '/auth',
	trustHost: true,
	secret: config.authSecret,
	callbacks: {
		async signIn({ user, account, profile }) {
			await db.transaction(async (tx) => {
				if (!profile || !profile.id || !user.name || !account?.provider) {
					return false;
				}

				let userId = user.userId || (
					await tx
						.select({ id: oauthLinks.userId })
						.from(oauthLinks)
						.where(eq(oauthLinks.id, profile.id))
						.limit(1)
				)[0]?.id;

				if (!userId) {
					userId = (
						await tx
							.insert(users)
							.values({ username: user.name, avatar: user.image })
							.returning({ id: users.id })
					)[0].id;
				}

				await tx
					.insert(oauthLinks)
					.values({ id: profile.id, userId, data: profile, provider: account.provider })
					.onConflictDoNothing();

				user.userId = userId;
			});

			return true;
		},
		jwt({ token, user }) {
			if (!token.userId && user?.userId) {
				token.userId = user.userId;
			}

			return token;
		},
		session({ session, token }) {
			if (!token.userId || !User.exists(token.userId)) {
				throw new Error('Invalid session!');
			}

			session.user.userId = token.userId;
			return session;
		}
	}
};
