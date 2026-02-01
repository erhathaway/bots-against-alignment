<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PreGame from './PreGame.svelte';
	import { globalState } from '$lib/state/store.svelte';

	globalState.game_id = 'story-game-001';
	globalState.creator_id = 'story-creator-001';
	globalState.has_player_joined = false;

	const { Story } = defineMeta({
		title: 'Game/PreGame',
		component: PreGame
	});
</script>

<Story name="Default">
	{#snippet template()}
		<div style="max-width: 700px; padding: 1rem;">
			<PreGame data={{ gameId: 'story-game-001' }} />
		</div>
	{/snippet}
</Story>
