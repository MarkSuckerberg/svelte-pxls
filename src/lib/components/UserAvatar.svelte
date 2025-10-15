<script lang="ts">
	import SignIn from '$lib/components/SignIn.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import PopoverContent from '$lib/components/ui/popover/popover-content.svelte';
	import type { ClientSocket } from '$lib/types';
	import type { UserInfo } from '$lib/userinfo';
	import BadgeQuestionMark from '@lucide/svelte/icons/badge-question-mark';
	import { Avatar, ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import UserLazyPopover from './UserLazyPopover.svelte';
	let {
		userInfo,
		currentUsers,
		socket
	}: { userInfo?: UserInfo; currentUsers: string[]; socket: ClientSocket } = $props();
</script>

<div class="absolute z-10 m-2">
	{#if userInfo && userInfo.id != '000000-0000-0000-0000-000000000000'}
		<Popover>
			<PopoverTrigger>
				<ProgressRing
					value={(userInfo?.placed || 0) % 100}
					size="size-16"
					meterStroke="stroke-primary-800-200"
				>
					<Avatar
						src={userInfo?.avatar || undefined}
						name={userInfo?.name || 'Unknown'}
						size="size-14"
					></Avatar>
				</ProgressRing>
			</PopoverTrigger>
			<PopoverContent>
				<h3>Signed in as:</h3>
				<ul>
					<li>
						Username: {userInfo?.name}
					</li>
					<li>
						ID: {userInfo?.id}
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
					{#each currentUsers as username (username)}
						<UserLazyPopover {username} {socket} />
					{/each}

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
