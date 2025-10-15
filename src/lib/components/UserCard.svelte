<script lang="ts">
	import type { LimitedUserInfo } from '$lib/userinfo';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	let { info }: { info: LimitedUserInfo } = $props();
</script>

<Avatar
	name={info.name}
	src={info.avatar || undefined}
	border={info.mod ? 'border-2 border-amber-400' : ''}
/>
<div>
	<h3 class="font-bold">{info.name}</h3>
	<p>
		{info.placed.toLocaleString()} pixels placed
	</p>
</div>
