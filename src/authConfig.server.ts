import type { Provider } from '@auth/core/providers';
import Discord from '@auth/core/providers/discord';
import Google from '@auth/core/providers/google';
import Twitch from '@auth/core/providers/twitch';
import type { SvelteKitAuthConfig } from '@auth/sveltekit';
import { config } from './config.server.js';
import { db } from './lib/server/db/index.js';
import { oauthLinks, users } from './lib/server/db/schema.js';
import { User } from './lib/server/user.server.js';
import { Tumblr } from './lib/tumblrAuth.js';

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
				params: { scope: 'openid profile' }
			}
		})
	);
}
if (config.providers.twitch?.enabled) {
	providers.push(
		Twitch({
			...config.providers.twitch,
			authorization: {
				params: { scope: 'openid profile' }
			}
		})
	);
}
if (config.providers.tumblr?.enabled) {
	providers.push(Tumblr(config.providers.tumblr));
}

export const authConfig: SvelteKitAuthConfig = {
	providers,
	basePath: '/auth',
	trustHost: true,
	secret: config.authSecret,
	callbacks: {
		async signIn({ user, account, profile }) {
			await db.transaction(async (tx) => {
				if (!profile || !profile.id || !user.name || !account?.provider) {
					return false;
				}

				const userId = (
					await tx
						.insert(users)
						.values({ username: user.name, avatar: user.image })
						.onConflictDoUpdate({
							target: users.id,
							set: {
								avatar: user.image
							}
						})
						.returning({ id: users.id })
				)[0].id;

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
