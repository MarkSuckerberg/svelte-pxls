<script lang="ts">
	import { page } from '$app/state';
	import {
		linkLocation,
		type Ban,
		type ClientSocket,
		type Dimensions,
		type Report
	} from '$lib/types';
	import { toast } from 'svelte-sonner';
	import { Button } from './ui/button';
	import { InputGroup } from './ui/input-group';
	import InputGroupAddon from './ui/input-group/input-group-addon.svelte';
	import InputGroupButton from './ui/input-group/input-group-button.svelte';
	import InputGroupInput from './ui/input-group/input-group-input.svelte';
	import Separator from './ui/separator/separator.svelte';
	import { Tooltip } from './ui/tooltip';
	import TooltipContent from './ui/tooltip/tooltip-content.svelte';
	import TooltipTrigger from './ui/tooltip/tooltip-trigger.svelte';
	import UserPopover from './UserPopover.svelte';

	let {
		socket,
		userId = '',
		gridSize
	}: { socket: ClientSocket; userId?: string; gridSize: Dimensions } = $props();

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

	let reports: Report[] = $state([]);
</script>

<div class="flex flex-col gap-2 p-2">
	<h2 class="text-xl font-bold">Moderator Actions</h2>

	<Separator />

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

	<Separator />

	<h3>Reports</h3>

	<Button
		onclick={() => {
			socket
				.timeout(1000)
				.emitWithAck('getReports')
				.then((newReports) => {
					reports = newReports;
				})
				.catch((reason) => {
					toast.error('Error refreshing reports!');
				});
		}}
	>
		{reports.length > 0 ? 'Refresh reports' : 'Fetch reports'}
	</Button>

	<table>
		<thead>
			<tr>
				<th>#</th>
				<th>Time</th>
				<th>Loc</th>
				<th>User</th>
				<th>Reason</th>
			</tr>
		</thead>
		<tbody>
			{#each reports as report (report.id)}
				<tr>
					<td>
						{report.id}
					</td>
					<td>
						{new Date(report.timestamp).toLocaleString(undefined, {
							dateStyle: 'short',
							timeStyle: 'short',
							hour12: false
						})}
					</td>
					<td>
						<a
							target="_blank"
							rel="noopener"
							href={linkLocation(
								gridSize,
								{ x: report.x, y: report.y },
								page.url
							).toString()}
							class="underline"
						>
							({report.x}, {report.y})
						</a>
					</td>
					<td>
						<UserPopover info={report.user} />
					</td>
					<td>
						<Tooltip>
							<TooltipTrigger class="underline">
								{report.reason.slice(0, 10)}...
							</TooltipTrigger>
							<TooltipContent>
								{report.reason}
							</TooltipContent>
						</Tooltip>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
