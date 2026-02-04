<script lang="ts">
	import AnnouncementTitle from './AnnouncementTitle.svelte';

	type Props = {
		pointsToWin: number;
		botPromptChanges: number;
		humans: string[];
		ai: string[];
	};

	let { pointsToWin, botPromptChanges, humans, ai }: Props = $props();

	const subtitle = `First to ${pointsToWin} point${pointsToWin === 1 ? '' : 's'} • ${botPromptChanges} prompt change${botPromptChanges === 1 ? '' : 's'} per turn`;
</script>

<AnnouncementTitle title="Game On!" {subtitle} />

<style>
	/* Styles moved to AnnouncementTitle component */
</style>
