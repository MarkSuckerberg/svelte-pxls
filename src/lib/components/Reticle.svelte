<script lang="ts">
	import { colors } from '../types';

	let {
		reticlePosition,
		selectedColorIdx,
		scale
	}: {
		reticlePosition: { x: number; y: number } | undefined;
		selectedColorIdx: number;
		scale: number;
	} = $props();
</script>

{#if reticlePosition}
	<div
		style:width={scale + 'px'}
		style:height={scale + 'px'}
		style:transform={`translate(${reticlePosition.x}px, ${reticlePosition.y}px)`}
		style="pointer-events:none; position:fixed; box-sizing: content-box; margin: 0;"
		style:background-color={`#${colors[selectedColorIdx].toString(16).padStart(8, '0')}`}
		style:opacity="50%"
	></div>
{/if}
