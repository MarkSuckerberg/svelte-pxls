<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index';

	import MessageSquareMore from '@lucide/svelte/icons/message-square-more';
	import Settings from '@lucide/svelte/icons/settings';
	import TriangleDashed from '@lucide/svelte/icons/triangle-dashed';

	import type { PixelsClient } from '$lib/client.svelte';
	import type { PixelEditCanvas } from '$lib/pixelCanvas.svelte';
	import type { TemplateData } from '$lib/template.svelte';
	import type { PixelSession } from '$lib/types';
	import ShieldUser from '@lucide/svelte/icons/shield-user';
	import Chat from './Chat.svelte';
	import ModMenu from './ModMenu.svelte';
	import Template from './Template.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
	import UserSettings from './UserSettings.svelte';

	let {
		templateData,
		editData,
		session,
		client
	}: {
		templateData: TemplateData;
		editData: PixelEditCanvas;
		session: PixelSession | null;
		client: PixelsClient;
	} = $props();
</script>

<Sidebar.Root side="right" collapsible="offcanvas">
	<Tabs value="chat" class="h-full w-full">
		<Sidebar.Header class="h-[5%] flex-row">
			<div class="w-0">
				<Sidebar.Trigger
					class="relative right-12 rounded bg-background group-data-[state=open]/collapsible:right-0"
				/>
			</div>

			<TabsList>
				<TabsTrigger value="chat"><MessageSquareMore /> Chat</TabsTrigger>
				<TabsTrigger value="template"><TriangleDashed /> Template</TabsTrigger>
				<TabsTrigger value="settings"><Settings /> Settings</TabsTrigger>
				{#if client.info.mod}
					<TabsTrigger value="mod"><ShieldUser /> Mod Tools</TabsTrigger>
				{/if}
			</TabsList>
		</Sidebar.Header>
		<div class="h-[95%] flex-1 grow">
			<TabsContent value="chat" class="h-full">
				<Chat {client} signedIn={!!session} />
			</TabsContent>
			<TabsContent value="template">
				<Template
					boardSize={{ width: editData.width, height: editData.height }}
					{templateData}
				/>
			</TabsContent>
			<TabsContent value="settings">
				<UserSettings userInfo={client.info} />
			</TabsContent>
			{#if client.info.mod}
				<TabsContent value="mod">
					<ModMenu socket={client.socket} />
				</TabsContent>
			{/if}
		</div>
	</Tabs>
</Sidebar.Root>
