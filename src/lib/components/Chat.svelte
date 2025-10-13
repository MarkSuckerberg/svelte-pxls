<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { ChatMessage, ClientSocket } from '$lib/types';
	import Send from '@lucide/svelte/icons/send';
	import Smile from '@lucide/svelte/icons/smile';
	import type { Picker } from 'emoji-picker-element';
	import { onMount } from 'svelte';
	import SignIn from './SignIn.svelte';
	import { Popover } from './ui/popover';
	import PopoverContent from './ui/popover/popover-content.svelte';
	import PopoverTrigger from './ui/popover/popover-trigger.svelte';

	let messages: ChatMessage[] = $state([]);
	let { socket, signedIn = false }: { socket: ClientSocket; signedIn?: boolean } = $props();

	let pickerContainer: HTMLElement | undefined = $state();
	let emojiPicker: Picker;

	onMount(() => {
		socket.on('chat', (data) => {
			messages = messages.concat(data);
		});
	});

	async function openEmoji(open: boolean) {
		if (!open) {
			return;
		}

		if (!emojiPicker) {
			const picker = await import('emoji-picker-element/picker');
			emojiPicker = new picker.default();

			emojiPicker.addEventListener('emoji-click', (event) => {
				currentMessage += event.detail.unicode;
			});
		}

		pickerContainer?.appendChild(emojiPicker);
	}

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

	function time(timestamp: number) {
		const date = new Date(timestamp);
		const dateString = date.toLocaleDateString();

		if (dateString != new Date(Date.now()).toLocaleDateString()) {
			return dateString;
		}

		return date.toLocaleTimeString();
	}
</script>

<section class="flex h-full flex-col">
	<div class="w-full flex-1 overflow-y-scroll p-2" bind:this={scrollable}>
		<ul>
			{#each messages as { timestamp, username, message }}
				<li>
					<span class="font-bold">
						<u title={new Date(timestamp).toISOString()}>
							{time(timestamp)}
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
		<footer class="m-2 flex h-10 justify-between">
			<InputGroup.Root class="h-full">
				<InputGroup.Input
					placeholder="Send a message..."
					bind:value={currentMessage}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							sendMessage();
							event.stopPropagation();
						}
					}}
				/>
				<InputGroup.Addon align="inline-end">
					<Popover onOpenChangeComplete={openEmoji}>
						<PopoverTrigger onclick={() => openEmoji(true)}>
							<InputGroup.Button variant="ghost">
								<Smile />
							</InputGroup.Button>
						</PopoverTrigger>
						<PopoverContent align="end" class="p-0">
							<div bind:this={pickerContainer}></div>
						</PopoverContent>
					</Popover>
					<InputGroup.Button class="ml-auto" variant="default" onclick={sendMessage}>
						<Send />
						<span class="sr-only">Send</span>
					</InputGroup.Button>
				</InputGroup.Addon>
			</InputGroup.Root>
		</footer>
	{:else}
		<SignIn class="mx-auto btn h-full w-full preset-filled-primary-500">
			Sign in to chat!
		</SignIn>
	{/if}
</section>
