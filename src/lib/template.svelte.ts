import { page } from '$app/state';
import { toast } from 'svelte-sonner';
import { colorsRGB, type Dimensions } from './types';

interface TemplateSave {
	offset: Dimensions;
	inputUrl: string;
	resize: boolean;
	resizeDimensions: Dimensions;
	full: boolean;
	convert: boolean;

	flipY: boolean;
	flipX: boolean;
}

export class TemplateData {
	private readonly boardSize: Dimensions;
	private readonly templateCtx: CanvasRenderingContext2D;

	private templateData: ImageData | undefined = $state();
	private _offset: Dimensions = { width: 0, height: 0 };

	public templateSize: Dimensions = $state({ width: 0, height: 0 });
	public input: Dimensions = $state({ width: 0, height: 0 });
	public inputUrl: string = $state('');

	public flipY: boolean = $state(false);
	public flipX: boolean = $state(false);

	public resize: boolean = $state(false);
	public resizeDimensions: Dimensions = $state({ width: 50, height: 50 });

	public full: boolean = $state(false);
	public convert: boolean = $state(true);

	public get offset(): Dimensions {
		return this._offset;
	}

	public set offset(newOffset: Dimensions) {
		this.updateOffset(newOffset);
	}

	public get opacity(): number {
		return Number(this.templateCtx.canvas.style.opacity) * 100;
	}

	public set opacity(newValue: number) {
		this.templateCtx.canvas.style.opacity = (newValue / 100).toString();
	}

	constructor(templateContext: CanvasRenderingContext2D, boardSize: Dimensions) {
		this.templateCtx = templateContext;
		this.boardSize = boardSize;

		const saveString = localStorage.getItem('template');
		if (!saveString) {
			return;
		}

		const save: Partial<TemplateSave> = JSON.parse(saveString);

		if (!save.inputUrl) {
			return;
		}
		this.resize = save.resize || this.resize;
		this.resizeDimensions = save.resizeDimensions || this.resizeDimensions;
		this.full = save.full || this.full;
		this.convert = save.convert || this.convert;
		this._offset = save.offset || this._offset;
		this.flipX = save.flipX || this.flipX;
		this.flipY = save.flipY || this.flipY;
		this.updateTemplate(save.inputUrl);
	}

	public localSave() {
		if (!this.inputUrl) {
			localStorage.removeItem('template');
		}

		const save: TemplateSave = {
			offset: this._offset,
			inputUrl: this.inputUrl,
			resize: this.resize,
			resizeDimensions: this.resizeDimensions,
			full: this.full,
			convert: this.convert,
			flipX: this.flipX,
			flipY: this.flipY
		};
		localStorage.setItem('template', JSON.stringify(save));
	}

	public updateOffset(newOffset: Dimensions = this.input) {
		if (!this.templateData) {
			return;
		}

		this.templateCtx.clearRect(
			0,
			0,
			this.templateCtx.canvas.width,
			this.templateCtx.canvas.height
		);
		this._offset = newOffset;
		this.input.height = newOffset.height;
		this.input.width = newOffset.width;

		this.templateCtx.putImageData(
			this.templateData,
			this._offset.width * 3,
			this._offset.height * 3
		);

		this.localSave();
	}

	clearTemplate() {
		this.templateData = undefined;
		this.templateSize = { height: 0, width: 0 };

		this.localSave();
	}

