<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TurnFinale from './TurnFinale.svelte';
	import { globalState } from '$lib/state/store.svelte';

	globalState.game_id = 'story-game-001';
	globalState.user_id = 'story-user-001';
	globalState.last_turn_id = 1;
	globalState.last_turn_results = null;
	globalState.is_game_over = false;

	const { Story } = defineMeta({
		title: 'Game/TurnFinale',
		component: TurnFinale
	});
</script>

<Story name="Deliberating">
	{#snippet template()}
		<div style="max-width: 600px; height: 400px; padding: 1rem;">
			<TurnFinale />
		</div>
	{/snippet}
</Story>
