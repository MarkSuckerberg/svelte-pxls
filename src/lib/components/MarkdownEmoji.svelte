<script lang="ts">
	import type { EmojiToken } from '$lib/emoji';
	import type { MarkdownOptions, Renderers } from '@magidoc/plugin-svelte-marked';

	export let token: EmojiToken;
	export const options: MarkdownOptions | undefined = undefined;
	export const renderers: Renderers | undefined = undefined;
</script>

{#await token.emoji then emoji}
	{#if emoji}
		{#if 'unicode' in emoji}
			<span title={token.raw}>{emoji.unicode}</span>
		{:else}
			<img src={emoji.url} title={token.raw} alt={token.raw} class="emoji" />
		{/if}
	{:else}
		{token.raw}
	{/if}
{/await}

<style>
	.emoji {
		display: inline;
		max-width: 1.5em;
		max-height: 1.5em;
		height: 1em;
		width: 1em;
		margin: 0 0.05em 0 0.1em;
		vertical-align: -0.1em;
	}
</style>