	async setTemplate(file: Blob, dataUrl = true) {
		if (file.size > 1024 * 1024 * 10) {
			return;
		}

		const bitmap = await createImageBitmap(file, {
			resizeQuality: 'pixelated',
			resizeHeight: this.resize ? this.resizeDimensions.height : undefined,
			resizeWidth: this.resize ? this.resizeDimensions.width : undefined,
			imageOrientation: this.flipY ? 'flipY' : 'from-image'
		});
		this.templateSize = { width: bitmap.width, height: bitmap.height };

		const dataCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const ctx = dataCanvas.getContext('2d', { willReadFrequently: true });

		if (!ctx) {
			return;
		}

		this.templateCtx.clearRect(
			0,
			0,
			this.templateCtx.canvas.width,
			this.templateCtx.canvas.height
		);

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(bitmap, 0, 0);
		const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
		const array = data.data;

		this._offset.width = Math.min(
			this._offset.width,
			this.boardSize.width - this.templateSize.width
		);
		this._offset.height = Math.min(
			this._offset.height,
			this.boardSize.height - this.templateSize.height
		);

		this.input.width = this._offset.width;
		this.input.height = this._offset.height;

		for (let x = 0; x < bitmap.width; x++) {
			for (let y = 0; y < bitmap.height; y++) {
				const position = 4 * (x % bitmap.width) + 4 * y * bitmap.width;

				const red = array[position + 0];
				const green = array[position + 1];
				const blue = array[position + 2];
				const alpha = array[position + 3];

				if (alpha === 0) {
					continue;
				}

				if (this.convert) {
					const nearest = this.getNearestPaletteColor({ red, green, blue });

					this.templateCtx.fillStyle = `rgb(${nearest.red}, ${nearest.green}, ${nearest.blue})`;
				} else {
					this.templateCtx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
				}

				const realX = this.flipX ? bitmap.width - x : x;

				if (this.full) {
					this.templateCtx.fillRect(
						(realX + this._offset.width) * 3,
						(y + this._offset.height) * 3,
						3,
						3
					);
				} else {
					this.templateCtx.fillRect(
						(realX + this._offset.width) * 3 + 1,
						(y + this._offset.height) * 3 + 1,
						1,
						1
					);
				}
			}
		}

		this.templateData = this.templateCtx.getImageData(
			this._offset.width * 3,
			this._offset.height * 3,
			bitmap.width * 3,
			bitmap.height * 3
		);

		bitmap.close();

		if (dataUrl) {
			const reader = new FileReader();
			reader.readAsDataURL(file);

			reader.onload = () => {
				if (!reader.result) {
					return;
				}

				this.inputUrl = reader.result.toString();
			};
		}

		this.localSave();
	}

	async updateTemplate(newUrl: string = this.inputUrl) {
		const url = URL.parse(newUrl, page.url.origin);

		if (!url || (!url.protocol.startsWith('http') && url.protocol != 'data:')) {
			toast.error('Invalid URL!');
			this.clearTemplate();
			return;
		}

		try {
			const options = {
				referrerPolicy: 'same-origin',
				credentials: 'omit',
				headers: {
					Accept: 'image/*'
				}
			} satisfies RequestInit;

			const details = await fetch(newUrl, {
				...options,
				method: 'HEAD'
			});

			if (!details.ok) {
				this.clearTemplate();
				toast.error('Failed to fetch image!');
				return;
			}

			const type = details.headers.get('content-type');
			const length = details.headers.get('content-length');

			if (!type?.startsWith('image/')) {
				this.clearTemplate();
				toast.error('Invalid image type: ' + (type || 'none'));
				return;
			}

			if (length && Number(length) > 50 * 1024 * 1024) {
				this.clearTemplate();
				toast(
					'Selected image too large! Max 50mb. Image size: ' +
						(Number(length) / (1024 * 1024)).toFixed(1) +
						' mb.'
				);
				return;
			}

			this.inputUrl = newUrl;

			const response = await fetch(newUrl, options);

			const file = await response.blob();
			return this.setTemplate(file, false);
		} catch (error) {
			toast.error(`${error}`);
			return;
		}
	}

	getNearestPaletteColor({
		red: r1,
		green: g1,
		blue: b1
	}: {
		red: number;
		green: number;
		blue: number;
	}) {
		let smallest = Number.MAX_VALUE;
		let index = -1;

		colorsRGB.forEach(({ red: r2, green: g2, blue: b2 }, i) => {
			const diff = Math.abs(
				2 * Math.pow(r1 - r2, 2) + 4 * Math.pow(g1 - g2, 2) + 3 * Math.pow(b1 - b2, 2)
			);

			if (diff < smallest) {
				smallest = diff;
				index = i;
			}
		});

		return colorsRGB[index];
	}
}
