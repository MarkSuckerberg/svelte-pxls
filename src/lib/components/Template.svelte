<script lang="ts">
	let {
		boardSize,
		templateData
	}: {
		boardSize: Dimensions;
		templateData: TemplateData;
	} = $props();

	import snoozin from '$lib/snoozin.png';
	import type { TemplateData } from '$lib/template.svelte';
	import type { Dimensions } from '$lib/types';

	templateData.updateTemplate(snoozin).then(() => {
		templateData.offset = {
			width: boardSize.width / 2 - templateData.templateSize.width / 2,
			height: boardSize.height / 2 - templateData.templateSize.height / 2
		};
	});
</script>

<div class="absolute right-0 z-10 h-48 w-[30em] preset-filled-surface-500 p-2 text-black">
	<input type="url" name="templateUrl" bind:value={templateData.inputUrl} />
	<button class="btn preset-filled-primary-500" onclick={() => templateData.updateTemplate()}>
		Change Template
	</button>

	<br />

	<div>
		<label>
			<span class="mr-4">X</span>
			<input
				type="number"
				id="templateX"
				min="0"
				max={boardSize.width - templateData.templateSize.width}
				bind:value={templateData.input.width}
				oninput={() => templateData.updateOffset()}
			/>
			<input
				type="range"
				id="templateX"
				min="0"
				max={boardSize.width - templateData.templateSize.width}
				bind:value={templateData.input.width}
				oninput={() => templateData.updateOffset()}
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
				max={boardSize.height - templateData.templateSize.height}
				bind:value={templateData.input.height}
				oninput={() => templateData.updateOffset()}
			/>
			<input
				type="range"
				id="templateY"
				min="0"
				max={boardSize.height - templateData.templateSize.height}
				bind:value={templateData.input.height}
				oninput={() => templateData.updateOffset()}
			/>
		</label>
	</div>
	<button class="btn preset-filled-primary-500" onclick={() => templateData.updateOffset()}>
		Change Offset
	</button>
</div>
