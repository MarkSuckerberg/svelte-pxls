<script lang="ts">
	import {
		colors,
		colorsBackwards,
		colorToRGB,
		HEIGHT,
		WIDTH,
		type ClientToServerEvents,
		type ServerToClientEvents
	} from '$lib/socket';
	import { onMount } from 'svelte';
	import { io, Socket } from 'socket.io-client';
	import interact from 'interactjs';
	import type { SignalArgs } from '@interactjs/core/scope';
	import type { GestureEvent } from '@interactjs/actions/gesture/plugin';
	import type { PageProps } from './$types';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';

	let { data }: PageProps = $props();
	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ctx: CanvasRenderingContext2D;
	let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

	let selectedColorIdx = $state(3);
	let selectedColor = $derived(colors[selectedColorIdx]);

	let pan = $state(data.pan);
	let scale = $state(data.scale);

	const handleMove = function (
		event: SignalArgs['interactions:move'] & (PointerEvent | GestureEvent)
	) {
		if (event.shiftKey) {
			return;
		}

		pan.x += event.dx / scale;
		pan.y += event.dy / scale;
	};

	function startSocket() {
		const getSocket = io({
			rememberUpgrade: true
		});

		if (!getSocket) {
			throw new Error('Failed to connect to websocket');
		}

		socket = getSocket;

		socket.on('map', (rawMap) => {
			const map = new Uint8Array(rawMap);
			const result = new Uint32Array(map.length);
			map.forEach((value, idx) => {
				result[idx] = colorsBackwards[value];
			});
			ctx.putImageData(
				new ImageData(new Uint8ClampedArray(result.buffer), WIDTH, HEIGHT),
				0,
				0
			);
		});

		socket.on('pixelUpdate', (update) => {
			for (const pixel in update) {
				const { x, y, color } = update[pixel];
				const { red, green, blue, alpha } = colorToRGB(color);

				ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
				ctx.fillRect(x, y, 1, 1);
			}
		});
	}

	function startCanvas() {
		const getContext = canvas.getContext('2d');

		if (!getContext) {
			throw new Error('Failed to get 2D context');
		}

		ctx = getContext;

		const { red, green, blue, alpha } = colorToRGB(0);
		ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		canvas.addEventListener('mousemove', (event) => {
			if (!event.shiftKey || !(event.buttons & 1)) {
				return;
			}
			const rect = canvas.getBoundingClientRect();
			const x = Math.floor((event.clientX - rect.left) / (rect.width / WIDTH));
			const y = Math.floor((event.clientY - rect.top) / (rect.height / HEIGHT));

			socket.emit('place', [{ x, y, color: selectedColorIdx }]);
		});
	}

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
	}

	function updateLocation() {
		const newURL = new URL(window.location.href);
		newURL.search = `?x=${pan.x}&y=${pan.y}&s=${scale}`;
		replaceState(newURL, page.state);
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
				const rect = canvas.getBoundingClientRect();
				const x = Math.floor((event.clientX - rect.left) / (rect.width / WIDTH));
				const y = Math.floor((event.clientY - rect.top) / (rect.height / HEIGHT));

				socket.emit('place', [{ x, y, color: selectedColorIdx }]);
				event.preventDefault();
			});
	}

	onMount(() => {
		startInteract();
		startSocket();
		startCanvas();
	});

	const roundedScale = $derived(Math.max(1, Math.floor(scale)));
	const scaleRoundingErrorMultiplier = $derived(scale / roundedScale);
</script>

<div
	style="background-color: gray; z-index: 0; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center;"
	bind:this={container}
	onwheel={onScroll}
>
	<div style="flex: 0 0 100px">
		<!--<div
			style="position: fixed; top: 0; left: 0; z-index: 1; width: 110vw; height: 110vh; pointer-events: none; background-image: linear-gradient(to right, #aaa 1px, transparent 1px), linear-gradient(to bottom, #aaa 1px, transparent 1px); transform-origin: top left;"
			style:background-size={roundedScale + 'px ' + roundedScale + 'px'}
			style:opacity={(scale - 2) / 6}
			style:transform={'translate(' +
				Math.floor((pan.x % 1) * roundedScale) +
				'px,' +
				Math.floor((pan.y % 1) * roundedScale) +
				'px) scale(' +
				scaleRoundingErrorMultiplier +
				')'}
		></div>-->
		<canvas
			id="canvas"
			width={WIDTH}
			height={HEIGHT}
			bind:this={canvas}
			style="width: 2000px; image-rendering: pixelated;"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px,${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
		>
		</canvas>
	</div>
</div>
