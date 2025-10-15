<script lang="ts">
	import type { ClientSocket } from '$lib/types';
	import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
	import Spinner from './ui/spinner/spinner.svelte';
	import UserCard from './UserCard.svelte';

	let { username, socket }: { username: string; socket: ClientSocket } = $props();
</script>

<Popover>
	<PopoverTrigger class="underline">
		{username}
	</PopoverTrigger>
	<PopoverContent class="flex justify-center gap-2">
		{#await socket.emitWithAck('usernameInfo', username)}
			<Spinner />
		{:then info}
			{#if info}
				<UserCard {info} />
			{:else}
				Error, user not found!
			{/if}
		{/await}
	</PopoverContent>
</Popover>
