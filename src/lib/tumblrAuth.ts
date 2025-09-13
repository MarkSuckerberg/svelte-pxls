import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers';

interface TumblrProfile extends Record<string, any> {
	name: string;
	blogs: {
		name: string;
		title: string;
		primary: boolean | undefined;
		type: 'public' | 'private';
	}[];
}

export function Tumblr<P extends TumblrProfile>(options: OAuthUserConfig<P>): OAuthConfig<P> {
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
