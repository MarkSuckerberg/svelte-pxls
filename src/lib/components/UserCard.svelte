<script lang="ts">
	import type { LimitedUserInfo } from '$lib/userinfo';
	import Medal from '@lucide/svelte/icons/medal';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	let { info }: { info: LimitedUserInfo } = $props();

	const countClass =
		info.placed > 100000
			? 'text-yellow-300'
			: info.placed > 50000
				? 'text-gray-300'
				: info.placed > 10000
					? 'text-amber-700'
					: '';
</script>

<Avatar
	name={info.name}
	src={info.avatar || undefined}
	border={info.mod ? 'border-2 border-amber-400' : ''}
/>
<div>
	<h3 class="font-bold">
		{info.name}
		{#if info.placed > 10000}
			<Medal class={`${countClass} inline`} />
		{/if}
	</h3>
	<p class={countClass}>
		{info.placed.toLocaleString()} pixels placed
	</p>
</div>
