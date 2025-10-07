<script lang="ts">
	import type { ChatMessage, ClientSocket } from '$lib/types';
	import Smile from '@lucide/svelte/icons/smile';
	import type { Picker } from 'emoji-picker-element';
	import { onMount } from 'svelte';
	import SignIn from './SignIn.svelte';
	import Button from './ui/button/button.svelte';
	import Input from './ui/input/input.svelte';
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
</script>

<section class="flex h-full flex-col px-2">
	<div class="flex h-full w-full" bind:this={scrollable}>
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
			<Input
				type="text"
				bind:value={currentMessage}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						sendMessage();
						event.stopPropagation();
					}
				}}
			/>
			<Popover onOpenChangeComplete={openEmoji}>
				<PopoverTrigger onclick={() => openEmoji(true)}>
					<Smile class="mx-2" />
				</PopoverTrigger>
				<PopoverContent>
					<div bind:this={pickerContainer}></div>
				</PopoverContent>
			</Popover>
			<Button onclick={() => sendMessage()} variant="secondary" disabled={!currentMessage}>
				Send
			</Button>
		</footer>
	{:else}
		<SignIn class="mx-auto btn h-full w-full preset-filled-primary-500">
			Sign in to chat!
		</SignIn>
	{/if}
</section>
