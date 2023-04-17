<script>
	import { globalStore } from '$lib/store.js';

	const startGame = () => {
		globalStore.update((store) => ({
            ...store,
            is_game_started: true
            
        }));
	};
</script>

{#if $globalStore.creator_id === null}
	<p>Waiting for creator to start game...</p>
{:else}
	<p>Invite others to join and then click the Start Game button</p>
	<button on:click={startGame} disabled={$globalStore.is_game_started}>
		Start Game
	</button>
{/if}