<script lang="ts">
	import type { PixelsClient } from '$lib/client.svelte';
	import { toast } from 'svelte-sonner';
	import SignIn from './SignIn.svelte';
	import Button, { buttonVariants } from './ui/button/button.svelte';
	import InputGroupAddon from './ui/input-group/input-group-addon.svelte';
	import InputGroupInput from './ui/input-group/input-group-input.svelte';
	import InputGroupText from './ui/input-group/input-group-text.svelte';
	import InputGroup from './ui/input-group/input-group.svelte';
	import Separator from './ui/separator/separator.svelte';

	let { client }: { client: PixelsClient } = $props();

	let newAvatar = $state(client.info.avatar || '');
	let newTitle = $state(client.info.title || '');

	function updateProfile() {
		if (newAvatar && !URL.canParse(newAvatar)) {
			toast.error('Invalid avatar URL!');
		}

		const promise = client.socket.timeout(1000).emitWithAck('settings', {
			imageUrl: newAvatar || null,
			title: newTitle || null
		});

		toast.promise(promise, {
			loading: 'Updating settings...',
			success: () => 'Settings updated.',
			error: () => 'Error updating settings.'
		});
	}

	let notifications = $state(Notification?.permission);
</script>

<div class="flex flex-col gap-2 p-2">
	<h2 class="text-xl font-bold">User Settings</h2>
	<Separator />

	{#if client}
		<Button
			onclick={() =>
				Notification.requestPermission().then((status) => {
					notifications = status;
				})}
			disabled={!(notifications !== 'granted')}
		>
			{notifications === 'granted' ? 'Notifications allowed' : 'Allow notifications'}
		</Button>

		<Separator />

		<h3 class="font-bold">Account settings: {client.info.name}</h3>

		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>Avatar:</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput type="url" bind:value={newAvatar} />
		</InputGroup>

		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>Title:</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput bind:value={newTitle} />
		</InputGroup>

		<Button onclick={() => updateProfile()}>Update Profile</Button>

		<Separator />

		<SignIn class={buttonVariants({ variant: 'default' }) + ' w-full'}>
			Link another account
		</SignIn>

		<Separator />

		<form action="/signout" method="POST">
			<Button variant="destructive" type="submit" class="w-full">Sign out</Button>
		</form>
	{:else}
		<SignIn class={buttonVariants({ variant: 'default' }) + ' w-full'}>Sign in</SignIn>
	{/if}
</div>
