<script lang="ts">
	import {
		colors,
		colorsBackwards,
		colorToRGB,
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

	let { data }: PageProps = $props();
	let canvas: HTMLCanvasElement;
	let userCanvas: HTMLCanvasElement;

	let container: HTMLDivElement;
	let mainContext: CanvasRenderingContext2D;
	let userContext: CanvasRenderingContext2D;
	let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

	let selectedColorIdx = $state(3);
	let selectedColor = $derived(colors[selectedColorIdx]);

	let pan = $state(data.pan);
	let scale = $state(data.scale);

	let boardH = 500;
	let boardW = 500;

	let edits: Map<{ x: number; y: number }, Pixel> = $state(new Map());
	let editing: boolean = $state(false);

	// Lazily recalculated when needed at a specific position
	let rect: DOMRect | undefined = $state();

	let selectedPixel: { x: number; y: number } | undefined = $state();

	const handleMove = function (
		event: SignalArgs['interactions:move'] & (PointerEvent | GestureEvent)
	) {
		if (event.shiftKey) {
			return;
		}

		pan.x += event.dx / scale;
		pan.y += event.dy / scale;

		rect = undefined;
	};

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

	function acceptPixels(pixels: Pixel[]) {
		for (const pixel in pixels) {
			const { x, y, color } = pixels[pixel];
			const { red, green, blue, alpha } = colorToRGB(color);

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

			doPlace(x, y);
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
		pan.x += dx / scale;
		pan.y -= dy / oldScale;
		pan.y += dy / scale;

		rect = undefined;

		if (scrollTimer) {
			clearTimeout(scrollTimer);
			scrollTimer = undefined;
		}
		scrollTimer = setTimeout(() => {
			updateLocation();
		}, 250);
	}

	function doPlace(x: number, y: number) {
		if (0 > x || x > boardW || 0 > y || y > boardH) {
			throw Error('Invalid pixel placement location.');
		}

		const { red, green, blue, alpha } = colorToRGB(selectedColorIdx);
		userContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
		userContext.fillRect(x, y, 1, 1);

		editing = true;
		edits.set({ x, y }, { x, y, color: selectedColorIdx });
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
			editing = false;
			edits.clear();
			userContext.clearRect(0, 0, boardW, boardH);
			acceptPixels(pixels);
		});
	}

	function updateLocation() {
		const newURL = new URL(window.location.href);
		newURL.search = `?x=${pan.x}&y=${pan.y}&s=${scale}`;
		replaceState(newURL, page.state);
		clearTimeout(scrollTimer);
	}

	function startInteract() {
		interact(container)
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
			})
			.on('tap', (event: PointerEvent) => {
				const bounds = getRect();
				const x = Math.floor((event.clientX - bounds.left) / (bounds.width / boardW));
				const y = Math.floor((event.clientY - bounds.top) / (bounds.height / boardH));

				selectedPixel = { x, y };
			})
			.on('doubletap', (event: PointerEvent) => {
				const bounds = getRect();
				const x = Math.floor((event.clientX - bounds.left) / (bounds.width / boardW));
				const y = Math.floor((event.clientY - bounds.top) / (bounds.height / boardH));

				doPlace(x, y);

				event.preventDefault();
			});
	}

	function fromScreen(screenX: number, screenY: number, floored = true) {
		let toRet = { x: 0, y: 0 };
		let adjustX = 0;
		let adjustY = 0;

		if (scale < 0) {
			adjustX = boardW;
			adjustY = boardH;
		}

		const { width, height } = getRect();
		toRet = {
			x: -pan.x + (width - window.innerWidth / scale) / 2 + screenX / scale + adjustX,
			y: -pan.y + (height - window.innerHeight / scale) / 2 + screenY / scale + adjustY
		};

		if (floored) {
			toRet.x >>= 0;
			toRet.y >>= 0;
		}

		return toRet;
	}

	onMount(() => {
		startInteract();
		startSocket();
		startCanvas();
	});

	let roundedScale = $derived(Math.max(1, Math.floor(scale)));
	let scaleRoundingErrorMultiplier = $derived(scale / roundedScale);
</script>

<div class="canvas-container main" bind:this={container}>
	<!--<div
		style="position: fixed; top: 0; left: 0; z-index: 1; width: 110vw; height: 110vh; pointer-events: none; background-image: linear-gradient(to right, #aaa 1px, transparent 1px), linear-gradient(to bottom, #aaa 1px, transparent 1px);"
		style:background-size={roundedScale + 'px ' + roundedScale + 'px'}
		style:opacity={(scale - 5) / 6}
		style:transform={`translate(${(pan.x % 1) * roundedScale}px,${(pan.y % 1) * roundedScale}px) scale(${scaleRoundingErrorMultiplier})`}
	></div>-->
	<div class="canvas-inner">
		<canvas
			width="500"
			height="500"
			bind:this={canvas}
			class="main-canvas"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
			style:opacity={editing ? '60%' : '100%'}
		>
		</canvas>
	</div>
</div>

<div class="canvas-container" bind:this={container} onwheel={onScroll}>
	<!--<div
		style="position: fixed; top: 0; left: 0; z-index: 1; width: 110vw; height: 110vh; pointer-events: none; background-image: linear-gradient(to right, #aaa 1px, transparent 1px), linear-gradient(to bottom, #aaa 1px, transparent 1px);"
		style:background-size={roundedScale + 'px ' + roundedScale + 'px'}
		style:opacity={(scale - 5) / 6}
		style:transform={`translate(${(pan.x % 1) * roundedScale}px,${(pan.y % 1) * roundedScale}px) scale(${scaleRoundingErrorMultiplier})`}
	></div>-->
	<div class="canvas-inner">
		<canvas
			width="500"
			height="500"
			bind:this={userCanvas}
			class="main-canvas user-canvas"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
		>
		</canvas>
	</div>
</div>

<div
	style="z-index: 1; position: fixed; bottom:0; left: 50%;"
	style:display={editing ? 'unset' : 'none'}
>
	{#each colors as color, index (color)}
		<button
			onclick={() => (selectedColorIdx = index)}
			style:background-color={`#${color.toString(16).padStart(8, '0')}`}
			style:width="50px"
			style:height="50px"
			style:margin="5px"
			style:transform="translate(-50%, 0%);"
			aria-label="color"
			class={index === selectedColorIdx ? 'active' : ''}
			disabled={index === selectedColorIdx}
		></button>
	{/each}
</div>

<svelte:window
	onkeydown={(event) => {
		if (event.key == 'Enter') {
			submitEdits();
		}
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

	.canvas-container.main {
		background-color: gray;
	}

	.canvas-inner {
		flex: 0 0 100px;
	}

	.main-canvas {
		width: 500px;
		image-rendering: pixelated;
	}
</style>
