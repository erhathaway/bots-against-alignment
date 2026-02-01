<script lang="ts">
	import { globalState, leaveCurrentGame } from '$lib/state/store.svelte';
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

	let { data }: { data: PageData } = $props();

	const RouterState = {
		PreGame: 'PreGame',
		Lobby: 'Lobby',
		AlignerSays: 'AlignerSays',
		TurnFinale: 'TurnFinale',
		GameFinale: 'GameFinale'
	} as const;
	type RouterState = (typeof RouterState)[keyof typeof RouterState];
	let routerState = $state<RouterState>(RouterState.PreGame);

	const customFly = (direction: 'in' | 'out') => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (time: number) => --time * time * time + 1,
		y: direction === 'in' ? 200 : -200
	});

	const screenTransition = (direction: 'in' | 'out') => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (time: number) => --time * time * time + 1,
		x: direction === 'in' ? 200 : 0,
		y: direction === 'in' ? 0 : 500
	});

	const leftTransition = (direction: 'in' | 'out') => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (time: number) => --time * time * time + 1,
		x: direction === 'in' ? 200 : 0,
		y: direction === 'in' ? 0 : 500
	});

	const chatTransition = (_direction: 'in' | 'out') => ({
		easing: (time: number) => --time * time * time + 1
	});

	$effect(() => {
		const {
			has_player_joined,
			is_game_started,
			have_all_users_submitted,
			is_game_over
		} = globalState;
		if (!has_player_joined) {
			routerState = RouterState.PreGame;
		} else if (!is_game_started) {
			routerState = RouterState.Lobby;
		} else if (is_game_over) {
			routerState = RouterState.GameFinale;
		} else if (have_all_users_submitted) {
			routerState = RouterState.TurnFinale;
		} else {
			routerState = RouterState.AlignerSays;
		}
	});

	$effect(() => {
		const gameId = data.gameId;
		if (!gameId) return;

		const shouldReset =
			globalState.game_id !== gameId || (data.creatorId && globalState.creator_id !== data.creatorId);

		if (shouldReset) {
			globalState.game_id = gameId;
			globalState.creator_id = data.creatorId ?? null;
			globalState.user_id = null;
			globalState.has_player_joined = false;
			globalState.is_game_started = false;
			globalState.have_all_users_submitted = false;
			globalState.is_game_over = false;
			globalState.last_turn_id = null;
			globalState.last_alignment_request = null;
			globalState.last_turn_results = null;
		} else if (!globalState.game_id) {
			globalState.game_id = gameId;
		}
	});

	$effect(() => {
		if (!browser) return;
		const gameId = globalState.game_id;
		if (!gameId) return;

		const url = new URL(window.location.href);
		if (url.searchParams.get('game_id') !== gameId) {
			url.searchParams.set('game_id', gameId);
			goto(`?${url.searchParams.toString()}`, { replaceState: true });
		}
	});

	let isLeavePending = $state(false);
	async function handleLeave() {
		if (isLeavePending) return;
		if (!confirm('Are you sure you want to leave this game?')) return;
		isLeavePending = true;
		try {
			const success = await leaveCurrentGame();
			if (success) {
				goto('/');
			}
		} finally {
			isLeavePending = false;
		}
	}
</script>

<div id="screen" role="region" aria-label="Game" in:fly={screenTransition('in')}>
	<section id="left" out:fly={leftTransition('out')}>
		{#if globalState.has_player_joined}
			<div class="leave-bar">
				<button class="leave-btn" onclick={handleLeave} disabled={isLeavePending}>
					{isLeavePending ? 'Leaving...' : 'Leave Game'}
				</button>
			</div>
		{/if}
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

	.leave-bar {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		padding: 0.5rem 1rem;
		flex-grow: 0;
	}
	.leave-btn {
		font-size: 0.8rem;
		padding: 0.3rem 0.8rem;
		cursor: pointer;
		border: 1px solid #ccc;
		background: white;
		border-radius: 1rem;
		color: #666;
	}
	.leave-btn:hover {
		border-color: red;
		color: red;
	}
	.leave-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
