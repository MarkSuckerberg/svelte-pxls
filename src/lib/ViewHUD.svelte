<script lang="ts">
	import { Brush, X as Exit, ClipboardCopy } from '@lucide/svelte';
	import { colorNames, colors, type Coords } from './socket';
	import type { ArrayGrid } from './arrayGrid';

	let {
		selectedPixel,
		array,
		onDrawButton,
		scale,
		center
	}: {
		selectedPixel: Coords | undefined;
		array: ArrayGrid | undefined;
		onDrawButton: (event: MouseEvent) => void;
		scale: number;
		center: (coords: Coords) => Coords;
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
</script>

<div
	class="pointer-events-none absolute bottom-0 flex w-full flex-col items-center justify-center *:pointer-events-auto"
>
	<button class="btn h-20 w-4xl preset-filled-tertiary-500" onclick={onDrawButton}>
		<Brush />
		<span>Draw</span>
	</button>
	{#if selectedPixel}
		<div class="h-20 w-full card preset-filled-primary-500 text-center">
			<button
				class="float-right m-1 btn h-12 w-12 flex-1 p-0"
				onclick={() => {
					selectedPixel = undefined;
					linkCopied = undefined;
				}}
			>
				<Exit />
			</button>
			<div class="flex h-20 flex-col justify-center">
				<p>
					Selected Pixel: ({selectedPixel.x}, {selectedPixel.y})
				</p>
				<p>
					Color: {selectedPixelColor}
				</p>
				<button
					class="m-auto btn w-1/2 preset-filled"
					onclick={() => {
						onCopy;
					}}
				>
					<ClipboardCopy />
					<span>{linkCopied === selectedPixel ? 'Copied!' : 'Copy Link'}</span>
				</button>
			</div>
		</div>
	{/if}
</div>
