import { SvelteMap } from 'svelte/reactivity';
import { get1DPosition2D, type Coords, type Dimensions, type Pixel } from './types';

export class EditSet {
	private edits: SvelteMap<number, Pixel>;
	private readonly width: number;
	private readonly height: number;

	public constructor({ width, height }: Dimensions, edits: Pixel[] | undefined = undefined) {
		this.width = width;
		this.height = height;

		this.edits = $state(new SvelteMap());
		if (edits) {
			Array.prototype.forEach.call(edits, (edit) => {
				this.edits.set(get1DPosition2D(edit.x, edit.y, width), edit);
			});
		}
	}

	public set(pixel: Pixel) {
		this.edits.set(get1DPosition2D(pixel.x, pixel.y, this.width), pixel);
	}

	public delete({ x, y }: Coords) {
		return this.edits.delete(get1DPosition2D(x, y, this.width));
	}

	public get({ x, y }: Coords) {
		return this.edits.get(get1DPosition2D(x, y, this.width));
	}

	public clear() {
		this.edits.clear();
	}

	public toJson() {
		return JSON.stringify(this.getAll());
	}

	public getAll() {
		return Array.from(this.edits.values());
	}

	public get size() {
		return this.edits.size;
	}
}
