<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AlignerSays from './AlignerSays.svelte';
	import { globalState } from '$lib/state/store.svelte';

	globalState.game_id = 'story-game-001';
	globalState.user_id = 'story-user-001';
	globalState.current_bot_prompt = 'Respond as a chaotic evil bot who gives terrible advice';
	globalState.last_turn_id = 1;
	globalState.last_alignment_request = 'Be as helpful as possible';
	globalState.is_game_started = true;
	globalState.have_all_users_submitted = false;

	const { Story } = defineMeta({
		title: 'Game/AlignerSays',
		component: AlignerSays
	});
</script>

<Story name="Default">
	{#snippet template()}
		<div style="max-width: 600px; padding: 1rem;">
			<AlignerSays />
		</div>
	{/snippet}
</Story>
