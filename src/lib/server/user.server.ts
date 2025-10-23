import type { ClientToServerEvents, ServerToClientEvents } from '$lib/types.js';
import type { UUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import type { Socket } from 'socket.io';
import type { LimitedUserInfo, UserInfo } from '../userinfo.js';
import { db, users } from './db/index.js';

export class User {
	public static async exists(id: UUID) {
		const count = (
			await db.execute<{ isExist: boolean }>(sql`
			select exists (select 1 from ${users} where ${users.id} = ${id}) as isExist
		`)
		).rowCount;

		return count ? count > 0 : false;
	}

	private static idMap: Map<UUID, User> = new Map();

	public static async byId(id: UUID) {
		let user = this.idMap.get(id);

		if (user) {
			return user;
		}

		const data = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];

		if (!data) {
			return null;
		}

		return new User(
			data.id as UUID,
			data.pixels,
			data.placed,
			data.lastTicked,
			data.name,
			data.image,
			data.title,
			data.mod
		);
	}

	public readonly id: UUID;
	public readonly mod: boolean = false;
	public readonly username: string;
	private _pixels: number = 100;
	private _placed: number = 0;
	private _lastTicked;
	private _avatar: string | null;
	private _title: string | null;

	public constructor(
		id: UUID,
		pixels: number,
		placed: number,
		lastTicked: Date,
		username: string,
		avatar: string | null,
		title: string | null,
		mod = false
	) {
		this.id = id;
		this._pixels = pixels;
		this._placed = placed;
		this._lastTicked = lastTicked;
		this.username = username;
		this._avatar = avatar;
		this._title = title;
		this.mod = mod;
	}

	public cooldown = 20;

	public get Pixels() {
		const lastTicked = this._lastTicked.getTime();

		const elapsed = Date.now() - lastTicked;
		const delta = Math.floor(elapsed / 1000 / this.cooldown);
		this._pixels = Math.min(this._pixels + delta, this.MaxPixels);

		this._lastTicked = new Date(lastTicked + delta * 1000 * this.cooldown);
		this.sync();

		return this._pixels;
	}

	public set Pixels(newPixels: number) {
		this._pixels = newPixels;
	}

	public get Placed() {
		return this._placed;
	}

	public set Placed(newPlaced: number) {
		this._placed = newPlaced;
	}

	public get MaxPixels() {
		return 100 + Math.floor(this._placed / 100);
	}

	public get LastTicked() {
		return this._lastTicked;
	}

	public set LastTicked(tickTime: Date) {
		this._lastTicked = tickTime;
	}

	public get Avatar() {
		return this._avatar;
	}

	public set Avatar(newImage: string | null) {
		this._avatar = newImage;
	}

	public get Title() {
		return this._title;
	}

	public set Title(newTitle: string | null) {
		this._title = newTitle;
	}

	public update({
		pixels,
		placed,
		avatar,
		title,
		lastTicked
	}: {
		pixels?: number;
		placed?: number;
		avatar?: string;
		title?: string;
		lastTicked?: Date;
	}) {
		if (lastTicked) {
			this._lastTicked = lastTicked;
		}

		if (pixels) {
			this.Pixels = pixels;
		}

		if (placed) {
			this._placed = placed;
		}

		if (avatar) {
			this._avatar = avatar;
		}

		if (title) {
			this._title = title;
		}

		return this.sync();
	}

	public info(): UserInfo {
		return {
			name: this.username,
			pixels: this.Pixels,
			id: this.id,
			avatar: this.Avatar,
			maxPixels: this.MaxPixels,
			lastTicked: this.LastTicked.getTime(),
			placed: this.Placed,
			title: this._title,
			mod: this.mod
		};
	}

	public limitedInfo(): LimitedUserInfo {
		return {
			name: this.username,
			avatar: this._avatar,
			placed: this._placed,
			id: this.id,
			title: this._title,
			mod: this.mod
		};
	}

	public async sync() {
		await db
			.update(users)
			.set({
				pixels: this._pixels,
				placed: this._placed,
				lastTicked: this._lastTicked,
				image: this._avatar,
				title: this._title
			})
			.where(eq(users.id, this.id));
	}
}
