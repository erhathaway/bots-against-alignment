<script>
	import { globalStore } from '$lib/store.js';

	export let data;
	import { page } from '$app/stores';
	import { goto } from '$app/navigation'; // Ensure you have this import
	import { browser } from '$app/environment'; // Import browser from $app/env
	import Chat from './Chat.svelte';
	import PreGame from './PreGame.svelte';
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	if (browser) {
		$page.url.searchParams.set('game_id', $globalStore.game_id);

		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
</script>

<div id="screen" role="region" aria-label="Game">
	<section id="left">
		<PreGame />
	</section>
	<section id="right">
		<Chat />
	</section>
</div>

<style>
	#screen {
		display: flex;
		flex-direction: row;
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
	}

	#left {
		display: flex;
		flex-direction: column;
		overflow-y: scroll;
		max-width: 50%;
	}

	#right {
		display: flex;
		flex-direction: column;
		flex-grow: 2;
		background-color: white;
		max-width: 50%;
		border-left: 2px solid black;
	}

	section {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 1rem;
		width: 100%;
		flex-grow: 2;
	}
</style>
