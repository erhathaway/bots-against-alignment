<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Lobby from './Lobby.svelte';
	import { globalState } from '$lib/state/store.svelte';

	globalState.game_id = 'story-game-001';
	globalState.user_id = 'story-user-001';
	globalState.has_player_joined = true;
	globalState.is_game_started = false;

	const { Story } = defineMeta({
		title: 'Game/Lobby',
		component: Lobby
	});
</script>

<Story name="Creator">
	{#snippet template()}
		{((globalState.creator_id = 'story-creator-001'), '')}
		<div style="max-width: 600px; padding: 1rem;">
			<Lobby />
		</div>
	{/snippet}
</Story>

<Story name="Joiner">
	{#snippet template()}
		{((globalState.creator_id = null), '')}
		<div style="max-width: 600px; padding: 1rem;">
			<Lobby />
		</div>
	{/snippet}
</Story>
