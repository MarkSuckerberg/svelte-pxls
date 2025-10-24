<script lang="ts">
	import type { EditSet } from '$lib/EditSet.svelte';
	import type { UserInfo } from '$lib/userinfo';
	import Eraser from '@lucide/svelte/icons/eraser';
	import Send from '@lucide/svelte/icons/send';
	import Trash from '@lucide/svelte/icons/trash';
	import Exit from '@lucide/svelte/icons/x';
	import { slide } from 'svelte/transition';
	import { colorNames, colors } from '../types';
	import PixelCount from './PixelCount.svelte';
	import { Button } from './ui/button';
	import { Card, CardContent, CardHeader } from './ui/card';

	let {
		selectedColorIdx = $bindable(),
		clearEdits,
		edits,
		onSubmit,
		onClose,
		userInfo,
		nextPixel
	}: {
		selectedColorIdx: number;
		clearEdits: (event: MouseEvent) => void;
		onSubmit: (event: MouseEvent) => void;
		onClose: (event: MouseEvent) => void;
		edits: EditSet;
		userInfo: UserInfo;
		nextPixel: number;
	} = $props();
</script>

<div transition:slide class="fixed bottom-0 left-0 z-2 w-full rounded-b-none">
	<Card class="w-full gap-1 rounded-b-none">
		<CardHeader class="flex">
			<Button
				class="h-12 flex-1 justify-end"
				onclick={clearEdits}
				variant="destructive"
				disabled={!edits.size}
			>
				<span>Clear {edits.size} Edit{edits.size === 1 ? '' : 's'}</span>
				<Trash />
			</Button>

			<div class="mx-2 flex-1">
				<PixelCount {userInfo} {nextPixel} showBar usedPixels={edits.size} />
			</div>

			<Button
				class="m-1 h-12 flex-12"
				onclick={onSubmit}
				aria-keyshortcuts="enter"
				disabled={!edits.size}
			>
				<span>Send</span>
				<Send />
			</Button>

			<Button class="m-1 h-12 w-12 bg-transparent p-0 text-destructive" onclick={onClose}>
				<Exit />
			</Button>
		</CardHeader>
		<CardContent class="px-0 sm:px-2 md:px-8">
			<div class="btn-group flex w-full flex-wrap justify-center">
				{#each colors as color, index (color)}
					<button
						onclick={() => (selectedColorIdx = index)}
						style:background-color={`#${color.toString(16).padStart(8, '0')}`}
						class="m-0 btn h-6 w-6 p-0 outline-1 disabled:opacity-100 disabled:outline-4 disabled:outline-primary-contrast-700 md:m-0.5 md:h-12 md:w-12"
						aria-label={colorNames[index]}
						disabled={index === selectedColorIdx}
						title={colorNames[index]}
					>
						{#if index === 0}
							<Eraser
								color={`#${(color ^ 0xffffff00).toString(16).padStart(8, '0')}`}
							/>
						{/if}
					</button>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
