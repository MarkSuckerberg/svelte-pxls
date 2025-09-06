import type { Pixel } from './socket';

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
