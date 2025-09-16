<script lang="ts">
	import { toaster } from '$lib/toaster';
	import type { Ban, ClientSocket } from '$lib/types';

	let { socket, userId = '' }: { socket: ClientSocket; userId?: string } = $props();

	let userIp = $state('');
	let banId = $state('');

	function ban(ban: Ban) {
		const promise = socket.emitWithAck('ban', ban);

		toaster.promise(promise, {
			loading: {
				title: 'Creating ban...'
			},
			success: (id) =>
				id
					? {
							title: 'Created.',
							description: `Ban ${id} created.`
						}
					: {
							title: 'Created?',
							description:
								'Ban submitted, but no ID was returned by the server. Maybe a duplicate?'
						},
			error: () => ({
				title: 'Error!',
				description: 'Error creating ban.'
			})
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

<ul class="absolute right-0 z-10 card bg-tertiary-500 p-1">
	<li>
		<h2>Mod Panel</h2>
	</li>
	<li>
		<input type="text" bind:value={userIp} name="banUserIP" />
		<button class="btn preset-filled-error-500" onclick={() => ban({ ip: userIp })}>
			Ban IP
		</button>
	</li>
	<li>
		<input type="number" bind:value={userId} name="banUserID" />
		<button class="btn preset-filled-error-500" onclick={() => ban({ userId: Number(userId) })}>
			Ban UserID
		</button>
	</li>
	<li>
		<button
			class="btn w-full preset-filled-error-100-900"
			onclick={() => ban({ ip: userIp, userId: Number(userId) })}
		>
			Ban Both
		</button>
	</li>
	<li>
		<input type="number" bind:value={banId} />
		<button class="btn preset-filled-primary-500" disabled>Unban ID</button>
	</li>
</ul>
