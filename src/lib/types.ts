export const WIDTH = 5000;
export const HEIGHT = 500;

export const DEFAULT_COLOR_INDEX = 8;

import colorFile from './colors.json';
import type { Session } from '@auth/sveltekit';

export interface Coords {
	x: number;
	y: number;
}

export interface Dimensions {
	width: number;
	height: number;
}

export type ServerToClientEvents = {
	pixelUpdate: (update: Pixel[]) => void;
	connection: (src: string) => void;
	heartbeat: (time: number) => void;
	users: (users: SocketData[]) => void;
	map: (map: Uint8Array, size: Dimensions) => void;
};

export type ClientToServerEvents = {
	place: (pixels: Pixel[], ack: (pixels: Pixel[]) => void) => void;
};

export type InterServerEvents = never;

export type SocketData = {
	session: Session | null;
};

export type Pixel = {
	x: number;
	y: number;
	color: number;
};

export type PixelLike =
	| Pixel
	| {
			pos: { x: number; y: number };
			color: number;
	  }
	| { pos: [number, number]; color: number };

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

export function get1DPosition2D(x: number, y: number, width: number, height: number) {
	return (x % width) + y * width;
}
