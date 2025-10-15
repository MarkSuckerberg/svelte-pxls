<script lang="ts">
	import type { PixelsClient } from '$lib/client.svelte';
	import SignIn from '$lib/components/SignIn.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import PopoverContent from '$lib/components/ui/popover/popover-content.svelte';
	import BadgeQuestionMark from '@lucide/svelte/icons/badge-question-mark';
	import { Avatar, ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import UserLazyPopover from './UserLazyPopover.svelte';
	let { client }: { client: PixelsClient } = $props();
</script>

<div class="absolute z-10 m-2">
	{#if client.info && client.info.id != '000000-0000-0000-0000-000000000000'}
		<Popover>
			<PopoverTrigger>
				<ProgressRing
					value={client.info.placed % 100}
					size="size-16"
					meterStroke="stroke-primary-800-200"
				>
					<Avatar
						src={client.info.avatar || undefined}
						name={client.info.name}
						size="size-14"
					></Avatar>
				</ProgressRing>
			</PopoverTrigger>
			<PopoverContent>
				<h3>Signed in as:</h3>
				<ul>
					<li>
						Username: {client.info.name}
					</li>
					<li>
						ID: {client.info.id}
					</li>
					{#if client.info}
						<li>
							Level: {client.info.maxPixels - 99}
						</li>
						<li>
							Pixels: {client.info.pixels} / {client.info.maxPixels}
						</li>
						<li>
							Placed: {client.info.placed}
						</li>
						<li>
							Next pixel: {Math.max(0, 20 - (Date.now() - client.info.lastTicked))}s
						</li>
					{/if}
				</ul>

				<Popover>
					<PopoverTrigger>
						{client.currentUsers.length} user{client.currentUsers.length != 1
							? 's'
							: ''} online
					</PopoverTrigger>
					<PopoverContent>
						<ul>
							{#each client.currentUsers as username, index (index)}
								<li><UserLazyPopover {username} socket={client.socket} /></li>
							{/each}
						</ul>
					</PopoverContent>
				</Popover>

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
