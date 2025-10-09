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
	import Upload from '@lucide/svelte/icons/upload';
	import { Button } from './ui/button';
	import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from './ui/empty';
	import EmptyTitle from './ui/empty/empty-title.svelte';
	import { Input } from './ui/input';

	templateData.updateTemplate(snoozin).then(() => {
		templateData.offset = {
			width: boardSize.width / 2 - templateData.templateSize.width / 2,
			height: boardSize.height / 2 - templateData.templateSize.height / 2
		};
	});

	function onDrop(event: DragEvent) {
		event.preventDefault();

		if (!event.dataTransfer) {
			return;
		}

		const url = event.dataTransfer.getData('text/plain');

		if (URL.canParse(url)) {
			templateData.updateTemplate(url);
			return;
		}

		if (event.dataTransfer.files.length > 0) {
			templateData.setTemplate(event.dataTransfer.files[0]);

			const reader = new FileReader();
			reader.readAsDataURL(event.dataTransfer.files[0]);

			reader.onload = () => {
				if (!reader.result) {
					return;
				}

				templateData.updateTemplate(reader.result.toString());
			};
		}
	}
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
	<div ondrop={onDrop} ondragover={(event) => event.preventDefault()} role="form">
		{#if templateData}
			<figure class="rounded border bg-accent-foreground p-2">
				<img
					src={templateData.inputUrl}
					alt="Uploaded file"
					class="h-auto w-full"
					style="image-rendering: pixelated"
				/>
			</figure>
		{:else}
			<Empty class="border border-dashed">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Upload />
					</EmptyMedia>
					<EmptyTitle>Upload Template</EmptyTitle>
					<EmptyDescription>Upload a template to use on the site.</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button variant="outline">Upload Template</Button>
				</EmptyContent>
			</Empty>
		{/if}
	</div>
</form>
