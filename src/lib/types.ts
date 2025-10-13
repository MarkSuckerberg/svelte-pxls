export const DEFAULT_COLOR_INDEX = 8;

import type { Session } from '@auth/sveltekit';
import type { Socket } from 'socket.io-client';
import colorFile from './colors.json' with { type: 'json' };
import type { User } from './server/user.server.js';
import type { UserInfo } from './userinfo.js';

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface Coords {
	x: number;
	y: number;
}

export interface Dimensions {
	width: number;
	height: number;
}

export type IpBan = {
	ip: string;
	userId?: string;
};

export type UserIdBan = {
	ip?: string;
	userId: string;
};

export type Ban = IpBan | UserIdBan;

export interface ChatMessage {
	username: string;
	message: string;
	timestamp: number;
}

export type ServerToClientEvents = {
	map: (map: Uint8Array, size: Dimensions) => void;
	pixelUpdate: (update: Pixel[]) => void;
	users: (users: string[]) => void;
	userInfo: (userInfo: UserInfo) => void;
	chat: (message: ChatMessage[]) => void;
};

export interface PixelInfo {
	placer: string;
	placerPlaced: number;
	placerAvatar: string | null;
	placerMod: boolean;
	time: number;
}

export type ClientToServerEvents = {
	place: (pixels: Pixel[], ack: (pixels: Pixel[]) => void) => void;
	pixelInfo: (location: Coords, ack: (pixel: PixelInfo | null) => void) => void;
	ban: (ban: Ban, ack: (banId?: number) => void) => void;
	chat: (message: string) => void;
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

export function get1DPosition3D(x: number, y: number, z: number, width: number, depth: number) {
	return (x % width) + y * width + z * depth;
}

declare module '@auth/sveltekit' {
	interface User {
		id: string;
	}
}

declare module '@auth/core/jwt' {
	/** Returned by the `jwt` callback and `auth`, when using JWT sessions */
	interface JWT {
		/** User ID number stored in the database */
		userId: string;
	}
}
