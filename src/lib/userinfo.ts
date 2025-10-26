import type { UUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db, users } from './server/db/index.js';

export interface UserInfo extends LimitedUserInfo {
	pixels: number;
	maxPixels: number;
	lastTicked: number;
}

export interface LimitedUserInfo {
	name: string;
	avatar: string | null;
	placed: number;
	id: UUID;
	mod: boolean;
	title: string | null;
}

export const dbUser = {
	name: users.name,
	avatar: users.image,
	placed: users.placed,
	id: users.id,
	mod: users.mod,
	title: users.title
};

export const fullDBUser = {
	...dbUser,
	pixels: users.pixels,
	maxPixels: users.maxPixels,
	lastTicked: users.lastTicked
};

const dbUserInfoQuery = db
	.select(dbUser)
	.from(users)
	.where(eq(users.id, sql.placeholder('id')))
	.limit(1)
	.prepare('userinfo_id');

const dbUserInfoQueryUsername = db
	.select(dbUser)
	.from(users)
	.where(eq(users.name, sql.placeholder('username')))
	.limit(1)
	.prepare('userinfo_username');

const dbUserInfoQueryUsernameFull = db
	.select(fullDBUser)
	.from(users)
	.where(eq(users.name, sql.placeholder('username')))
	.limit(1)
	.prepare('userinfo_full_username');

export async function GetUserInfo(id: string) {
	const info: LimitedUserInfo | undefined = (await dbUserInfoQuery.execute({ id })).at(0);

	return info || null;
}

export async function GetUserInfoUsername(username: string) {
	const info: LimitedUserInfo | undefined = (
		await dbUserInfoQueryUsername.execute({ username })
	).at(0);

	return info || null;
}

export async function GetFullUserInfoUsername(username: string) {
	const info = (await dbUserInfoQueryUsernameFull.execute({ username })).at(0);

	if (info != null) {
		const formatted: UserInfo = {
			...info,
			lastTicked: info.lastTicked.getTime()
		};

		return formatted;
	}

	return null;
}
