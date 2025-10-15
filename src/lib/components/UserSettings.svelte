<script lang="ts">
	import type { UserInfo } from '$lib/userinfo';
	import SignIn from './SignIn.svelte';
	import Button, { buttonVariants } from './ui/button/button.svelte';
	import InputGroupAddon from './ui/input-group/input-group-addon.svelte';
	import InputGroupInput from './ui/input-group/input-group-input.svelte';
	import InputGroupText from './ui/input-group/input-group-text.svelte';
	import InputGroup from './ui/input-group/input-group.svelte';
	import Separator from './ui/separator/separator.svelte';

	let { userInfo }: { userInfo?: UserInfo } = $props();
</script>

<div class="flex flex-col gap-2 p-2">
	<h2 class="text-xl font-bold">User Settings</h2>

	<p>Somehow, there's nothing here yet.</p>

	{#if userInfo}
		<Separator />

		<h3 class="font-bold">Account: {userInfo.name}</h3>

		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>Avatar URL</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput value={userInfo.avatar} disabled />
		</InputGroup>

		<SignIn class={buttonVariants({ variant: 'default' }) + ' w-full'}>
			Link another account
		</SignIn>

		<form action="/signout" method="POST">
			<Button variant="destructive" type="submit" class="w-full">Sign out</Button>
		</form>
	{:else}
		<SignIn class={buttonVariants({ variant: 'default' }) + ' w-full'}>Sign in</SignIn>
	{/if}
</div>
