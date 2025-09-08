<script lang="ts">
	import {
		type ClientToServerEvents,
		type Pixel,
		type ServerToClientEvents
	} from '$lib/socket';
	import { onMount } from 'svelte';
	import { io, type Socket } from 'socket.io-client';
	import type { PageProps } from './newpage/$types';
	import { ArrayGrid } from '$lib/arrayGrid';
	import { PixelCanvas, PixelEditCanvas } from '$lib/pixelCanvas.svelte';
	import Grid from '$lib/Grid.svelte';
	import PageController from '$lib/PageController.svelte';

	let { data }: PageProps = $props();
	let canvas: HTMLCanvasElement;
	let userCanvas: HTMLCanvasElement;

	let container: HTMLDivElement | undefined = $state();

	let displayData: PixelCanvas | undefined = $state();
	let editData: PixelEditCanvas | undefined = $state();
	let socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined = $state();

	let pan = $state(data.pan);
	let scale = $state(data.scale);
	let editing = $state(data.edit);
	let grid = $state(false);
	let moving = $state(false);

	async function startSocket() {
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

			startCanvas(width, height, map);
		});
	}

	function startCanvas(width: number, height: number, array?: Uint8Array) {
		displayData = new PixelCanvas(
			canvas,
			width,
			height,
			new ArrayGrid(width, height, array),
			0
		);

		const storedEdits = localStorage.getItem('currentEdits');
		const edits = storedEdits ? (JSON.parse(storedEdits) as Pixel[]) : undefined;
		editData = new PixelEditCanvas(userCanvas, width, height, edits);
	}

	onMount(() => {
		startSocket()
	})
</script>

<div class="canvas-container main">
	{#if displayData && grid}
		<Grid {scale} {pan} {displayData} />
	{/if}
	<div class="canvas-inner main">
		<canvas
			width="500"
			height="500"
			bind:this={canvas}
			class="main-canvas"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
		>
		</canvas>
	</div>
</div>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="canvas-container"
	bind:this={container}
	onmousedown={() => {
		moving = true;
	}}
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
			class="main-canvas user-canvas"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
			style:opacity={editing ? 100 : 0}
			style:cursor={moving ? 'grabbing' : editing ? 'crosshair' : 'default'}
		>
		</canvas>
	</div>
</div>

{#if editData && displayData && socket}
	<PageController
		bind:pan
		bind:scale
		bind:editing
		{editData}
		{displayData}
		{socket}
		{container}
	/>
{/if}

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'g') {
			grid = !grid;
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
