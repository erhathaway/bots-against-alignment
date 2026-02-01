<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GameFinale from './GameFinale.svelte';
	import { globalState } from '$lib/state/store.svelte';

	globalState.game_id = 'story-game-001';
	globalState.bot_name = 'ChaosBot';
	globalState.is_game_over = true;

	const { Story } = defineMeta({
		title: 'Game/GameFinale',
		component: GameFinale
	});
</script>

<Story name="Default">
	{#snippet template()}
		<div style="max-width: 600px; height: 500px; padding: 1rem;">
			<GameFinale />
		</div>
	{/snippet}
</Story>
