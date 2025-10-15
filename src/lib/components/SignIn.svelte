<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let props: { children: Snippet } & Omit<HTMLButtonAttributes, 'type'> = $props();
</script>

<form
	method="POST"
	action="/signin"
	onsubmit={(event) => {
		event.preventDefault();
		signIn();
	}}
>
	<button {...props} type="submit">
		{@render props.children()}
	</button>
</form>
