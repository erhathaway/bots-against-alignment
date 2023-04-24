<script>
	import { globalStore } from '$lib/store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Chat from './Chat.svelte';
	import PreGame1 from './PreGame.svelte';
	import Lobby from './Lobby.svelte';
	import AlignerSays from './AlignerSays.svelte';
	import { fly } from 'svelte/transition'; // New import

	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	export let data;

	// let state = {
	// 	has_joined_game: false,
	// 	is_game_started: false,
	// 	is_config_open: false
	// };

	let currentPreGame = 1;

	const customFly = (direction) => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (t) => --t * t * t + 1,
		y: direction === 'in' ? -100 : 100
	});

	// const rotateMe = () => {
	// 	const { has_joined_game, is_game_started, is_config_open } = state;
	// 	if (has_joined_game && !is_game_started) {
	// 		currentPreGame = 2;
	// 		state.is_game_started = true;
	// 	} else if (has_joined_game && is_game_started) {
	// 		if (is_config_open) {
	// 			currentPreGame = 1;
	// 		} else {
	// 			currentPreGame = 3;
	// 		}
	// 		state.is_config_open = !is_config_open;
	// 	}
	// };

	$: {
		const { has_player_joined, is_game_started, is_config_open } = $globalStore;
		if (!has_player_joined) {
			currentPreGame = 1;
		} else if (has_player_joined && !is_game_started) {
			currentPreGame = 2;
			// state.is_game_started = true;
		} else if (has_player_joined && is_game_started) {
			if (is_config_open) {
				currentPreGame = 1;
			} else {
				currentPreGame = 3;
			}
		}
	}

	if (browser) {
		$page.url.searchParams.set('game_id', $globalStore.game_id);

		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
</script>

<div id="screen" role="region" aria-label="Game">
	<section id="left">
		{#if currentPreGame === 1}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<PreGame1 {data} />
			</div>
		{/if}
		{#if currentPreGame === 2}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<Lobby />
			</div>
		{/if}
		{#if currentPreGame === 3}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<AlignerSays {data} />
			</div>
		{/if}
	</section>
	<section id="right">
		<Chat />
	</section>
	<!-- <button on:click={rotateMe}>Change PreGame</button> -->
	<!-- Bind the new function -->
</div>

<style>
	.preGameContainer {
		position: absolute;
		width: 100%;
		height: 100%;
	}
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
