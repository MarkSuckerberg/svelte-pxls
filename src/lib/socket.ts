export const WIDTH = 500;
export const HEIGHT = 500;

export type ServerToClientEvents = {
	pixelUpdate: (update: Pixel[]) => void;
	connection: (src: string) => void;
	heartbeat: (time: number) => void;
	users: (users: SocketData[]) => void;
	map: (map: Uint8Array, width: number, height: number) => void;
};

export type ClientToServerEvents = {
	place: (pixels: Pixel[], ack: (pixels: Pixel[]) => void) => void;
};

export type InterServerEvents = never;

export type SocketData = {
	name: string;
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

export const colors: number[] = [
	0xccccccff, 0xffffffff, 0x000000ff, 0xff0000ff, 0x00ff00ff, 0x0000ffff
];

export const colorsBackwards: number[] = [
	0xffcccccc, 0xffffffff, 0xff000000, 0xff0000ff, 0x0ff00ff00, 0xffff0000
];
