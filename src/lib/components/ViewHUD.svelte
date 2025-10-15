<script lang="ts">
	import type { PixelsClient } from '$lib/client.svelte';
	import Brush from '@lucide/svelte/icons/brush';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import Save from '@lucide/svelte/icons/save';
	import Exit from '@lucide/svelte/icons/x';
	import { slide } from 'svelte/transition';
	import type { ArrayGrid } from '../arrayGrid';
	import { colorNames, colors, type Coords } from '../types';
	import PixelCount from './PixelCount.svelte';
	import Button from './ui/button/button.svelte';
	import { Card, CardContent } from './ui/card';
	import { Popover } from './ui/popover';
	import PopoverContent from './ui/popover/popover-content.svelte';
	import PopoverTrigger from './ui/popover/popover-trigger.svelte';
	import { Spinner } from './ui/spinner';
	import UserCard from './UserCard.svelte';

	let {
		selectedPixel,
		array,
		onDrawButton,
		onClose,
		scale = 1,
		center,
		canvas,
		client
	}: {
		selectedPixel: Coords | undefined;
		array: ArrayGrid | undefined;
		onClose: () => void;
		onDrawButton: (event: MouseEvent) => void;
		scale: number;
		center: (coords: Coords) => Coords;
		canvas: HTMLCanvasElement;
		client: PixelsClient;
	} = $props();

	let linkCopied: Coords | undefined = $state();

	let progress = $derived((client.info.pixels / client.info.maxPixels) * 100);

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
	transition:slide
>
	<Button class="h-20 w-4xl bg-chart-2" variant="secondary" onclick={onDrawButton}>
		<Brush />
		<span>Draw</span>
		<span>-</span>
		<PixelCount userInfo={client.info} nextPixel={client.nextPixel} showRing />
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
					{#await client.socket.emitWithAck('pixelInfo', selectedPixel)}
						<li><Spinner /></li>
					{:then info}
						{#if info}
							<li>
								Placer:
								<Popover>
									<PopoverTrigger class="underline">
										{info.placer.name}
									</PopoverTrigger>
									<PopoverContent class="flex gap-2">
										<UserCard info={info.placer} />
									</PopoverContent>
								</Popover>
							</li>
							<li>
								Time: {info ? new Date(info.time) : ''}
							</li>
						{:else}
							<li>Unplaced</li>
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
