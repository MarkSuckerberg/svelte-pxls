<script lang="ts">
	import UserCard from '$lib/components/UserCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.user.name} | Steller's Pixels</title>
</svelte:head>

<UserCard info={data.user}></UserCard>
