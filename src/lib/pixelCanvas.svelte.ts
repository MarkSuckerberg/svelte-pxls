import { ArrayGrid } from './arrayGrid';
import { EditSet } from './EditSet.svelte';
import { colorsBackwards, colorToRGB, type Coords, type Dimensions, type Pixel } from './types';

export class PixelCanvas {
	public readonly canvas: HTMLCanvasElement;
	public readonly context: CanvasRenderingContext2D;
	public readonly array: ArrayGrid | undefined;

	public readonly width: number = $state(500);
	public readonly height: number = $state(500);

	private _rect: DOMRect | undefined;

	public constructor(
		canvas: HTMLCanvasElement,
		{ width, height }: Dimensions,
		array: Uint8Array | undefined = undefined,
		backgroundFill: number | undefined = undefined
	) {
		canvas.width = width;
		canvas.height = height;

		this.canvas = canvas;
		const getContext = canvas.getContext('2d');

		if (!getContext) {
			throw Error('Unable to get canvas context!');
		}

		this.context = getContext;
		this.width = width;
		this.height = height;
		this._rect = $state(this.canvas.getBoundingClientRect());

		if (array) {
			this.array = new ArrayGrid({ width, height }, array);

			this.setData(array);
		} else if (backgroundFill) {
			const { red, green, blue, alpha } = colorToRGB(backgroundFill);
			this.context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
			this.context.fillRect(0, 0, width, height);
		}
	}

	public get rect() {
		this._rect = this._rect ?? this.canvas.getBoundingClientRect();

		return this._rect;
	}

	public invalidateRect() {
		this._rect = undefined;
	}

	public setPixel(pixel: Pixel) {
		const { x, y, color } = pixel;
		const { red, green, blue, alpha } = colorToRGB(color);

		this.array?.set(pixel);

		this.context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
		this.context.fillRect(x, y, 1, 1);
	}

	public setPixels(pixel: Pixel[]) {
		pixel.forEach((pixel) => this.setPixel(pixel));
	}

	public fromScreenEvent(
		event: MouseEvent | PointerEvent,
		bounds: DOMRect = this.rect,
		floored = true
	) {
		return this.fromScreen({ x: event.clientX, y: event.clientY }, bounds, floored);
	}

	public fromScreen({ x, y }: Coords, bounds: DOMRect = this.rect, floored = true): Coords {
		const boardX = (x - bounds.left) / (bounds.width / this.width);
		const boardY = (y - bounds.top) / (bounds.height / this.height);

		return {
			x: floored ? Math.floor(boardX) : boardX,
			y: floored ? Math.floor(boardY) : boardY
		};
	}

	public toScreen(
		boardX: number,
		boardY: number,
		offset: { x: number; y: number },
		scale: number
	) {
		if (scale < 0) {
			boardX -= this.width - 1;
			boardY -= this.height - 1;
		}
		return {
			x: (boardX + offset.x - (this.width - window.innerWidth / scale) / 2) * scale,
			y: (boardY + offset.y - (this.height - window.innerHeight / scale) / 2) * scale
		};
	}

	public setAtScreen(screenCoords: Coords, color: number) {
		const { x, y } = this.fromScreen(screenCoords);
		this.setPixel({ x, y, color });
	}

	public setData(rawMap: Uint8Array) {
		const map = new Uint8Array(rawMap);
		const result = new Uint32Array(map.length);

		map.forEach((value, idx) => {
			result[idx] = colorsBackwards[value];
		});

		const data = new ImageData(new Uint8ClampedArray(result.buffer), this.width, this.height);
		this.context.putImageData(data, 0, 0);
	}

	public getPixel({ x, y }: Coords) {
		return this.array?.get(x, y);
	}
}

export class PixelEditCanvas extends PixelCanvas {
	public edits: EditSet;

	public constructor(
		canvas: HTMLCanvasElement,
		dimensions: Dimensions,
		edits: Pixel[] | undefined = undefined
	) {
		super(canvas, dimensions);
		this.edits = $state(new EditSet(dimensions, edits));
		if (edits) {
			this.setPixels(edits);
		}
	}

	public deletePixel({ x, y }: Coords) {
		this.edits.delete({ x, y });
		this.context.clearRect(x, y, 1, 1);
	}

	public deleteAtScreen(coords: Coords) {
		this.deletePixel(this.fromScreen(coords));
	}

	public override getPixel(coords: Coords): number | undefined {
		return this.edits.get(coords)?.color;
	}

	public override setPixel(pixel: Pixel) {
		this.edits.set(pixel);
		localStorage.setItem('currentEdits', this.edits.toJson());
		super.setPixel(pixel);
	}

	public clearEdits() {
		this.edits.clear();
		this.context.clearRect(0, 0, this.width, this.height);
		localStorage.setItem('currentEdits', '[]');
	}

	public getAll() {
		return this.edits.getAll();
	}
}
