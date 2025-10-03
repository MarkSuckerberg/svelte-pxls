<script lang="ts">
	import type { EditSet } from '$lib/EditSet.svelte';
	import type { UserInfo } from '$lib/userinfo';
	import { Eraser, X as Exit, Send, Trash } from '@lucide/svelte';
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

<Card class="fixed bottom-0 left-0 z-2 w-full rounded-b-none">
	<CardHeader class="flex">
		<Button class="h-12 flex-1 justify-end" onclick={clearEdits} variant="destructive">
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
	<CardContent>
		<div class="flex"></div>
		<div class="btn-group flex w-full flex-wrap justify-center">
			{#each colors as color, index (color)}
				<button
					onclick={() => (selectedColorIdx = index)}
					style:background-color={`#${color.toString(16).padStart(8, '0')}`}
					class="m-0 btn h-10 w-10 p-0 outline-1 disabled:opacity-100 disabled:outline-4 disabled:outline-primary-contrast-700 sm:m-0.5 sm:h-12 sm:w-12"
					aria-label={colorNames[index]}
					disabled={index === selectedColorIdx}
					title={colorNames[index]}
				>
					{#if index === 0}
						<Eraser color={`#${(color ^ 0xffffff00).toString(16).padStart(8, '0')}`} />
					{/if}
				</button>
			{/each}
		</div>
	</CardContent>
</Card>

<div class="fixed bottom-0 left-0 z-[1] w-full card bg-primary-500 p-2">
	<div class="flex">
		<Button class="h-12 flex-1 justify-end" onclick={clearEdits} variant="destructive">
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

		<Button class="m-1 h-12 w-12 p-0" onclick={onClose}>
			<Exit />
		</Button>
	</div>
	<div class="btn-group flex w-full flex-wrap justify-center">
		{#each colors as color, index (color)}
			<button
				onclick={() => (selectedColorIdx = index)}
				style:background-color={`#${color.toString(16).padStart(8, '0')}`}
				class="m-0 btn h-10 w-10 p-0 outline-1 disabled:opacity-100 disabled:outline-4 disabled:outline-primary-contrast-700 sm:m-0.5 sm:h-12 sm:w-12"
				aria-label={colorNames[index]}
				disabled={index === selectedColorIdx}
				title={colorNames[index]}
			>
				{#if index === 0}
					<Eraser color={`#${(color ^ 0xffffff00).toString(16).padStart(8, '0')}`} />
				{/if}
			</button>
		{/each}
	</div>
</div>
