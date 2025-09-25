<script lang="ts">
	import type { ChatMessage, ClientSocket } from '$lib/types';
	import { MessageSquareMore, Smile, X } from '@lucide/svelte';
	import type { Picker } from 'emoji-picker-element';
	import { onMount } from 'svelte';
	import SignIn from './SignIn.svelte';

	let messages: ChatMessage[] = $state([]);
	let { socket, signedIn = false }: { socket: ClientSocket; signedIn?: boolean } = $props();

	let pickerContainer: HTMLElement | undefined = $state();
	let emojiPicker: Picker;

	onMount(() => {
		import('emoji-picker-element/picker').then(async (picker) => {
			emojiPicker = new picker.default();
			pickerContainer?.appendChild(emojiPicker);

			emojiPicker.addEventListener('emoji-click', (event) => {
				currentMessage += event.detail.unicode;
			});
		});

		socket.on('chat', (data) => {
			messages = messages.concat(data);
		});
	});

	$effect(() => {
		messages;

		//Returned because we don't want it triggering every time the user scrolls
		return () => {
			if (!scrollable) {
				return;
			}
			//If at exact top (usually from page load) or at least 90% scrolled down
			if (
				scrollable.scrollTop == 0 ||
				scrollable.scrollTop > scrollable.scrollHeight * 0.9 - scrollable.clientHeight
			) {
				scrollable.scrollTop = scrollable.scrollHeight;
			}
		};
	});

	let currentMessage = $state('');

	function sendMessage() {
		if (!currentMessage) {
			return;
		}
		socket.emit('chat', currentMessage);
		currentMessage = '';
	}

	let scrollable: HTMLDivElement | undefined = $state();

	let open = $state(true);
	let emoji = $state(false);
</script>

<section
	class="absolute right-0 flex h-full max-h-[40em] w-1/12 min-w-[25em] resize flex-col preset-filled-surface-500"
	style:visibility={open ? '' : 'hidden'}
>
	<header class="my-1">
		<h2 class="inline font-bold">Chat</h2>
		<button class="float-end" onclick={() => (open = false)}>
			<X />
		</button>
	</header>
	<!-- Table -->
	<div class="table-wrap flex-12 preset-filled-surface-300-700" bind:this={scrollable}>
		<ul>
			{#each messages as { timestamp, username, message }}
				<li>
					<span class="font-bold">
						<u title={new Date(timestamp).toISOString()}>
							{new Date(timestamp).toLocaleTimeString()}
						</u>
						{username}:
					</span>

					{message}
				</li>
			{/each}
		</ul>
	</div>
	<!-- Footer -->
	{#if signedIn}
		<footer class="flex justify-between">
			<input
				type="text"
				bind:value={currentMessage}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						sendMessage();
						event.stopPropagation();
					}
				}}
				class="input text-black"
			/>
			<div
				style:visibility={emoji ? '' : 'hidden'}
				class="absolute top-full"
				bind:this={pickerContainer}
			></div>
			<button onclick={() => (emoji = !emoji)}>
				<Smile />
			</button>
			<button
				class="btn preset-filled-primary-500"
				onclick={() => sendMessage()}
				disabled={!currentMessage}
			>
				Send
			</button>
		</footer>
	{:else}
		<SignIn class="mx-auto btn h-full w-full preset-filled-primary-500">
			<button>Sign in to chat!</button>
		</SignIn>
	{/if}
</section>

{#if !open}
	<button onclick={() => (open = true)} class="absolute right-0 btn preset-filled-surface-500">
		<span>Chat</span>
		<MessageSquareMore />
	</button>
{/if}
