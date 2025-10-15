<script lang="ts">
	import type { LimitedUserInfo } from '$lib/userinfo';
	import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
	import UserCard from './UserCard.svelte';

	let { info }: { info: LimitedUserInfo } = $props();
</script>

<Popover>
	<PopoverTrigger class="underline">
		{info.name}
	</PopoverTrigger>
	<PopoverContent class="flex gap-2">
		<UserCard {info} />
	</PopoverContent>
</Popover>
