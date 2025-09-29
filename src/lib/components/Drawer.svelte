<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, name }: { children: Snippet; name: string } = $props();

	let open = $state(false);
</script>

<div class="absolute top-5 right-0">
	<button class="btn preset-filled-primary-500" onclick={() => (open = !open)}>{name}</button>
</div>

<div style:visibility={open ? '' : 'hidden'} class="absolute right-0">
	<button class="btn preset-filled-primary-500" onclick={() => (open = !open)}>{name}</button>
	{@render children()}
</div>
