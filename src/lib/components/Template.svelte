<script lang="ts">
	let {
		boardSize,
		templateData
	}: {
		boardSize: Dimensions;
		templateData: TemplateData;
	} = $props();

	import type { TemplateData } from '$lib/template.svelte';
	import type { Dimensions } from '$lib/types';
	import Upload from '@lucide/svelte/icons/upload';
	import { toast } from 'svelte-sonner';
	import Checkbox from './ui/checkbox/checkbox.svelte';
	import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from './ui/empty';
	import EmptyTitle from './ui/empty/empty-title.svelte';
	import { Input } from './ui/input';
	import InputGroupAddon from './ui/input-group/input-group-addon.svelte';
	import InputGroupButton from './ui/input-group/input-group-button.svelte';
	import InputGroupInput from './ui/input-group/input-group-input.svelte';
	import InputGroupText from './ui/input-group/input-group-text.svelte';
	import InputGroup from './ui/input-group/input-group.svelte';
	import Separator from './ui/separator/separator.svelte';

	let files: FileList | undefined = $state();

	/*
	templateData.updateTemplate(snoozin).then(() => {
		templateData.offset = {
			width: boardSize.width / 2 - templateData.templateSize.width / 2,
			height: boardSize.height / 2 - templateData.templateSize.height / 2
		};
	});
	*/

	function onChange() {
		if (!files || files.length < 1) {
			toast.error('No file selected.');
			return;
		}

		const file = files.item(0);

		if (!file) {
			toast.error('Invalid file!');
			return;
		}

		templateData.setTemplate(file);
	}

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
		}
	}
</script>

<form class="flex flex-col gap-2 p-2">
	<h2 class="text-xl font-bold">Template Settings</h2>

	<Separator />

	<InputGroup>
		<InputGroupInput bind:value={templateData.inputUrl} type="url" placeholder="Template URL" />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={() => templateData.updateTemplate()} variant="default">
				Set Template
			</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>

	<Input type="file" accept="image/*" bind:files onchange={() => onChange()} />

	<Separator />

	<InputGroup>
		<InputGroupAddon align="inline-start" class="p-2">
			<InputGroupText>X offset</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={templateData.input.width}
			type="range"
			min="0"
			max={boardSize.width - templateData.templateSize.width}
			oninput={() => templateData.updateOffset()}
		/>
		<InputGroupInput
			bind:value={templateData.input.width}
			type="number"
			min="0"
			max={boardSize.width - templateData.templateSize.width}
			class="text-right"
			onchange={() => templateData.updateOffset()}
		/>
		<InputGroupAddon align="inline-end" class="p-2">
			<InputGroupText>px</InputGroupText>
		</InputGroupAddon>
	</InputGroup>

	<InputGroup>
		<InputGroupAddon align="inline-start" class="p-2">
			<InputGroupText>Y offset</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={templateData.input.height}
			type="range"
			min="0"
			max={boardSize.height - templateData.templateSize.height}
			onchange={() => templateData.updateOffset()}
		/>
		<InputGroupInput
			bind:value={templateData.input.height}
			type="number"
			min="0"
			max={boardSize.height - templateData.templateSize.height}
			class="text-right"
			oninput={() => templateData.updateOffset()}
		/>
		<InputGroupAddon align="inline-end" class="p-2">
			<InputGroupText>px</InputGroupText>
		</InputGroupAddon>
	</InputGroup>

	<Separator />

	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>Flip Y</InputGroupText>
			<Checkbox
				bind:checked={templateData.flipY}
				onCheckedChange={() => templateData.updateTemplate()}
			/>
		</InputGroupAddon>

		<InputGroupAddon>
			<InputGroupText>Show Full</InputGroupText>
			<Checkbox
				bind:checked={templateData.full}
				onCheckedChange={() => templateData.updateTemplate()}
			/>
		</InputGroupAddon>
	</InputGroup>

	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>Resize? (X/Y):</InputGroupText>
			<Checkbox
				bind:checked={templateData.resize}
				onCheckedChange={() => templateData.updateTemplate()}
			/>
		</InputGroupAddon>

		<InputGroupInput
			type="number"
			min="0"
			max={boardSize.width}
			bind:value={templateData.resizeDimensions.width}
			onchange={() => templateData.updateTemplate()}
			disabled={!templateData.resize}
		/>
		<InputGroupInput
			type="number"
			min="0"
			max={boardSize.height}
			bind:value={templateData.resizeDimensions.height}
			onchange={() => templateData.updateTemplate()}
			disabled={!templateData.resize}
		/>
	</InputGroup>

	<InputGroup class="gap-4 pr-4">
		<InputGroupAddon>
			<InputGroupText>Template Opacity</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput type="range" bind:value={templateData.opacity} min="0" max="100" />
	</InputGroup>

	<Separator />

	<div ondrop={onDrop} ondragover={(event) => event.preventDefault()} role="form">
		{#if templateData.inputUrl}
			<figure class="rounded border bg-accent-foreground p-2">
				<img
					src={templateData.inputUrl}
					alt="Uploaded file"
					class="h-auto w-full"
					style="image-rendering: pixelated"
				/>
			</figure>
		{:else}
			<Empty class="border border-dashed ">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Upload />
					</EmptyMedia>
					<EmptyTitle>Upload Template</EmptyTitle>
					<EmptyDescription>
						Upload a template to perfect your pixel placement!
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		{/if}
	</div>
</form>
