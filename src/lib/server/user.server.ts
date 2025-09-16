import { eq, sql } from 'drizzle-orm';
import type { UserInfo } from '../userinfo.js';
import { db, users } from './db/index.js';

export class User {
	public static async exists(id: number) {
		const count = (
			await db.execute<{ isExist: boolean }>(sql`
			select exists (select 1 from ${users} where ${users.id} = ${id}) as isExist
		`)
		).rowCount;

		return count ? count > 0 : false;
	}

	public static async byId(id: string) {
		const data = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];

		if (!data) {
			return null;
		}

		return new User(data.id, data.pixels, data.placed, data.lastTicked, data.name, data.mod);
	}

	public readonly id;
	public readonly mod: boolean = false;
	public readonly username: string;
	private _pixels: number = 100;
	private _placed: number = 0;
	private _lastTicked;

	public constructor(
		id: string,
		pixels: number,
		placed: number,
		lastTicked: Date,
		username: string,
		mod = false
	) {
		this.id = id;
		this._pixels = pixels;
		this._placed = placed;
		this._lastTicked = lastTicked;
		this.username = username;
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

	public info(): UserInfo {
		return {
			pixels: this.Pixels,
			maxPixels: this.MaxPixels,
			lastTicked: this.LastTicked.getTime(),
			placed: this.Placed,
			mod: this.mod
		};
	}

	public async sync() {
		await db
			.update(users)
			.set({ pixels: this._pixels, placed: this._placed, lastTicked: this._lastTicked })
			.where(eq(users.id, this.id));
	}
}
