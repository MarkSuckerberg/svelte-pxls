<script lang="ts">
	import { Brush, ClipboardCopy, X as Exit, Save } from '@lucide/svelte';
	import type { ArrayGrid } from '../arrayGrid';
	import { colorNames, colors, type ClientSocket, type Coords } from '../types';
	import type { UserInfo } from '../userinfo';
	import PixelCount from './PixelCount.svelte';

	let {
		selectedPixel,
		array,
		onDrawButton,
		onClose,
		scale = 1,
		center,
		socket,
		userInfo,
		nextPixel,
		canvas
	}: {
		selectedPixel: Coords | undefined;
		array: ArrayGrid | undefined;
		onClose: () => void;
		onDrawButton: (event: MouseEvent) => void;
		scale: number;
		center: (coords: Coords) => Coords;
		socket: ClientSocket;
		userInfo: UserInfo;
		nextPixel: number;
		canvas: HTMLCanvasElement;
	} = $props();

	let linkCopied: Coords | undefined = $state();

	let selectedPixelColor = $derived.by(() => {
		if (!selectedPixel || !array) {
			return 'unknown';
		}

		const color = array.get(selectedPixel.x, selectedPixel.y);

		return `${colorNames[color]} (index ${color}, hex #${colors[color].toString(16).padStart(8, '0')})`;
	});

	function onCopy() {
		if (!selectedPixel) {
			return;
		}

		linkCopied = selectedPixel;
		const centerPan = center(selectedPixel);
		const url = new URL(`/?x=${centerPan.x}&y=${centerPan.y}&s=${scale}`).toString();
		navigator.clipboard.writeText(url);
	}

	//TODO: Partial canvas saves using ctx.getImageData()

	function onSave() {
		canvas.toBlob((blob) => {
			if (!blob) {
				return;
			}

			const link = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			const now = new Date(Date.now());

			anchor.href = link;
			anchor.download = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-pixels.png`;
			anchor.type = 'image/png';

			anchor.click();

			anchor.remove();
			URL.revokeObjectURL(link);
		});
	}
</script>

<div
	class="pointer-events-none absolute bottom-0 flex w-full flex-col items-center justify-center *:pointer-events-auto"
>
	<button class="btn h-20 w-4xl preset-filled-tertiary-500" onclick={onDrawButton}>
		<Brush />
		<span>Draw</span>
		<span>-</span>
		<PixelCount {userInfo} {nextPixel} showRing />
	</button>
	{#if selectedPixel}
		<div class="w-full card preset-filled-primary-500 text-center">
			<button
				class="float-right m-1 btn h-12 w-12 flex-1 p-0"
				onclick={() => {
					onClose();
					linkCopied = undefined;
				}}
			>
				<Exit />
			</button>
			<ul class="flex flex-col justify-center">
				<li>
					Selected Pixel: ({selectedPixel.x}, {selectedPixel.y})
				</li>
				<li>
					Color: {selectedPixelColor}
				</li>
				{#await socket.emitWithAck('pixelInfo', selectedPixel) then info}
					{#if info}
						<li>
							Placer: {info?.user}
						</li>
						<li>
							Time: {info ? new Date(info.time) : ''}
						</li>
					{/if}
				{/await}
				<li>
					<button
						class="m-auto btn w-1/4 preset-filled"
						onclick={() => {
							onCopy();
						}}
					>
						<ClipboardCopy />
						<span>{linkCopied === selectedPixel ? 'Copied!' : 'Copy Link'}</span>
					</button>
					<button
						class="m-auto btn w-1/4 preset-filled-secondary-100-900"
						onclick={() => {
							onSave();
						}}
					>
						<Save />
						<span>Save Screenshot</span>
					</button>
				</li>
			</ul>
		</div>
	{/if}
</div>
