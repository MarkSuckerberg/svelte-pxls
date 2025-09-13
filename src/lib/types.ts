export const DEFAULT_COLOR_INDEX = 8;

import type { DefaultSession, Session } from '@auth/sveltekit';
import type { User, UserInfo } from '../user';
import colorFile from './colors.json' with { type: 'json' };

export interface Coords {
	x: number;
	y: number;
}

export interface Dimensions {
	width: number;
	height: number;
}

export type ServerToClientEvents = {
	map: (map: Uint8Array, size: Dimensions) => void;
	pixelUpdate: (update: Pixel[]) => void;
	users: (users: string[]) => void;
	userInfo: (userInfo: UserInfo) => void;
};

export type ClientToServerEvents = {
	place: (pixels: Pixel[], ack: (pixels: Pixel[]) => void) => void;
	pixelInfo: (
		location: Coords,
		ack: (pixel: { user: string; time: number } | null) => void
	) => void;
};

export type InterServerEvents = never;

export type PixelSession = Session;

export type SocketData = {
	session: PixelSession | null;
	user: User | null;
};

export type AuthedSocketData = {
	session: PixelSession;
	user: User;
};

export type Pixel = {
	x: number;
	y: number;
	color: number;
};

export function colorToRGB(index: number) {
	const colorValue = colors[index];
	const red = (colorValue >> 24) & 0xff;
	const green = (colorValue >> 16) & 0xff;
	const blue = (colorValue >> 8) & 0xff;
	const alpha = (colorValue >> 0) & 0xff;

	return { red, green, blue, alpha };
}

export const colors = colorFile.map(({ name, value }) => {
	return Number.parseInt(value, 16);
});

export const colorNames = colorFile.map(({ name, value }) => name);

export const colorsBackwards = colorFile.map(({ name, value }) => {
	//TODO: get some help
	return Number.parseInt(
		value
			.split(/([0-9a-fA-F]{2})/)
			.reverse()
			.join(''),
		16
	);
});

export function get1DPosition2D(x: number, y: number, width: number) {
	return (x % width) + y * width;
}

declare module '@auth/sveltekit' {
	interface Session {
		user: {
			userId: number;
		} & DefaultSession['user'];
	}

	interface User {
		userId?: number;
	}
}

declare module '@auth/core/jwt' {
	/** Returned by the `jwt` callback and `auth`, when using JWT sessions */
	interface JWT {
		/** User ID number stored in the database */
		userId: number;
	}
}
