<script lang="ts">
	import { type ClientToServerEvents, type Coords, type ServerToClientEvents } from '$lib/socket';
	import { onMount } from 'svelte';
	import { type Socket } from 'socket.io-client';
	import interact from 'interactjs';
	import type { SignalArgs } from '@interactjs/core/scope';
	import type { GestureEvent } from '@interactjs/actions/gesture/plugin';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import { toaster } from '$lib/toaster';
	import { PixelCanvas, PixelEditCanvas } from '$lib/pixelCanvas.svelte';
	import Reticle from '$lib/Reticle.svelte';
	import EditMenu from '$lib/EditMenu.svelte';
	import ViewHud from '$lib/ViewHUD.svelte';

	let {
		pan = $bindable(),
		scale = $bindable(1),
		editing = $bindable(),
		editData,
		displayData,
		socket,
		container
	}: {
		pan: Coords;
		scale: number;
		editing: boolean;
		editData: PixelEditCanvas;
		displayData: PixelCanvas;
		socket: Socket<ServerToClientEvents, ClientToServerEvents>;
		container: HTMLDivElement;
	} = $props();

	let selectedColorIdx = $state(8);

	let selectedPixel: { x: number; y: number } | undefined = $state();

	editData.canvas.onmousedown = onMouseDown;
	editData.canvas.onpointerdown = onMouseDown;

	container.onwheel = onWheel;

	container.onmousemove = onMouseMove;
	container.onpointermove = onMouseMove;

	container.onmouseleave = () => (cursorPosition = undefined);
	container.onpointerleave = () => (cursorPosition = undefined);

	container.oncontextmenu = (event) => {
		if (!editing) {
			return;
		}
		event.preventDefault();
	};

	interact(container)
		.styleCursor(false)
		.draggable({
			inertia: true,
			onmove: (event) => handleMove(event),
			onend: () => updateLocation()
		})
		.gesturable({
			onmove: function (event: GestureEvent & SignalArgs['interactions:move']) {
				scale *= 1 + event.ds;
				handleMove(event);
			},
			onend: () => updateLocation()
		});
	interact(editData.canvas).styleCursor(false).on('tap', onTap).on('doubletap', onDoubleTap);

	function handleMove(event: SignalArgs['interactions:move'] & (PointerEvent | GestureEvent)) {
		if (event.shiftKey) {
			return;
		}

		pan.x = Math.max(
			-editData.width * 0.75,
			Math.min(editData.width * 0.75, pan.x + event.dx / scale)
		);
		pan.y = Math.max(
			-editData.height * 0.75,
			Math.min(editData.height * 0.75, pan.y + event.dy / scale)
		);

		editData.invalidateRect();
	}

	function setEditing(edit: boolean = true) {
		editing = edit;
		updateLocation();
	}

	let scrollTimer: NodeJS.Timeout | undefined;
	function onWheel(event: WheelEvent) {
		let delta = -event.deltaY;

		switch (event.deltaMode) {
			case WheelEvent.DOM_DELTA_PIXEL:
				// 53 pixels is the default chrome gives for a wheel scroll.
				delta /= 53;
				break;
			case WheelEvent.DOM_DELTA_LINE:
				// default case on Firefox, three lines is default number.
				delta /= 3;
				break;
			case WheelEvent.DOM_DELTA_PAGE:
				delta = Math.sign(delta);
				break;
		}

		const oldScale = scale;
		scale = Math.max(Math.min(scale * 1.1 ** delta, 25), 0.1);

		const dx = event.clientX - container.clientWidth / 2;
		const dy = event.clientY - container.clientHeight / 2;
		pan.x -= dx / oldScale;
		pan.x = Math.max(
			-editData.width * 0.75,
			Math.min(editData.width * 0.75, pan.x + dx / scale)
		);
		pan.y -= dy / oldScale;
		pan.y = Math.max(
			-editData.height * 0.75,
			Math.min(editData.height * 0.75, pan.y + dy / scale)
		);

		editData.invalidateRect();

		if (scrollTimer) {
			clearTimeout(scrollTimer);
			scrollTimer = undefined;
		}
		scrollTimer = setTimeout(() => {
			updateLocation();
		}, 250);
	}

	function userPlace(x: number, y: number, remove = false, color = selectedColorIdx) {
		if (0 > x || x > editData.width || 0 > y || y > editData.height) {
			throw Error('Invalid pixel placement location.');
		}

		if (remove && editData.getPixel({ x, y }) === color) {
			editData.deletePixel({ x, y });
			return;
		}

		editData.setPixel({ x, y, color });
		setEditing(true);
	}

	async function submitEdits() {
		if (!editing) {
			return;
		}

		socket.timeout(10000).emit('place', editData.getAll(), (err, pixels) => {
			if (err) {
				console.error("Server didn't respond to pixel placement! Edits not saved.");
				return;
			}
			setEditing(false);
			editData.clearEdits();
			displayData.setPixels(pixels);
		});
	}

	function submitEditsToast() {
		const promise = submitEdits().catch((reason) => console.error(reason));
		toaster.promise(promise, {
			loading: {
				title: 'Submitting pixels...'
			},
			success: () => ({
				title: 'Submitted!',
				description: 'Pixels placed.'
			}),
			error: () => ({
				title: 'Error!',
				description: 'Error placing pixels! Edits not submitted. Try again later.'
			})
		});
		return promise;
	}

	function updateLocation() {
		const newURL = new SvelteURL(window.location.href);
		newURL.search = `?x=${pan.x}&y=${pan.y}&s=${scale}`;
		if (editing) {
			newURL.search += '&edit=true';
		}
		editData.invalidateRect();
		replaceState(newURL, page.state);
		clearTimeout(scrollTimer);
	}

	let cursorPosition: { x: number; y: number } | undefined = $state();
	let reticlePosition = $derived(
		cursorPosition
			? editData.toScreen(cursorPosition.x, cursorPosition.y, pan, scale)
			: undefined
	);

	let selectedPosition = $derived(
		selectedPixel && !editing
			? editData.toScreen(selectedPixel.x, selectedPixel.y, pan, scale)
			: undefined
	);

	function onTap(event: MouseEvent) {
		if (event.button !== 1) {
			return;
		}

		const { x, y } = editData.fromScreenEvent(event);

		if (editing) {
			userPlace(x, y, !event.shiftKey);
		} else {
			selectedPixel = { x, y };
		}

		event.preventDefault();
	}

	function onDoubleTap(event: MouseEvent) {
		const { x, y } = editData.fromScreenEvent(event);

		userPlace(x, y, false);

		event.preventDefault();
	}

	function onMouseDown(event: MouseEvent) {
		if (event.shiftKey && event.buttons & 1) {
			const { x, y } = editData.fromScreenEvent(event);

			userPlace(x, y);

			event.preventDefault();
		}

		if (editing && event.buttons & 2) {
			editData.deletePixel(editData.fromScreenEvent(event));

			event.preventDefault();
		}
	}

	function onMouseMove(event: MouseEvent | PointerEvent) {
		if (!event.clientX || !editData) {
			return;
		}

		cursorPosition = editData.fromScreenEvent(event);

		if (event.shiftKey && event.buttons & 1) {
			const { x, y } = editData.fromScreenEvent(event);

			userPlace(x, y);

			event.preventDefault();
			return;
		}

		if (editing && event.buttons & 2) {
			editData.deleteAtScreen({ x: event.clientX, y: event.clientY });
			event.preventDefault();

			return;
		}
	}

	function center({ x, y }: Coords) {
		return { x: editData.width / 2 - x, y: editData.height / 2 - y };
	}
</script>

{#if reticlePosition}
	<Reticle {reticlePosition} {selectedColorIdx} {scale} />
{/if}

{#if selectedPosition}
	<div
		style:width={scale - 1 + 'px'}
		style:height={scale - 1 + 'px'}
		style:transform={`translate(${selectedPosition.x - 1}px, ${selectedPosition.y - 1}px)`}
		style="pointer-events:none; position:fixed; box-sizing: content-box; border: 2px inset black; margin: 0; background-color: #ffffff22"
	></div>
{/if}

{#if editing}
	<EditMenu
		bind:selectedColorIdx
		clearEdits={() => editData.clearEdits()}
		onSubmit={() => submitEditsToast()}
		edits={editData.edits}
		onClose={() => (editing = false)}
	/>
{/if}

{#if !editing}
	<ViewHud
		{selectedPixel}
		array={editData.array}
		{scale}
		{center}
		onDrawButton={() => (editing = true)}
	/>
{/if}

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			selectedPixel = undefined;
			setEditing(false);
		}
		if (!editing) {
			return;
		}
		if (event.key == 'Enter') {
			submitEditsToast();
		}
	}}
/>
