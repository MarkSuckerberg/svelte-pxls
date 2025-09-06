<script lang="ts">
	import {
		colorNames,
		colors,
		colorsBackwards,
		colorToRGB,
		get1DPosition2D,
		type ClientToServerEvents,
		type Pixel,
		type ServerToClientEvents
	} from '$lib/socket';
	import { onMount } from 'svelte';
	import { io, type Socket } from 'socket.io-client';
	import interact from 'interactjs';
	import type { SignalArgs } from '@interactjs/core/scope';
	import type { GestureEvent } from '@interactjs/actions/gesture/plugin';
	import type { PageProps } from './$types';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import { X as Exit, Eraser, Send, Trash, Brush, ClipboardCopy } from '@lucide/svelte';
	import { toaster } from '$lib/toaster';
	import { ArrayGrid } from '$lib/arrayGrid';

	let { data }: PageProps = $props();
	let canvas: HTMLCanvasElement;
	let userCanvas: HTMLCanvasElement;

	let container: HTMLDivElement;
	let mainContext: CanvasRenderingContext2D;
	let userContext: CanvasRenderingContext2D;
	let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

	let array: ArrayGrid | undefined = $state();

	let selectedColorIdx = $state(3);
	let selectedColor = $derived(colors[selectedColorIdx]);

	let pan = $state(data.pan);
	let scale = $state(data.scale);

	let boardH = 500;
	let boardW = 500;

	let edits: Map<number, Pixel> = $state(new Map());
	let editing: boolean = $state(data.edit);

	// Lazily recalculated when needed at a specific position
	let rect: DOMRect | undefined = $state();

	let selectedPixel: { x: number; y: number } | undefined = $state();
	let selectedPixelColor = $derived.by(() => {
		if (!selectedPixel || !array) {
			return 'unknown';
		}

		const color = array.get(selectedPixel.x, selectedPixel.y);

		return `${colorNames[color]} (index ${color}, hex #${colors[color].toString(16).padStart(8, '0')})`;
	});

	let moving = $state(false);

	function handleMove(event: SignalArgs['interactions:move'] & (PointerEvent | GestureEvent)) {
		if (event.shiftKey) {
			return;
		}

		pan.x = Math.max(-boardW * 0.75, Math.min(boardW * 0.75, pan.x + event.dx / scale));
		pan.y = Math.max(-boardH * 0.75, Math.min(boardH * 0.75, pan.y + event.dy / scale));

		rect = undefined;
	}

	function getRect() {
		rect = rect ?? canvas.getBoundingClientRect();

		return rect;
	}

	function startSocket() {
		const getSocket = io({
			rememberUpgrade: true
		});

		if (!getSocket) {
			throw new Error('Failed to connect to websocket');
		}

		socket = getSocket;

		socket.compress(true).once('map', (rawMap, width, height) => {
			const map = new Uint8Array(rawMap);
			const result = new Uint32Array(map.length);
			array = new ArrayGrid(width, height, map);
			map.forEach((value, idx) => {
				result[idx] = colorsBackwards[value];
			});
			boardW = width;
			boardH = height;
			const data = new ImageData(new Uint8ClampedArray(result.buffer), width, height);
			mainContext.putImageData(data, 0, 0);
		});

		socket.on('pixelUpdate', acceptPixels);
	}

	function setEditing(edit: boolean = true) {
		editing = edit;
		updateLocation();
	}

	function acceptPixels(pixels: Pixel[]) {
		for (const id in pixels) {
			const pixel = pixels[id];
			const { x, y, color } = pixel;
			const { red, green, blue, alpha } = colorToRGB(color);

			array?.set(pixel);

			mainContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
			mainContext.fillRect(x, y, 1, 1);
		}
	}

	function startCanvas() {
		const getContext = canvas.getContext('2d');
		const getUserContext = userCanvas.getContext('2d');

		if (!getContext || !getUserContext) {
			throw new Error('Failed to get 2D context');
		}

		mainContext = getContext;
		userContext = getUserContext;

		const { red, green, blue, alpha } = colorToRGB(0);
		mainContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
		mainContext.fillRect(0, 0, boardW, boardH);

		userCanvas.addEventListener('mousemove', (event) => {
			if (!event.shiftKey || !(event.buttons & 1)) {
				return;
			}
			const rect = getRect();
			const x = Math.floor((event.clientX - rect.left) / (rect.width / boardW));
			const y = Math.floor((event.clientY - rect.top) / (rect.height / boardH));

			userPlace(x, y);
		});
	}

	let scrollTimer: NodeJS.Timeout | undefined;
	function onScroll(event: WheelEvent) {
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
		pan.x = Math.max(-boardW * 0.75, Math.min(boardW * 0.75, pan.x + dx / scale));
		pan.y -= dy / oldScale;
		pan.y = Math.max(-boardH * 0.75, Math.min(boardH * 0.75, pan.y + dy / scale));

		rect = undefined;

		if (scrollTimer) {
			clearTimeout(scrollTimer);
			scrollTimer = undefined;
		}
		scrollTimer = setTimeout(() => {
			updateLocation();
		}, 250);
	}

	function doPlace(x: number, y: number, color: number) {
		const { red, green, blue, alpha } = colorToRGB(color);
		userContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
		userContext.fillRect(x, y, 1, 1);

		edits.set(get1DPosition2D(x, y, boardW, boardH), { x, y, color });

		localStorage.setItem('currentEdits', JSON.stringify(edits.values().toArray()));
	}

	function userPlace(x: number, y: number, remove = false, color = selectedColorIdx) {
		if (0 > x || x > boardW || 0 > y || y > boardH) {
			throw Error('Invalid pixel placement location.');
		}

		const pos = get1DPosition2D(x, y, boardW, boardH);
		if (remove && edits.get(pos)?.color === color) {
			removeEdit(x, y);
			return;
		}

		doPlace(x, y, color);
		setEditing(true);
	}

	function clearEdits() {
		edits.clear();
		userContext.clearRect(0, 0, boardW, boardH);
		localStorage.setItem('currentEdits', '[]');
	}

	function removeEdit(x: number, y: number) {
		const pos = get1DPosition2D(x, y, boardW, boardH);

		if (!edits.has(pos)) {
			return;
		}

		edits.delete(pos);
		userContext.clearRect(x, y, 1, 1);
	}

	async function submitEdits() {
		if (!editing) {
			return;
		}

		const pixels: Pixel[] = [...edits.values()];

		socket.timeout(10000).emit('place', pixels, (err, pixels) => {
			if (err) {
				console.error("Server didn't respond to pixel placement! Edits not saved.");
				return;
			}
			setEditing(false);
			clearEdits();
			acceptPixels(pixels);
		});
	}

	function submitEditsToast() {
		toaster.promise(submitEdits(), {
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
	}

	function updateLocation() {
		const newURL = new SvelteURL(window.location.href);
		newURL.search = `?x=${pan.x}&y=${pan.y}&s=${scale}`;
		if (editing) {
			newURL.search += '&edit=true';
		}
		rect = undefined;
		replaceState(newURL, page.state);
		clearTimeout(scrollTimer);
	}

	function startInteract() {
		interact(container)
			.styleCursor(false)
			.draggable({
				inertia: true,
				onmove: handleMove,
				onend: () => updateLocation()
			})
			.gesturable({
				onmove: function (event: GestureEvent & SignalArgs['interactions:move']) {
					scale *= 1 + event.ds;
					handleMove(event);
				},
				onend: () => updateLocation()
			});
		interact(userCanvas)
			.styleCursor(false)
			.on('tap', onTap)
			.on('doubletap', (event: PointerEvent) => {
				const bounds = getRect();
				const x = Math.floor((event.clientX - bounds.left) / (bounds.width / boardW));
				const y = Math.floor((event.clientY - bounds.top) / (bounds.height / boardH));

				userPlace(x, y, editing);

				event.preventDefault();
			});
	}

	function fromScreen(x: number, y: number, bounds: DOMRect = getRect(), floored = true) {
		if (!started) {
			return undefined;
		}

		const boardX = (x - bounds.left) / (bounds.width / boardW);
		const boardY = (y - bounds.top) / (bounds.height / boardH);

		return {
			x: floored ? Math.floor(boardX) : boardX,
			y: floored ? Math.floor(boardY) : boardY
		};
	}

	function toScreen(boardX: number, boardY: number, offset: { x: number; y: number } = pan) {
		if (!started) {
			return undefined;
		}

		if (scale < 0) {
			boardX -= boardW - 1;
			boardY -= boardH - 1;
		}
		return {
			x: (boardX + offset.x - (boardW - window.innerWidth / scale) / 2) * scale,
			y: (boardY + offset.y - (boardH - window.innerHeight / scale) / 2) * scale
		};
	}

	let started = false;
	let cursorPosition: { x: number; y: number } | undefined = $state();
	let reticlePosition = $derived(
		cursorPosition ? toScreen(cursorPosition.x, cursorPosition.y) : undefined
	);
	let origin = $derived(toScreen(0, 0, { x: pan.x, y: pan.y }));
	let selectedPosition = $derived(
		selectedPixel && !editing
			? toScreen(selectedPixel.x, selectedPixel.y, { x: pan.x, y: pan.y })
			: undefined
	);
	let selectedPixelLink = $derived.by(() => {
		if (!selectedPixel) {
			return undefined;
		}
		const centerPan = center(selectedPixel.x, selectedPixel.y);
		return new SvelteURL(
			`/?x=${centerPan.x}&y=${centerPan.y}&s=${scale}`,
			page.url.origin
		).toString();
	});
	let linkCopied = $state(false);

	function onTap(event: MouseEvent) {
		const bounds = getRect();
		const x = Math.floor((event.clientX - bounds.left) / (bounds.width / boardW));
		const y = Math.floor((event.clientY - bounds.top) / (bounds.height / boardH));

		if (editing) {
			userPlace(x, y, !event.shiftKey);
		} else {
			selectedPixel = { x, y };
			linkCopied = false;
		}
	}

	function onMouseDown(event: MouseEvent) {
		if (event.shiftKey && event.buttons & 1) {
			const rect = getRect();
			const x = Math.floor((event.clientX - rect.left) / (rect.width / boardW));
			const y = Math.floor((event.clientY - rect.top) / (rect.height / boardH));

			userPlace(x, y);
			event.preventDefault();
		}

		if (editing && event.buttons & 2) {
			const pos = fromScreen(event.clientX, event.clientY);
			if (!pos) {
				return;
			}

			removeEdit(pos.x, pos.y);
			event.preventDefault();
		}
	}

	function onMouseMove(event: MouseEvent | PointerEvent) {
		if (!event.clientX) {
			return;
		}

		cursorPosition = fromScreen(event.clientX, event.clientY);

		if (!editing || !(event.buttons & 2)) {
			return;
		}

		const pos = fromScreen(event.clientX, event.clientY);
		if (!pos) {
			return;
		}

		removeEdit(pos.x, pos.y);
		event.preventDefault();
	}

	onMount(() => {
		startInteract();
		startSocket();
		startCanvas();

		const storedEdits = localStorage.getItem('currentEdits');
		if (storedEdits) {
			const pixels = JSON.parse(storedEdits) as Pixel[];
			pixels.forEach((pixel) => doPlace(pixel.x, pixel.y, pixel.color));
		}

		started = true;
	});

	function center(x: number, y: number) {
		return { x: boardW / 2 - x, y: boardH / 2 - y };
	}

	let grid = $state(false);
</script>

<div class="canvas-container main">
	<div
		style="position: fixed; top: 0; left: 0; z-index: 1; width: 110vw; height: 110vh; pointer-events: none; background-image: linear-gradient(to right, #aaa 1px, transparent 1px), linear-gradient(to bottom, #aaa 1px, transparent 1px);"
		style:background-size={scale + 'px ' + scale + 'px'}
		style:opacity={grid ? (scale - 5) / 6 : 0}
		style:transform={origin
			? `translate(${(origin.x % scale) - scale}px, ${(origin.y % scale) - scale}px)`
			: ''}
	></div>
	<div class="canvas-inner main">
		<canvas
			width="500"
			height="500"
			bind:this={canvas}
			class="main-canvas"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
			style:opacity={editing ? '100%' : '100%'}
		>
		</canvas>
	</div>
</div>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="canvas-container"
	bind:this={container}
	onwheel={onScroll}
	onmousedown={() => {
		moving = true;
	}}
	onmousemove={onMouseMove}
	onpointermove={onMouseMove}
	onmouseleave={() => (cursorPosition = undefined)}
	onpointerleave={() => (cursorPosition = undefined)}
	style:cursor={moving ? 'grabbing' : 'grab'}
>
	<div
		class="canvas-inner"
		style="filter: drop-shadow(1px 1px 0px red) drop-shadow(-1px -1px 0px red) drop-shadow(1px
		1px 10px black)"
	>
		<canvas
			width="500"
			height="500"
			bind:this={userCanvas}
			onmousedown={onMouseDown}
			onmousemove={onMouseDown}
			oncontextmenu={(event) => {
				if (editing) {
					onMouseDown(event);
					event.preventDefault();
				}
			}}
			class="main-canvas user-canvas"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
			style:opacity={editing ? 100 : 0}
			style:cursor={moving ? 'grabbing' : editing ? 'crosshair' : 'default'}
		>
		</canvas>
	</div>
</div>

{#if reticlePosition}
	<div
		style:width={scale - 1 + 'px'}
		style:height={scale - 1 + 'px'}
		style:transform={`translate(${reticlePosition.x - 1}px, ${reticlePosition.y - 1}px)`}
		style="pointer-events:none; position:fixed; box-sizing: content-box; border: 2px solid black; margin: 0;"
		style:background-color={`#${selectedColor.toString(16).padStart(8, '0')}`}
		style:opacity="50%"
	></div>
{/if}

{#if selectedPosition}
	<div
		style:width={scale - 1 + 'px'}
		style:height={scale - 1 + 'px'}
		style:transform={`translate(${selectedPosition.x - 1}px, ${selectedPosition.y - 1}px)`}
		style="pointer-events:none; position:fixed; box-sizing: content-box; border: 2px inset black; margin: 0; background-color: #ffffff22"
	></div>
{/if}

<div
	class="fixed bottom-0 left-0 z-[1] w-full card bg-primary-500 p-2"
	style:display={editing ? 'unset' : 'none'}
>
	<div class="flex">
		<button
			class="m-1 btn h-12 flex-1 justify-end preset-filled-error-500"
			onclick={() => clearEdits()}
		>
			<span>Clear {edits.size} Edit{edits.size === 1 ? '' : 's'}</span>
			<Trash />
		</button>

		<button
			class="m-1 btn h-12 flex-12 preset-filled-tertiary-500"
			onclick={() => submitEditsToast()}
			aria-keyshortcuts="enter"
		>
			<span>Send</span>
			<Send />
		</button>

		<button class="m-1 btn h-12 w-12 flex-1 p-0" onclick={() => setEditing(false)}>
			<Exit />
		</button>
	</div>
	<div class="btn-group flex w-full flex-wrap justify-center">
		{#each colors as color, index (color)}
			<button
				onclick={() => (selectedColorIdx = index)}
				style:background-color={`#${color.toString(16).padStart(8, '0')}`}
				class="m-0 btn h-10 w-10 p-0 outline-1 disabled:opacity-100 disabled:outline-4 disabled:outline-primary-contrast-700 sm:m-0.5 sm:h-12 sm:w-12"
				aria-label={colorNames[index]}
				disabled={index === selectedColorIdx}
				title={colorNames[index]}
			>
				{#if index === 0}
					<Eraser color="#000" />
				{/if}
			</button>
		{/each}
	</div>
</div>

{#if !editing}
	<div
		class="pointer-events-none absolute bottom-0 flex w-full flex-col items-center justify-center *:pointer-events-auto"
	>
		<button class="btn h-20 w-4xl preset-filled-tertiary-500" onclick={() => setEditing(true)}>
			<Brush />
			<span>Draw</span>
		</button>
		{#if selectedPixel}
			<div class="h-20 w-full card preset-filled-primary-500 text-center">
				<button
					class="float-right m-1 btn h-12 w-12 flex-1 p-0"
					onclick={() => {
						selectedPixel = undefined;
						linkCopied = false;
					}}
				>
					<Exit />
				</button>
				<div class="flex h-20 flex-col justify-center">
					<p>
						Selected Pixel: ({selectedPixel.x}, {selectedPixel.y})
					</p>
					<p>
						Color: {selectedPixelColor}
					</p>
					<button
						class="m-auto btn w-1/2 preset-filled"
						onclick={() => {
							linkCopied = true;
							navigator.clipboard.writeText(selectedPixelLink!);
						}}
					>
						<ClipboardCopy />
						<span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'g') {
			grid = !grid;
		}
		if (event.key === 'Escape') {
			selectedPixel = undefined;
			linkCopied = false;
			setEditing(false);
		}
		if (!editing) {
			return;
		}
		if (event.key == 'Enter') {
			submitEditsToast();
		}
	}}
	onmouseup={() => {
		moving = false;
	}}
/>

<style>
	.canvas-container {
		z-index: 0;
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.canvas-inner {
		flex: 0 0 100px;
	}

	.main-canvas {
		width: 500px;
		image-rendering: pixelated;
	}
</style>
