<script lang="ts">
	import type { Ban, ClientSocket } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import { Button } from './ui/button';
	import { InputGroup } from './ui/input-group';
	import InputGroupAddon from './ui/input-group/input-group-addon.svelte';
	import InputGroupButton from './ui/input-group/input-group-button.svelte';
	import InputGroupInput from './ui/input-group/input-group-input.svelte';

	let { socket, userId = '' }: { socket: ClientSocket; userId?: string } = $props();

	let userIp = $state('');
	let banId = $state('');

	function ban(ban: Ban) {
		const promise = socket.emitWithAck('ban', ban);

		toast.promise(promise, {
			loading: 'Creating ban...',
			success: (id) =>
				id
					? `Ban ${id} created.`
					: 'Ban submitted, but no ID was returned by the server. Maybe a duplicate?',
			error: () => 'Error creating ban.'
		});
		promise
			.then((id) => {
				userIp = '';
				userId = '';
				banId = `${id}`;
			})
			.catch(console.error);
	}
</script>

<div class="p-4">
	<InputGroup>
		<InputGroupInput bind:value={userIp} placeholder="192.168.1.1" />
		<InputGroupAddon align="inline-end">
			<InputGroupButton variant="destructive" onclick={() => ban({ ip: userIp })}>
				Ban IP
			</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>

	<InputGroup>
		<InputGroupInput bind:value={userId} placeholder="000000-0000-0000-0000-000000000000" />
		<InputGroupAddon align="inline-end">
			<InputGroupButton variant="destructive" onclick={() => ban({ userId })}>
				Ban UserID
			</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>

	<Button variant="destructive" onclick={() => ban({ ip: userIp, userId })} class="w-full">
		Ban Both
	</Button>
</div>
