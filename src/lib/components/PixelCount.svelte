<script lang="ts">
	import { Progress, ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import type { UserInfo } from '../userinfo';

	const {
		userInfo,
		nextPixel,
		showRing = false,
		showBar = false,
		usedPixels
	}: {
		userInfo: UserInfo;
		nextPixel: number;
		showRing?: boolean;
		showBar?: boolean;
		usedPixels?: number;
	} = $props();
</script>

{#if userInfo.pixels >= userInfo.maxPixels}
	<span>Full</span>
{:else}
	<span>{userInfo.pixels} / {userInfo.maxPixels}, {nextPixel}s</span>
	{#if showRing}
		<ProgressRing value={nextPixel} max={19} size="size-10" />
	{/if}
{/if}

{#if showBar}
	<div>
		<Progress
			value={userInfo.pixels}
			max={userInfo.maxPixels}
			classes="relative h-2"
			meterBg="bg-tertiary-500"
		/>
		{#if usedPixels}
			<Progress
				value={usedPixels}
				max={userInfo.maxPixels}
				classes="relative bottom-2 h-2"
				meterBg="bg-destructive"
				trackBg="bg-transparent"
				meterTransition=""
			/>
		{/if}
	</div>
{/if}
