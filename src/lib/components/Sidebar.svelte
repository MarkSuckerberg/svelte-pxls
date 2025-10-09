<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index';

	import MessageSquareMore from '@lucide/svelte/icons/message-square-more';
	import Settings from '@lucide/svelte/icons/settings';
	import TriangleDashed from '@lucide/svelte/icons/triangle-dashed';
	import Chat from './Chat.svelte';
	import Template from './Template.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

	let { socket, templateData, editData, session } = $props();
</script>

<Sidebar.Root side="right" collapsible="offcanvas">
	<Tabs value="chat" class="h-full w-full">
		<Sidebar.Header class="flex-row">
			<div class="w-0">
				<Sidebar.Trigger
					class="relative right-12 rounded bg-background group-data-[state=open]/collapsible:right-0"
				/>
			</div>

			<TabsList>
				<TabsTrigger value="chat"><MessageSquareMore /> Chat</TabsTrigger>
				<TabsTrigger value="template"><TriangleDashed /> Template</TabsTrigger>

				<TabsTrigger value="settings"><Settings /> Settings</TabsTrigger>
			</TabsList>
		</Sidebar.Header>
		<div class="h-full flex-1 grow">
			<TabsContent value="chat" class="h-full p-2">
				<Chat {socket} signedIn={!!session} />
			</TabsContent>
			<TabsContent value="template">
				<Template
					boardSize={{ width: editData.width, height: editData.height }}
					{templateData}
				/>
			</TabsContent>
		</div>
	</Tabs>
</Sidebar.Root>
