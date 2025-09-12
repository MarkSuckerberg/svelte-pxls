import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers';
import Discord from '@auth/core/providers/discord';
import Google from '@auth/core/providers/google';
import Twitch from '@auth/core/providers/twitch';
import type { SvelteKitAuthConfig } from '@auth/sveltekit';
import { eq } from 'drizzle-orm';
import { config } from './config.server.js';
import { db } from './lib/server/db/index.js';
import { oauthLinks, users } from './lib/server/db/schema.js';

interface TumblrProfile extends Record<string, any> {
	name: string;
	blogs: {
		name: string;
		title: string;
		primary: boolean | undefined;
		type: 'public' | 'private';
	}[];
}

function Tumblr<P extends TumblrProfile>(options: OAuthUserConfig<P>): OAuthConfig<P> {
	return {
		id: 'tumblr',
		name: 'Tumblr',
		type: 'oauth',
		authorization: {
			url: 'https://www.tumblr.com/oauth2/authorize',
			params: { scope: 'basic' }
		},
		token: 'https://api.tumblr.com/v2/oauth2/token',
		userinfo: 'https://api.tumblr.com/v2/user/info',
		profile(profile) {
			const primaryBlog = profile.blogs.find((blog) => blog.primary);

			return {
				id: profile.name,
				name: primaryBlog?.title ?? primaryBlog?.name ?? profile.name
			};
		},
		style: {
			logo: 'https://assets.tumblr.com/images/favicons/favicon.svg'
		},
		options
	};
}
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

				let userId = (
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
							.values({ username: user.name })
							.returning({ id: users.id })
					)[0].id;
				}

				await tx
					.insert(oauthLinks)
					.values({ id: profile.id, userId, data: profile, provider: account.provider })
					.onConflictDoNothing();

				user.id = userId.toString();
			});

			return true;
		},
		jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		session({ session, token }) {
			session.user.id = token.id!;
			return session;
		}
	}
};
