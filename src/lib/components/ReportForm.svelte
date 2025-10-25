<script lang="ts">
	import type { PixelsClient } from '$lib/client.svelte';
	import type { Coords } from '$lib/types';
	import Flag from '@lucide/svelte/icons/flag';
	import { toast } from 'svelte-sonner';
	import { AlertDialog } from './ui/alert-dialog';
	import AlertDialogAction from './ui/alert-dialog/alert-dialog-action.svelte';
	import AlertDialogCancel from './ui/alert-dialog/alert-dialog-cancel.svelte';
	import AlertDialogContent from './ui/alert-dialog/alert-dialog-content.svelte';
	import AlertDialogDescription from './ui/alert-dialog/alert-dialog-description.svelte';
	import AlertDialogFooter from './ui/alert-dialog/alert-dialog-footer.svelte';
	import AlertDialogTitle from './ui/alert-dialog/alert-dialog-title.svelte';
	import AlertDialogTrigger from './ui/alert-dialog/alert-dialog-trigger.svelte';
	import { buttonVariants } from './ui/button/button.svelte';
	import { InputGroupAddon } from './ui/input-group';
	import InputGroupText from './ui/input-group/input-group-text.svelte';
	import InputGroupTextarea from './ui/input-group/input-group-textarea.svelte';
	import InputGroup from './ui/input-group/input-group.svelte';

	let open = $state(false);
	let message = $state('');
	let { pixel, client }: { pixel: Coords; client: PixelsClient } = $props();

	function onSubmit() {
		if (message.length < 60) {
			return;
		}

		client.socket
			.emitWithAck('report', pixel, message)
			.then((wait) => {
				if (wait) {
					toast.error(
						`Report not submitted. Please wait until ${new Date(wait)} before submitting another report.`
					);
				} else {
					message = '';
				}

				open = false;
			})
			.catch(() => {
				toast.error('Error submitting report!');
			});
	}
</script>

<AlertDialog bind:open>
	<AlertDialogTrigger class={buttonVariants({ variant: 'destructive' })}>
		<Flag />
		Report
	</AlertDialogTrigger>
	<AlertDialogContent>
		<AlertDialogTitle>Report {pixel.x}, {pixel.y}</AlertDialogTitle>
		<AlertDialogDescription>
			Please confirm you wish to report the selected pixel. Remember that you can only report
			once every thirty minutes, and abuse of the feature may lead to a ban.
		</AlertDialogDescription>
		<InputGroup>
			<InputGroupAddon align="block-start" class="border-b-1">
				<InputGroupText>
					Please include a reason for your report (minimum 60 chars).
				</InputGroupText>
			</InputGroupAddon>
			<InputGroupTextarea
				aria-invalid={message.length < 60}
				bind:value={message}
				minlength={60}
				required
				class="wrap-anywhere"
				id={`report-${pixel.x}-${pixel.y}`}
				onkeydown={(event) => event.stopPropagation()}
			></InputGroupTextarea>
		</InputGroup>
		<form onsubmit={() => onSubmit()}>
			<AlertDialogFooter>
				<AlertDialogCancel type="button">Cancel</AlertDialogCancel>
				<AlertDialogAction type="submit" class={buttonVariants({ variant: 'destructive' })}>
					Report this pixel
				</AlertDialogAction>
			</AlertDialogFooter>
		</form>
	</AlertDialogContent>
</AlertDialog>
