<script lang="ts">
	import { globalStore } from '$lib/store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Chat from './Chat.svelte';
	import PreGame1 from './PreGame.svelte';
	import Lobby from './Lobby.svelte';
	import AlignerSays from './AlignerSays.svelte';
	import TurnFinale from './TurnFinale.svelte';
	import GameFinale from './GameFinale.svelte';
	import { fly } from 'svelte/transition'; // New import
	import type { PageData } from './$types';

	export let data: PageData;

	enum RouterState {
		PreGame,
		Lobby,
		AlignerSays,
		TurnFinale,
		GameFinale
	}
	let routerState: RouterState = RouterState.PreGame;

	const customFly = (direction: 'in' | 'out') => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (t: number) => --t * t * t + 1,
		y: direction === 'in' ? 200 : -200
	});

	const screenTransition = (direction: 'in' | 'out') => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (t: number) => --t * t * t + 1,
		x: direction === 'in' ? 200 : 0,
		y: direction === 'in' ? 0 : 500
	});

	const leftTransition = (direction: 'in' | 'out') => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (t: number) => --t * t * t + 1,
		x: direction === 'in' ? 200 : 0,
		y: direction === 'in' ? 0 : 500
	});

	const chatTransition = (direction: 'in' | 'out') => ({
		easing: (t: number) => --t * t * t + 1
	});

	$: {
		const {
			has_player_joined,
			is_game_started,
			is_config_open,
			have_all_users_submitted,
			is_game_over
		} = $globalStore;
		if (!has_player_joined) {
			routerState = RouterState.PreGame;
		} else if (has_player_joined && !is_game_started) {
			routerState = RouterState.Lobby;
		} else if (has_player_joined && is_game_started) {
			if (is_config_open) {
				routerState = RouterState.PreGame;
			} else if (is_game_over) {
				routerState = RouterState.GameFinale;
			} else if (have_all_users_submitted) {
				routerState = RouterState.TurnFinale;
			} else {
				routerState = RouterState.AlignerSays;
			}
		}
	}

	if (browser) {
		const game_id = $globalStore.game_id;
		if (!game_id) {
			throw new Error('Game ID not found');
		}
		$page.url.searchParams.set('game_id', game_id);

		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
</script>

<div id="screen" role="region" aria-label="Game" in:fly={screenTransition('in')}>
	<section id="left" out:fly={leftTransition('out')}>
		{#if routerState === RouterState.PreGame}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<PreGame1 {data} />
			</div>
		{/if}
		{#if routerState === RouterState.Lobby}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<Lobby />
			</div>
		{/if}
		{#if routerState === RouterState.AlignerSays}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<AlignerSays />
			</div>
		{/if}
		{#if routerState === RouterState.TurnFinale}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<TurnFinale />
			</div>
		{/if}
		{#if routerState === RouterState.GameFinale}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<GameFinale />
			</div>
		{/if}
	</section>
	<section id="right" out:fly={chatTransition('out')}>
		<Chat />
	</section>
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
