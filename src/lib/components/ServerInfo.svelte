<script lang="ts">
	import Markdown from '@magidoc/plugin-svelte-marked';
	import Separator from './ui/separator/separator.svelte';
	import Spinner from './ui/spinner/spinner.svelte';

	const promise = async () => {
		const response = await fetch('/api/about');

		return await response.text();
	};
</script>

<h2 class="text-xl font-bold">Server info</h2>
<Separator />

<div class="prose dark:prose-invert">
	{#await promise()}
		<Spinner />
	{:then info}
		{#if info}
			<Markdown source={info} />
		{:else}
			Hello, and welcome to this instance of Pixels (better name pending)! The server admin
			has not set any info, so this is a placeholder. Stay tuned, I guess!
		{/if}
	{/await}
</div>
