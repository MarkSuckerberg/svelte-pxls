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
	import { Button } from './ui/button';
	import { Input } from './ui/input';

	templateData.updateTemplate(snoozin).then(() => {
		templateData.offset = {
			width: boardSize.width / 2 - templateData.templateSize.width / 2,
			height: boardSize.height / 2 - templateData.templateSize.height / 2
		};
	});
</script>

<form class="flex flex-col gap-2 p-2">
	<label>
		<span>Template URL</span>
		<Input type="url" name="templateUrl" bind:value={templateData.inputUrl} />
		<Button onclick={() => templateData.updateTemplate()}>Change Template</Button>
	</label>

	<div>
		<label>
			<span class="mr-4">X</span>
			<Input
				type="number"
				id="templateX"
				min="0"
				max={boardSize.width - templateData.templateSize.width}
				bind:value={templateData.input.width}
				oninput={() => templateData.updateOffset()}
			/>
			<Input
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
			<Input
				type="number"
				id="templateY"
				min="0"
				max={boardSize.height - templateData.templateSize.height}
				bind:value={templateData.input.height}
				oninput={() => templateData.updateOffset()}
			/>
			<Input
				type="range"
				id="templateY"
				min="0"
				max={boardSize.height - templateData.templateSize.height}
				bind:value={templateData.input.height}
				oninput={() => templateData.updateOffset()}
			/>
		</label>
	</div>
	<Button onclick={() => templateData.updateOffset()}>Change Offset</Button>
</form>
