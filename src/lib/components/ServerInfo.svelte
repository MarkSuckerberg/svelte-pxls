<script lang="ts">
	import Markdown from '@magidoc/plugin-svelte-marked';
	import Spinner from './ui/spinner/spinner.svelte';

	const promise = async () => {
		const response = await fetch('/api/about');

		return await response.text();
	};
</script>

<h1>Server Info</h1>

{#await promise()}
	<Spinner />
{:then info}
	{#if info}
		<div class="prose prose-invert">
			<Markdown source={info} />
		</div>
	{:else}
		Hello, and welcome to this instance of Pixels (better name pending)! The server admin has
		not set any info, so this is a placeholder. Stay tuned, I guess!
	{/if}
{/await}
