<script lang="ts">
	import { Brush, ClipboardCopy, X as Exit } from '@lucide/svelte';
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
		nextPixel
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
						class="m-auto btn w-1/2 preset-filled"
						onclick={() => {
							onCopy();
						}}
					>
						<ClipboardCopy />
						<span>{linkCopied === selectedPixel ? 'Copied!' : 'Copy Link'}</span>
					</button>
				</li>
			</ul>
		</div>
	{/if}
</div>
