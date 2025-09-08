<script lang="ts">
	import { colors } from "./socket";


    let { reticlePosition, selectedColorIdx, scale }: { reticlePosition: {x: number, y: number} | undefined, selectedColorIdx: number, scale: number } = $props()
</script>


{#if reticlePosition}
	<div
		style:width={scale - 1 + 'px'}
		style:height={scale - 1 + 'px'}
		style:transform={`translate(${reticlePosition.x - 1}px, ${reticlePosition.y - 1}px)`}
		style="pointer-events:none; position:fixed; box-sizing: content-box; border: 2px solid black; margin: 0;"
		style:background-color={`#${colors[selectedColorIdx].toString(16).padStart(8, '0')}`}
		style:opacity="50%"
	></div>
{/if}