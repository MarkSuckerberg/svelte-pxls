<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';

	import EditMenu from '$lib/components/EditMenu.svelte';
	import Reticle from '$lib/components/Reticle.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SignIn from '$lib/components/SignIn.svelte';
	import ViewHud from '$lib/components/ViewHUD.svelte';

	import Pop from '$lib/assets/pop.ogg';

	import { PixelCanvas, PixelEditCanvas } from '$lib/pixelCanvas.svelte';
	import { TemplateData } from '$lib/template.svelte';
	import { DEFAULT_COLOR_INDEX, type Coords, type Pixel, type PixelSession } from '$lib/types';

	import type { PixelsClient } from '$lib/client.svelte';
	import type { GestureEvent } from '@interactjs/actions/gesture/plugin';
	import type { SignalArgs } from '@interactjs/core/scope';
	import interact from 'interactjs';
	import { toast } from 'svelte-sonner';
	import { SvelteURL } from 'svelte/reactivity';
	import UserAvatar from './UserAvatar.svelte';
	import { buttonVariants } from './ui/button';

	let {
		pan = $bindable({ x: 0, y: 0 }),
		scale = $bindable(1),
		editing = $bindable(false),
		session,
		editData,
		displayData,
		container,
		initialColor,
		templateCtx,
		client
	}: {
		pan: Coords;
		scale: number;
		editing: boolean;
		session: PixelSession | null;
		editData: PixelEditCanvas;
		displayData: PixelCanvas;
		container: HTMLDivElement;
		initialColor: number;
		templateCtx: CanvasRenderingContext2D;
		client: PixelsClient;
	} = $props();

	const pop = new Audio(Pop);

	let selectedColorIdx = $state(initialColor || DEFAULT_COLOR_INDEX);

	let selectedPixel: { x: number; y: number } | undefined = $state();

	let templateData: TemplateData = $state(
		new TemplateData(templateCtx, {
			width: editData.width,
			height: editData.height
		})
	);

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
			inertia: true,
			onmove: function (event: GestureEvent & SignalArgs['interactions:move']) {
				scale *= 1 + event.ds;
				handleMove(event);
			},
			onend: () => updateLocation()
		});
	interact(editData.canvas).styleCursor(false).on('tap', onTap).on('doubletap', onDoubleTap);

	client.socket.on('map', (mapData, size) => {
		if (size.height != displayData.height || size.width != displayData.width) {
			return;
		}

		displayData.setData(mapData);
	});

	function handleMove(event: SignalArgs['interactions:move'] & (PointerEvent | GestureEvent)) {
		if (event.shiftKey || spaceDown) {
			return;
		}

		if (event.ctrlKey) {
			templateData.offset = {
				width: Math.round(templateData.offset.width + event.dx / scale),
				height: Math.round(templateData.offset.height + event.dy / scale)
			};
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

		if (displayData.getPixel({ x, y }) === color) {
			return;
		}

		if (editData.getPixel({ x, y }) === color) {
			if (remove) {
				editData.deletePixel({ x, y });
			}

			return;
		}

		if (editData.edits.size >= client.info.pixels) {
			return;
		}

		pop.play();

		editData.setPixel({ x, y, color });
		setEditing(true);
	}

	async function submitEdits() {
		if (!editing) {
			return;
		}

		const pixels: Pixel[] = await client.socket
			.timeout(10000)
			.emitWithAck('place', editData.getAll());

		setEditing(false);
		editData.clearEdits();
		displayData.setPixels(pixels);
		client.info.pixels -= pixels.length;
	}

	async function submitEditsToast() {
		const promise = submitEdits();
		toast.promise(promise, {
			loading: 'Submitting pixels...',
			success: () => 'Pixels placed.',
			error: () => 'Error placing pixels! Edits not submitted. Try again later.'
		});
		return promise.catch(console.error);
	}

	function updateLocation() {
		const newURL = new SvelteURL(window.location.href);
		newURL.search = `?x=${pan.x}&y=${pan.y}&s=${scale}`;
		if (editing) {
			newURL.search += `&edit=true&idx=${selectedColorIdx}`;
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
		if (event.button !== 0) {
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

		if (!editing) {
			userPlace(x, y, false);
		}

		event.preventDefault();
	}

	function onMouseDown(event: MouseEvent) {
		if ((event.shiftKey || spaceDown) && event.buttons & 1) {
			const { x, y } = editData.fromScreenEvent(event);

			userPlace(x, y);

			event.preventDefault();
		}

		if (!editing) {
			return;
		}

		if (event.buttons & 2) {
			editData.deletePixel(editData.fromScreenEvent(event));

			event.preventDefault();
		}

		if (event.buttons & 4) {
			const loc = editData.fromScreenEvent(event);

			const editPixel = editData.getPixel(loc);

			if (editPixel != undefined) {
				selectedColorIdx = editPixel;
				return;
			}

			const backgroundPixel = displayData.getPixel(loc);

			if (backgroundPixel != undefined) {
				selectedColorIdx = backgroundPixel;
				return;
			}

			event.preventDefault();
		}
	}

	function onMouseMove(event: MouseEvent | PointerEvent) {
		if (!event.clientX) {
			return;
		}

		cursorPosition = editData.fromScreenEvent(event);

		if ((event.shiftKey || spaceDown) && event.buttons & 1) {
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

	let spaceDown = $state(false);

	function onKey(event: KeyboardEvent, down: boolean) {
		if (event.key == ' ') {
			spaceDown = down;
			return;
		}

		if (!down) {
			return;
		}

		switch (event.key) {
			case 'Escape':
				if (selectedPixel || editing) {
					selectedPixel = undefined;
					editing = false;

					event.preventDefault();
				}
				break;
			case 'Enter':
				if (editing) {
					submitEditsToast();
					event.preventDefault();
				}
				break;
			default:
				//No recognised key, so don't prevent anything
				return;
		}
	}
</script>

<UserAvatar {client} />

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

{#if session}
	{#if editing}
		<EditMenu
			bind:selectedColorIdx
			clearEdits={() => editData.clearEdits()}
			onSubmit={() => submitEditsToast()}
			edits={editData.edits}
			onClose={() => setEditing(false)}
			userInfo={client.info}
			nextPixel={client.nextPixel}
		/>
	{/if}

	{#if !editing}
		<ViewHud
			{selectedPixel}
			array={displayData.array}
			{scale}
			onClose={() => (selectedPixel = undefined)}
			onDrawButton={() => setEditing(true)}
			canvas={displayData.canvas}
			{client}
		/>
	{/if}
{:else}
	<div class="absolute right-0 bottom-0 left-0 mx-auto w-2xl">
		<SignIn class={buttonVariants({ variant: 'default' }) + ' w-full'}>
			<span>Sign in</span>
		</SignIn>
	</div>
{/if}

<Sidebar {editData} {session} {templateData} {client} />

<svelte:window onkeydown={(event) => onKey(event, true)} onkeyup={(event) => onKey(event, false)} />
