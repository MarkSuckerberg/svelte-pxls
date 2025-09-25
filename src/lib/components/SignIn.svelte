<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let props: { children: Snippet } & Omit<HTMLButtonAttributes, 'type'> = $props();
</script>

<form method="POST" action="/signin">
	<button {...props} type="submit">
		{@render props.children()}
	</button>
</form>
