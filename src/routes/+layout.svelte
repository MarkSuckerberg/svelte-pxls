<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { SidebarProvider } from '$lib/components/ui/sidebar';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SidebarProvider>
	<main>
		{@render children?.()}
	</main>
</SidebarProvider>

<Toaster position="bottom-left" />
