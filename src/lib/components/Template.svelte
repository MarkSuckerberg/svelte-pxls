<script lang="ts">
	let { dispCtx, boardSize }: { dispCtx: CanvasRenderingContext2D; boardSize: Dimensions } =
		$props();
	import snoozin from '$lib/snoozin.png';
	import type { Dimensions } from '$lib/types';

	let templateUrl = '';
	let templateData: ImageData | undefined = $state();
	let templateSize: Dimensions = $state({ width: 0, height: 0 });

	let offset: Dimensions = { width: 0, height: 0 };

	let inputX: number = $state(0);
	let inputY: number = $state(0);

	let inputUrl: string = $state('');

	updateTemplate(snoozin).then(() => {
		updateOffset({
			width: boardSize.width / 2 - templateSize.width / 2,
			height: boardSize.height / 2 - templateSize.height / 2
		});
	});

	function updateOffset(newOffset: Dimensions = { width: inputX, height: inputY }) {
		if (!templateData) {
			return;
		}

		dispCtx.clearRect(
			offset.width * 3,
			offset.height * 3,
			templateData.width,
			templateData.height
		);
		offset = newOffset;
		inputX = newOffset.width;
		inputY = newOffset.height;

		dispCtx.putImageData(templateData, offset.width * 3, offset.height * 3);
	}

	async function updateTemplate(newUrl: string = inputUrl) {
		templateUrl = newUrl;
		inputUrl = newUrl;

		const response = await fetch(newUrl, {
			credentials: 'omit',
			referrerPolicy: 'same-origin'
		});

		const file = await response.blob();
		if (file.size > 1024 * 1024 * 10) {
			return;
		}

		const bitmap = await createImageBitmap(file);
		templateSize = { width: bitmap.width, height: bitmap.height };

		const dataCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const ctx = dataCanvas.getContext('2d', { willReadFrequently: true });

		if (!ctx) {
			return;
		}

		dispCtx.clearRect(0, 0, dispCtx.canvas.width, dispCtx.canvas.height);

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(bitmap, 0, 0);
		const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
		const array = data.data;

		offset.width = Math.min(offset.width, boardSize.width - templateSize.width);
		offset.height = Math.min(offset.height, boardSize.height - templateSize.height);

		inputX = offset.width;
		inputY = offset.height;

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

				dispCtx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
				dispCtx.fillRect((x + offset.width) * 3 + 1, (y + offset.height) * 3 + 1, 1, 1);
			}
		}

		templateData = dispCtx.getImageData(
			offset.width * 3,
			offset.height * 3,
			bitmap.width * 3,
			bitmap.height * 3
		);
	}
</script>

<div class="absolute right-0 z-10 h-48 w-[25em] preset-filled-surface-500 p-2 text-black">
	<input type="url" name="templateUrl" bind:value={inputUrl} />
	<button onclick={() => updateTemplate()}>Change Template</button>

	<br />

	<div>
		<label>
			<span class="mr-4">X</span>
			<input
				type="number"
				id="templateX"
				min="0"
				max={boardSize.width - templateSize.width}
				bind:value={inputX}
				oninput={() => updateOffset()}
			/>
			<input
				type="range"
				id="templateX"
				min="0"
				max={boardSize.width - templateSize.width}
				bind:value={inputX}
				oninput={() => updateOffset()}
			/>
		</label>
	</div>

	<div>
		<label>
			<span class="mr-4">Y</span>
			<input
				type="number"
				id="templateY"
				min="0"
				max={boardSize.height - templateSize.height}
				bind:value={inputY}
				oninput={() => updateOffset()}
			/>
			<input
				type="range"
				id="templateY"
				min="0"
				max={boardSize.height - templateSize.height}
				bind:value={inputY}
				oninput={() => updateOffset()}
			/>
		</label>
	</div>
	<button onclick={() => updateOffset()}>Change Offset</button>
</div>
