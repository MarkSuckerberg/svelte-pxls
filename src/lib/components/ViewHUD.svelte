<script lang="ts">
	import type { PixelsClient } from '$lib/client.svelte';
	import Brush from '@lucide/svelte/icons/brush';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import Save from '@lucide/svelte/icons/save';
	import Exit from '@lucide/svelte/icons/x';
	import { slide } from 'svelte/transition';
	import type { ArrayGrid } from '../arrayGrid';
	import { center, colorNames, colors, type Coords } from '../types';
	import PixelCount from './PixelCount.svelte';
	import ReportForm from './ReportForm.svelte';
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
		canvas,
		client
	}: {
		selectedPixel: Coords | undefined;
		array: ArrayGrid | undefined;
		onClose: () => void;
		onDrawButton: (event: MouseEvent) => void;
		scale: number;
		canvas: HTMLCanvasElement;
		client: PixelsClient;
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
		if (!selectedPixel || !array) {
			return;
		}

		linkCopied = selectedPixel;
		const centerPan = center(array?.size, selectedPixel);
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

	const timeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	function timeFormat(time: number) {
		// Get the amount of seconds between the given date and now
		const deltaSeconds = Math.round((time - Date.now()) / 1000);

		// Array reprsenting one minute, hour, day, week, month, etc in seconds
		const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];

		// Array equivalent to the above but in the string representation of the units
		const units: Intl.RelativeTimeFormatUnit[] = [
			'second',
			'minute',
			'hour',
			'day',
			'week',
			'month',
			'year'
		];

		// Grab the ideal cutoff unit
		const unitIndex = cutoffs.findIndex((cutoff) => cutoff > Math.abs(deltaSeconds));

		// Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
		// is one day in seconds, so we can divide our seconds by this to get the # of days
		const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;

		return timeFormatter.format(Math.floor(deltaSeconds / divisor), units[unitIndex]);
	}
</script>

<div
	class="pointer-events-none absolute bottom-0 flex w-full flex-col items-center justify-center *:pointer-events-auto md:left-1/8 md:w-3/4"
	transition:slide
>
	<Button class="h-20 w-full bg-chart-2" variant="secondary" onclick={onDrawButton}>
		<Brush />
		<span>Draw</span>
		<span>-</span>
		<PixelCount userInfo={client.info} nextPixel={client.nextPixel} showRing />
	</Button>
	{#if selectedPixel}
		<Card class="w-full text-center">
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
								Time: {info
									? `${new Date(info.time).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'medium' })}, ${timeFormat(info.time)}`
									: ''}
							</li>
						{:else}
							<li>Unplaced</li>
						{/if}
					{/await}
					<li class="flex *:flex-1">
						<Button
							onclick={() => {
								onCopy();
							}}
						>
							<ClipboardCopy />
							<span>{linkCopied === selectedPixel ? 'Copied!' : 'Copy Link'}</span>
						</Button>
						<Button
							onclick={() => {
								onSave();
							}}
						>
							<Save />
							<span>Save Screenshot</span>
						</Button>
						<ReportForm pixel={selectedPixel} {client} />
					</li>
				</ul>
			</CardContent>
		</Card>
	{/if}
</div>
