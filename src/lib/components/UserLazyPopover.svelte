<script lang="ts">
	import type { ClientSocket } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
	import Spinner from './ui/spinner/spinner.svelte';
	import UserCard from './UserCard.svelte';

	const {
		username,
		socket,
		children
	}: { username: string; socket: ClientSocket; children?: Snippet } = $props();
</script>

<Popover>
	<PopoverTrigger>
		{#if children}
			{@render children?.()}
		{:else}
			<span class="underline">
				{username}
			</span>
		{/if}
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
