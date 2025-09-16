<script lang="ts">
	import type { PixelCanvas } from '../pixelCanvas.svelte';
	import type { Coords } from '../types';

	let { scale, pan, displayData }: { scale: number; pan: Coords; displayData: PixelCanvas } =
		$props();

	let origin = $derived(displayData.toScreen(0, 0, { x: pan.x, y: pan.y }, scale));
</script>

<div
	style="position: fixed; top: 0; left: 0; z-index: 1; width: 110vw; height: 110vh; pointer-events: none; background-image: linear-gradient(to right, #aaa 1px, transparent 1px), linear-gradient(to bottom, #aaa 1px, transparent 1px);"
	style:background-size={scale - 1 + 'px ' + scale + 'px'}
	style:opacity={(scale - 5) / 6}
	style:transform={origin
		? `translate(${(origin.x % scale) - scale}px, ${(origin.y % scale) - scale}px)`
		: ''}
></div>
