<script lang="ts">
	import type { Ban, ClientSocket } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import { Button } from './ui/button';
	import { Card } from './ui/card';
	import CardContent from './ui/card/card-content.svelte';
	import CardHeader from './ui/card/card-header.svelte';
	import { Input } from './ui/input';

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

<Card class="absolute right-0 z-10">
	<CardHeader><h2>Mod Panel</h2></CardHeader>
	<CardContent>
		<ul>
			<li>
				<Input type="text" bind:value={userIp} name="banUserIP" />
				<Button variant="destructive" onclick={() => ban({ ip: userIp })}>Ban IP</Button>
			</li>
			<li>
				<Input type="text" bind:value={userId} name="banUserID" />
				<Button variant="destructive" onclick={() => ban({ userId })}>Ban UserID</Button>
			</li>
			<li>
				<Button variant="destructive" onclick={() => ban({ ip: userIp, userId })}>
					Ban Both
				</Button>
			</li>
			<li>
				<Input type="number" bind:value={banId} />
				<Button disabled>Unban ID</Button>
			</li>
		</ul>
	</CardContent>
</Card>
