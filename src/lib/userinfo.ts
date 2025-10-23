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
	placed: users.placed,
	id: users.id,
	title: users.title,
	avatar: users.image,
	mod: users.mod
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
