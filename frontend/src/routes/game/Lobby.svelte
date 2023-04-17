<script>
	import { globalStore } from '$lib/store.js';
    import LoadingCommas from "./LoadingCommas.svelte";

	const startGame = () => {
		globalStore.update((store) => ({
            ...store,
            is_game_started: true
            
        }));
	};
</script>

<div id="lobby">

    {#if $globalStore.creator_id === null}
	<p>Waiting for creator to start game<LoadingCommas /></p>
    {:else}
	<p>Invite others to join and then click the Start Game button</p>
	<button on:click={startGame} disabled={$globalStore.is_game_started}>
		Start Game
	</button>
    {/if}
</div>

<style>
    #lobby {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
    p {
        font-size: 3rem;
        width: 20rem;
		text-align: center;
		color: gray;
    }
    button {
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		margin-top: 2rem;
		margin-bottom: 3rem;
		cursor: pointer;
		border: 1px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
	}
</style>