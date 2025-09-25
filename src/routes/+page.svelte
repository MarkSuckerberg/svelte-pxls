<script lang="ts">
	import { page } from '$app/state';
	import Grid from '$lib/components/Grid.svelte';
	import PageController from '$lib/components/PageController.svelte';
	import SignIn from '$lib/components/SignIn.svelte';
	import { PixelCanvas, PixelEditCanvas } from '$lib/pixelCanvas.svelte';
	import { type ClientSocket, type Dimensions, type Pixel } from '$lib/types';
	import type { UserInfo } from '$lib/userinfo';
	import { BadgeQuestionMark } from '@lucide/svelte';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { io } from 'socket.io-client';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let pan = $state(data.pan);
	let scale = $state(data.scale);
	let editing = $state(data.edit);

	let canvas: HTMLCanvasElement;
	let userCanvas: HTMLCanvasElement;

	let container: HTMLDivElement | undefined = $state();

	let userInfo: UserInfo | undefined = $state();

	let displayData: PixelCanvas | undefined = $state();
	let editData: PixelEditCanvas | undefined = $state();
	let socket: ClientSocket | undefined = $state();

	let grid = $state(false);
	let moving = $state(false);

	let currentUsers: string[] = $state([]);

	async function startSocket() {
		const getSocket: ClientSocket = io({
			rememberUpgrade: true
		});

		if (!getSocket) {
			throw new Error('Failed to connect to websocket');
		}

		socket = getSocket;

		socket.on('userInfo', (user) => {
			userInfo = user;
		});

		socket.on('users', (users) => {
			currentUsers = users;
		});
	}

	function startCanvas(dimensions: Dimensions, array?: Uint8Array) {
		displayData = new PixelCanvas(canvas, dimensions, array, 0);

		const storedEdits = localStorage.getItem('currentEdits');
		const edits = storedEdits ? (JSON.parse(storedEdits) as Pixel[]) : undefined;
		editData = new PixelEditCanvas(userCanvas, dimensions, edits);
	}

	let showUser = $state(false);

	onMount(() => {
		startCanvas(data.dimensions, data.array);
		startSocket();
	});
</script>

<div class="absolute z-10 m-3">
	{#if page.data.session}
		<button onclick={() => (showUser = !showUser)}>
			<Avatar
				src={page.data.session.user?.image || undefined}
				name={page.data.session.user?.name || 'Unknown'}
			/>
		</button>

		{#if showUser}
			<div class="card preset-filled-surface-500 p-2">
				<h3>Signed in as:</h3>
				<ul>
					<li>
						Username: {page.data.session.user?.name}
					</li>
					<li>
						ID: {page.data.session.user?.id}
					</li>
					{#if userInfo}
						<li>
							Level: {userInfo.maxPixels - 100}
						</li>
						<li>
							Pixels: {userInfo.pixels} / {userInfo.maxPixels}
						</li>
						<li>
							Placed: {userInfo.placed}
						</li>
						<li>
							Next pixel: {Math.max(0, 20 - (Date.now() - userInfo.lastTicked))}s
						</li>
					{/if}
				</ul>

				<p>
					<span title={currentUsers.join(', ')}>
						{currentUsers.length} user{currentUsers.length != 1 ? 's' : ''} online
					</span>
				</p>

				<form action="/signout" method="POST">
					<button type="submit" class="btn preset-filled-primary-500">Sign out</button>
				</form>
			</div>
		{/if}
	{:else}
		<SignIn>
			<Avatar name="Guest">
				<BadgeQuestionMark />
			</Avatar>
		</SignIn>
	{/if}
</div>

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

{#if editData && displayData && socket && userInfo}
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
