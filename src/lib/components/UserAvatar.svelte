<script lang="ts">
	import SignIn from '$lib/components/SignIn.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import PopoverContent from '$lib/components/ui/popover/popover-content.svelte';
	import type { UserInfo } from '$lib/userinfo';
	import type { Session } from '@auth/sveltekit';
	import BadgeQuestionMark from '@lucide/svelte/icons/badge-question-mark';
	import { Avatar, ProgressRing } from '@skeletonlabs/skeleton-svelte';
	let {
		userInfo,
		session,
		currentUsers
	}: { userInfo?: UserInfo; session?: Session | null; currentUsers: string[] } = $props();
</script>

<div class="absolute z-10 m-2">
	{#if session}
		<Popover>
			<PopoverTrigger>
				<ProgressRing
					value={(userInfo?.placed || 0) % 100}
					size="size-16"
					meterStroke="stroke-primary-800-200"
				>
					<Avatar
						src={session.user?.image || undefined}
						name={session.user?.name || 'Unknown'}
						size="size-14"
					></Avatar>
				</ProgressRing>
			</PopoverTrigger>
			<PopoverContent>
				<h3>Signed in as:</h3>
				<ul>
					<li>
						Username: {session.user?.name}
					</li>
					<li>
						ID: {session.user?.id}
					</li>
					{#if userInfo}
						<li>
							Level: {userInfo.maxPixels - 99}
						</li>
						<li>
							Pixels: {userInfo.pixels} / {userInfo.maxPixels}
						</li>
						<li>
							Placed: {userInfo.placed}
						</li>
						<li>
							Next pixel: {Math.max(0, 20 - (Date.now() - userInfo.lastTicked))}s
						</li>
					{/if}
				</ul>

				<p>
					<span title={currentUsers.join(', ')}>
						{currentUsers.length} user{currentUsers.length != 1 ? 's' : ''} online
					</span>
				</p>

				<form action="/signout" method="POST">
					<Button variant="destructive" type="submit" class="w-full">Sign out</Button>
				</form>
			</PopoverContent>
		</Popover>
	{:else}
		<SignIn>
			<Avatar name="Guest">
				<BadgeQuestionMark />
			</Avatar>
		</SignIn>
	{/if}
</div>
