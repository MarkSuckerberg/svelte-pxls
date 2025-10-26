<script lang="ts">
	import InfoIcon from '@lucide/svelte/icons/info';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import Megaphone from '@lucide/svelte/icons/megaphone';
	import Markdown from '@magidoc/plugin-svelte-marked';
	import AccordionContent from './ui/accordion/accordion-content.svelte';
	import AccordionItem from './ui/accordion/accordion-item.svelte';
	import AccordionTrigger from './ui/accordion/accordion-trigger.svelte';
	import Accordion from './ui/accordion/accordion.svelte';
	import Kbd from './ui/kbd/kbd.svelte';
	import Separator from './ui/separator/separator.svelte';
	import Spinner from './ui/spinner/spinner.svelte';

	const promise = async () => {
		const response = await fetch('/api/about');

		return await response.text();
	};
</script>

<div class="p-2">
	<h2 class="pb-4 text-xl font-bold">Server Info</h2>
	<Separator />

	<Accordion type="single">
		<AccordionItem value="announcements">
			<AccordionTrigger>
				<Megaphone />
				<h3>Announcements</h3>
			</AccordionTrigger>
			<AccordionContent>Nothing here, yet!</AccordionContent>
		</AccordionItem>
		<AccordionItem value="controls">
			<AccordionTrigger>
				<Keyboard />
				<h3>Controls</h3>
			</AccordionTrigger>
			<AccordionContent>
				<h4 class="font-bold">General</h4>
				<p><Kbd>Ctrl + B</Kbd> - Toggle Sidebar</p>
				<p><Kbd>G</Kbd> - Toggle Grid (Buggy)</p>
				<p><Kbd>Esc</Kbd> - Deselect Pixel / Stop Editing</p>
				<p><Kbd>LMB</Kbd> - Select Pixel</p>
				<p><Kbd>LMB</Kbd> x2 / <Kbd>Tap</Kbd> x2 - Begin Editing</p>
				<p><Kbd>Ctrl + Drag</Kbd> - Move Template</p>

				<h4 class="font-bold">Editing</h4>
				<p><Kbd title="Left mouse button">LMB</Kbd> - Place one</p>
				<p>
					<Kbd title="Shift + Left mouse button">Shift + LMB</Kbd> / <Kbd>
						Space + LMB
					</Kbd> - Place multiple
				</p>
				<p><Kbd title="Right mouse button">RMB</Kbd> - Remove currently placed pixels</p>
				<p>
					<Kbd title="Middle mouse button / Scroll wheel click">MMB</Kbd> - Pick color from
					board
				</p>
			</AccordionContent>
		</AccordionItem>
		<AccordionItem value="info">
			<AccordionTrigger>
				<InfoIcon />
				<h3>Instance Info</h3>
			</AccordionTrigger>
			<AccordionContent class="prose dark:prose-invert">
				{#await promise()}
					<Spinner />
				{:then info}
					{#if info}
						<Markdown source={info} />
					{:else}
						Hello, and welcome to this instance of Pixels (better name pending)! The
						server admin has not set any info, so this is a placeholder. Stay tuned, I
						guess!
					{/if}
				{/await}
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</div>
