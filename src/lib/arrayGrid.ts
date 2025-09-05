import type { Pixel } from './socket';
import { readFile, writeFile, copyFile } from 'fs/promises';

const VERSION = 1;
const HEADER_SIZE = 6;

//Why did I do all this though
export class Int2DArrayHelper {
	[row: number]: Uint8Array;

	public constructor(array: Uint8Array, width: number, height: number) {
		if (array.byteLength !== width * height) {
			throw new Error('Invalid array width and height');
		}

		return new Proxy(this, {
			get(_target, property) {
				const row = Number(property);

				if (isNaN(row) || row > height) {
					throw new Error('Invalid index');
				}

				return array.subarray(row * width, (row + 1) * width - 1);
			},

			has(_target, property) {
				const row = Number(property);

				if (isNaN(row) || row > height) {
					return false;
				}

				return true;
			},

			set(_target, property, newValues) {
				const row = Number(property);

				if (isNaN(row) || row > height) {
					return false;
				}

				if (newValues instanceof Uint8Array && newValues.length === width) {
					array.set(newValues, row * width);
					return true;
				}

				return false;
			}
		});
	}
}

export class ArrayGrid {
	readonly array: Uint8Array;
	readonly width: number;
	readonly height: number;

	public constructor(width: number, height: number, array: Uint8Array | undefined = undefined) {
		this.width = width;
		this.height = height;

		this.array = array || new Uint8Array(width * height);
		this.grid = new Int2DArrayHelper(this.array, width, height);
	}

	public static async fromFile(file: string) {
		return readFile(file)
			.then(async (fileData) => {
				try {
					const headerSize = fileData.readUint8(0);
					const dataSize = fileData.length - headerSize;
					const version = fileData.readUint8(1);
					const width = fileData.readUint16BE(2);
					const height = fileData.readUint16BE(4);

					if (version != VERSION) {
						throw new Error('Invalid version!');
					}

					if (dataSize !== height * width) {
						throw new Error('Map data invalid size!');
					}

					return new ArrayGrid(
						width,
						height,
						new Uint8Array(fileData.buffer, headerSize, width * height)
					);
				} catch (error) {
					await copyFile(file, `${file}.bak`);
					console.error('Error reading map save. File backed up.', error);
				}
			})
			.catch(() => {
				// File couldn't be read to begin with
				return null;
			});
	}

	public async toFile(file: string) {
		const header = Buffer.allocUnsafe(HEADER_SIZE);
		header.writeUInt8(HEADER_SIZE, 0); // 1
		header.writeUInt8(VERSION, 1); // 2
		header.writeUInt16BE(this.height, 2); // 3-4
		header.writeUInt16BE(this.width, 4); // 5-6

		const data = new Uint8Array(this.width * this.height + HEADER_SIZE);

		data.set(header);
		data.set(this.array, HEADER_SIZE);

		await writeFile(file, data);
	}

	public set(pixel: Pixel) {
		if (0 > pixel.x || pixel.x > this.width || 0 > pixel.y || pixel.y > this.height) {
			throw Error('Invalid pixel position!');
		}
		this.grid[pixel.y][pixel.x] = pixel.color;

		//const position = (pixel.x % this.width) + pixel.y * this.width;

		//this.array[position] = pixel.color;
	}

	public get(x: number, y: number) {
		if (0 > x || x > this.width || 0 > y || y > this.height) {
			throw Error('Invalid pixel position!');
		}

		const position = (x % this.width) + y * this.width;

		return this.array[position];
	}

	public grid: Int2DArrayHelper;
}
