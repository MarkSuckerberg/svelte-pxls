<script lang="ts">
	import Brush from '@lucide/svelte/icons/brush';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import Save from '@lucide/svelte/icons/save';
	import Exit from '@lucide/svelte/icons/x';
	import type { ArrayGrid } from '../arrayGrid';
	import { colorNames, colors, type ClientSocket, type Coords } from '../types';
	import type { UserInfo } from '../userinfo';
	import PixelCount from './PixelCount.svelte';
	import Button from './ui/button/button.svelte';
	import { Card, CardContent } from './ui/card';

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

	let progress = $derived((userInfo.pixels / userInfo.maxPixels) * 100);

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
	class="pointer-events-none absolute bottom-0 left-1/8 flex w-3/4 flex-col items-center justify-center *:pointer-events-auto"
>
	<Button
		class="h-20 w-4xl bg-chart-2"
		variant="secondary"
		style={`background: linear-gradient(to right, var(--secondary) ${progress}%, var(--accent) ${progress + 0.5}%)`}
		onclick={onDrawButton}
	>
		<Brush />
		<span>Draw</span>
		<span>-</span>
		<PixelCount {userInfo} {nextPixel} showRing />
	</Button>
	{#if selectedPixel}
		<Card class="w-3/4 text-center">
			<CardContent>
				<Button
					class="float-right m-1 h-12 w-12 flex-1 p-0"
					onclick={() => {
						onClose();
						linkCopied = undefined;
					}}
				>
					<Exit />
				</Button>

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
						<Button
							class="w-1/3"
							onclick={() => {
								onCopy();
							}}
						>
							<ClipboardCopy />
							<span>{linkCopied === selectedPixel ? 'Copied!' : 'Copy Link'}</span>
						</Button>
						<Button
							class="w-1/3"
							onclick={() => {
								onSave();
							}}
						>
							<Save />
							<span>Save Screenshot</span>
						</Button>
					</li>
				</ul>
			</CardContent>
		</Card>
	{/if}
</div>
