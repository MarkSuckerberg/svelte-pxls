<script lang="ts">
	import { Send, Trash, X as Exit, Eraser } from '@lucide/svelte';
	import { colorNames, colors, type Pixel } from './socket';
	import type { EditSet } from './pixelCanvas.svelte';

	let {
		selectedColorIdx = $bindable(),
		clearEdits,
		edits,
		onSubmit,
		onClose
	}: {
		selectedColorIdx: number;
		clearEdits: (event: MouseEvent) => void;
		onSubmit: (event: MouseEvent) => void;
		onClose: (event: MouseEvent) => void;
		edits: EditSet;
	} = $props();
</script>

<div class="fixed bottom-0 left-0 z-[1] w-full card bg-primary-500 p-2">
	<div class="flex">
		<button
			class="m-1 btn h-12 flex-1 justify-end preset-filled-error-500"
			onclick={clearEdits}
		>
			<span>Clear {edits.size} Edit{edits.size === 1 ? '' : 's'}</span>
			<Trash />
		</button>

		<button
			class="m-1 btn h-12 flex-12 preset-filled-tertiary-500"
			onclick={onSubmit}
			aria-keyshortcuts="enter"
		>
			<span>Send</span>
			<Send />
		</button>

		<button class="m-1 btn h-12 w-12 flex-1 p-0" onclick={onClose}>
			<Exit />
		</button>
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
