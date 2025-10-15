<script lang="ts">
	import Grid from '$lib/components/Grid.svelte';
	import PageController from '$lib/components/PageController.svelte';
	import { PixelCanvas, PixelEditCanvas } from '$lib/pixelCanvas.svelte';
	import { type ClientSocket, type Dimensions, type Pixel } from '$lib/types';
	import type { UserInfo } from '$lib/userinfo';
	import { io } from 'socket.io-client';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let pan = $state(data.pan);
	let scale = $state(data.scale);
	let editing = $state(data.edit);

	let canvas: HTMLCanvasElement;
	let userCanvas: HTMLCanvasElement;

	let templateCanvas: HTMLCanvasElement;
	let templateCtx: CanvasRenderingContext2D | null = $state(null);

	let container: HTMLDivElement | undefined = $state();

	let userInfo: UserInfo | undefined = $state();

	let displayData: PixelCanvas | undefined = $state();
	let editData: PixelEditCanvas | undefined = $state();
	let socket: ClientSocket | undefined = $state();

	let grid = $state(false);
	let moving = $state(false);

	async function startSocket() {
		const getSocket: ClientSocket = io({
			rememberUpgrade: true
		});

		if (!getSocket) {
			throw new Error('Failed to connect to websocket');
		}

		socket = getSocket;

		socket.once('userInfo', (user) => {
			userInfo = user;
		});
	}

	function startCanvas(dimensions: Dimensions, array?: Uint8Array) {
		displayData = new PixelCanvas(canvas, dimensions, array, 0, {
			alpha: false,
			desynchronized: true
		});

		const storedEdits = localStorage.getItem('currentEdits');
		const edits = storedEdits ? (JSON.parse(storedEdits) as Pixel[]) : undefined;
		editData = new PixelEditCanvas(userCanvas, dimensions, edits);

		templateCtx = templateCanvas.getContext('2d', { willReadFrequently: true });
		if (!templateCtx) {
			return;
		}
		templateCtx.imageSmoothingEnabled = false;
	}

	onMount(() => {
		startCanvas(data.dimensions, data.array);
		startSocket();
	});
</script>

<div class="canvas-container main">
	{#if displayData && grid}
		<Grid {scale} {pan} {displayData} />
	{/if}
	<div class="canvas-inner main">
		<canvas
			width={data.dimensions.width}
			height={data.dimensions.height}
			bind:this={canvas}
			class="main-canvas display-canvas"
			style:width={`${data.dimensions.width}px`}
			style:height={`${data.dimensions.height}px`}
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
		></canvas>
	</div>
</div>

<div class="canvas-container">
	<div class="canvas-inner">
		<canvas
			width={data.dimensions.width * 3}
			height={data.dimensions.height * 3}
			bind:this={templateCanvas}
			class="main-canvas template"
			style:width={`${data.dimensions.width}px`}
			style:height={`${data.dimensions.height}px`}
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:zoom={`${scale * 100}%`}
		></canvas>
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
		style="filter: drop-shadow(1px 1px 0px red) drop-shadow(-1px -1px 0px red) drop-shadow(1px -1px 0px red) drop-shadow(-1px 1px 0px red) drop-shadow(1px
		1px 10px black)"
	>
		<canvas
			width={data.dimensions.width}
			height={data.dimensions.width}
			bind:this={userCanvas}
			class="main-canvas user-canvas"
			style:transform={`translate(${scale <= 1 ? Math.round(pan.x) : pan.x}px, ${scale <= 1 ? Math.round(pan.y) : pan.y}px)`}
			style:width={`${data.dimensions.width}px`}
			style:height={`${data.dimensions.height}px`}
			style:zoom={`${scale * 100}%`}
			style:opacity={editing ? '100%' : '10%'}
			style:cursor={moving ? 'grabbing' : editing ? 'crosshair' : 'default'}
		></canvas>
	</div>
</div>

{#if editData && displayData && socket && userInfo && templateCtx}
	<PageController
		bind:pan
		bind:scale
		bind:editing
		{editData}
		{displayData}
		{socket}
		{container}
		session={data.session}
		initialColor={data.color}
		initialInfo={userInfo}
		{templateCtx}
	/>
{/if}

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'g' || event.key === 'G') {
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
		image-rendering: pixelated;
	}

	.display-canvas {
		background-color: #f8f4f0ff;
	}
</style>
