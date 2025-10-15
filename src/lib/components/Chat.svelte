<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { ChatMessage, ClientSocket } from '$lib/types';
	import Send from '@lucide/svelte/icons/send';
	import Smile from '@lucide/svelte/icons/smile';
	import { type Picker } from 'emoji-picker-element';
	import { onMount, tick } from 'svelte';

	import {
		MarkdownComponents,
		MarkdownTokens,
		type MarkdownOptions
	} from '@magidoc/plugin-svelte-marked';

	import type { CustomEmoji } from 'emoji-picker-element/shared';
	import { marked } from 'marked';
	import MarkdownEmoji from './MarkdownEmoji.svelte';
	import SignIn from './SignIn.svelte';
	import { buttonVariants } from './ui/button';
	import { Popover } from './ui/popover';
	import PopoverContent from './ui/popover/popover-content.svelte';
	import PopoverTrigger from './ui/popover/popover-trigger.svelte';
	import UserLazyPopover from './UserLazyPopover.svelte';

	let messages: ChatMessage[] = $state([]);
	let { socket, signedIn = false }: { socket: ClientSocket; signedIn?: boolean } = $props();

	let pickerContainer: HTMLElement | undefined = $state();
	let emojiPicker: Picker;

	const customEmoji: CustomEmoji[] = [];

	onMount(async () => {
		socket.on('chat', (data) => {
			messages = messages.concat(data);
			ScrollToBottom();
		});

		const emojiDB = new (await import('emoji-picker-element/database')).default({
			customEmoji
		});

		const indexRegex = /:[0-9a-z_\-+]/i;
		const tokenRegex = /:([0-9a-z_\-+]+):/i;

		lexer = marked.use({
			extensions: [
				{
					name: 'emoji',
					level: 'inline',
					start(src) {
						return src.match(indexRegex)?.index;
					},
					tokenizer(src, tokens) {
						const match = tokenRegex.exec(src);

						if (match === null || match.length < 2) {
							return;
						}

						const emoji = emojiDB.getEmojiByShortcode(match[1]);

						return {
							type: 'emoji',
							raw: match[0],
							emoji: emoji,
							tokens: []
						};
					}
				}
			]
		}).Lexer.lexInline;

		ScrollToBottom();
	});

	async function openEmoji(open: boolean) {
		if (!open) {
			return;
		}

		if (!emojiPicker) {
			const picker = await import('emoji-picker-element/picker');
			emojiPicker = new picker.default({
				customEmoji
			});

			emojiPicker.addEventListener('emoji-click', (event) => {
				currentMessage += event.detail.emoji.shortcodes?.at(0)
					? `:${event.detail.emoji.shortcodes[0]}:`
					: event.detail.unicode;
			});
		}

		pickerContainer?.appendChild(emojiPicker);
	}

	async function ScrollToBottom() {
		if (!scrollable) {
			return;
		}
		//If at exact top (usually from page load) or at least 90% scrolled down
		if (
			scrollable.scrollTop == 0 ||
			scrollable.scrollTop > scrollable.scrollHeight * 0.9 - scrollable.clientHeight
		) {
			await tick();

			scrollable.scroll({ top: scrollable.scrollHeight });
		}
	}

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

	let lexer: typeof marked.Lexer.lexInline | undefined = $state();

	const renderers = {
		heading: MarkdownComponents.MarkdownHeading,
		blockquote: MarkdownComponents.MarkdownBloquote,
		list: MarkdownComponents.MarkdownList,
		list_item: MarkdownComponents.MarkdownListItem,
		br: MarkdownComponents.MarkdownBr,
		code: MarkdownComponents.MarkdownCode,
		codespan: MarkdownComponents.MarkdownCodeSpan,
		//table: MarkdownComponents.MarkdownTable,
		//html: MarkdownComponents.MarkdownHtml,
		paragraph: MarkdownComponents.MarkdownParagraph,
		link: MarkdownComponents.MarkdownLink,
		text: MarkdownComponents.MarkdownText,
		def: MarkdownComponents.MarkdownDfn,
		del: MarkdownComponents.MarkdownDel,
		em: MarkdownComponents.MarkdownEm,
		hr: MarkdownComponents.MarkdownHr,
		strong: MarkdownComponents.MarkdownStrong,
		image: MarkdownComponents.MarkdownImage,
		space: MarkdownComponents.MarkdownSpace,
		escape: MarkdownComponents.MarkdownSpace,
		emoji: MarkdownEmoji
	};

	const options = { baseUrl: '/' } as unknown as MarkdownOptions;
</script>

<section class="flex h-full flex-col">
	<div class="w-full flex-1 overflow-x-hidden overflow-y-scroll p-2" bind:this={scrollable}>
		{#if lexer}
			<ul>
				{#each messages as { timestamp, username, message }}
					<li>
						<span class="font-bold">
							<span class="italic" title={new Date(timestamp).toISOString()}>
								{time(timestamp)}
							</span>
							<UserLazyPopover {username} {socket} />
						</span>

						<MarkdownTokens {renderers} {options} tokens={lexer(message)} />
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	<!-- Footer -->
	{#if signedIn}
		<footer class="m-2 flex h-10 justify-between">
			<InputGroup.Root class="h-full">
				<InputGroup.Input
					placeholder="Send a message..."
					class="max-h-4 resize-none"
					bind:value={currentMessage}
					onkeydown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey) {
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
		<SignIn class={buttonVariants({ variant: 'default' }) + 'mx-auto h-full w-full'}>
			Sign in to chat!
		</SignIn>
	{/if}
</section>
