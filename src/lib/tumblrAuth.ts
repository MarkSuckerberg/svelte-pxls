import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers';
import type { TokenSet } from '@auth/core/types';

interface TumblrInternalProfile {
	meta: {
		status: number;
		msg: string;
	};
	response: {
		user: {
			following: number;
			default_post_format: string;
			name: string;
			likes: number;
			blogs: {
				name: string;
				title: string;
				primary: boolean | undefined;
				type: 'public' | 'private';
				avatar: {
					width: number;
					height: number;
					url: string;
					accessories: unknown[];
				}[];
				url: string;
				uuid: string;
			}[];
		};
	};
}

export interface TumblrProfile {
	sub: string;
	preferred_username: string;
	name: string;
	picture: string;
	email?: never;
	website: string;
}

export function Tumblr(options: OAuthUserConfig<TumblrProfile>): OAuthConfig<TumblrProfile> {
	return {
		id: 'tumblr',
		name: 'Tumblr',
		type: 'oauth',
		authorization: {
			url: 'https://www.tumblr.com/oauth2/authorize',
			params: { scope: 'basic', response_type: 'code' }
		},
		token: {
			url: 'https://api.tumblr.com/v2/oauth2/token',
			async conform(response: Response) {
				const body = await response.json();
				if (response.ok) {
					delete body.id_token;
					return new Response(JSON.stringify(body), response);
				} else {
					const { message: error_description, error } = body;
					if (typeof error !== 'string') {
						return new Response(
							JSON.stringify({ error: 'invalid_request', error_description }),
							response
						);
					}
					console.warn(
						"Response has 'error'. Redundant workaround, please open an issue."
					);
				}
			}
		},
		userinfo: {
			url: 'https://api.tumblr.com/v2/user/info',
			async request(context: { tokens: TokenSet }): Promise<TumblrProfile> {
				const accessToken = context.tokens.access_token as string;
				const response = await fetch('https://api.tumblr.com/v2/user/info', {
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				});
				const profile = (await response.json()) as TumblrInternalProfile;

				const user = profile.response.user;

				const primaryBlog = user.blogs.find((blog) => blog.primary) || user.blogs[0];

				return {
					sub: primaryBlog.uuid,
					name: primaryBlog.title ?? primaryBlog.name ?? user.name,
					preferred_username: user.name,
					picture: primaryBlog.avatar[0].url ?? '',
					website: primaryBlog.url
				};
			}
		},
		checks: ['state', 'pkce'],
		profile(profile) {
			return {
				id: profile.sub,
				name: profile.name,
				image: profile.picture
			};
		},
		style: {
			logo: 'https://assets.tumblr.com/images/favicons/favicon.svg'
		},
		options
	};
}
