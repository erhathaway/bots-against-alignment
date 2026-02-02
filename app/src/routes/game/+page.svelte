<script lang="ts">
	import { globalState, leaveCurrentGame } from '$lib/state/store.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Chat from './Chat.svelte';
	import Lobby from '$lib/components/game/Lobby.svelte';
	import AlignerSetup from '$lib/components/game/AlignerSetup.svelte';
	import AlignerSays from '$lib/components/game/AlignerSays.svelte';
	import TurnFinale from '$lib/components/game/TurnFinale.svelte';
	import GameFinale from '$lib/components/game/GameFinale.svelte';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const RouterState = {
		Lobby: 'Lobby',
		AlignerSetup: 'AlignerSetup',
		AlignerSays: 'AlignerSays',
		TurnFinale: 'TurnFinale',
		GameFinale: 'GameFinale'
	} as const;
	type RouterState = (typeof RouterState)[keyof typeof RouterState];
	let routerState = $state<RouterState>(RouterState.Lobby);

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

	const gameDetailsTransition = (direction: 'in' | 'out') => ({
		delay: direction === 'in' ? 300 : 0,
		duration: 300,
		easing: (time: number) => --time * time * time + 1,
		x: direction === 'in' ? 200 : 0,
		y: direction === 'in' ? 0 : 500
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const chatTransition = (_direction: 'in' | 'out') => ({
		easing: (time: number) => --time * time * time + 1
	});

	$effect(() => {
		const gameId = data.gameId;
		if (!gameId) return;

		// If the game ID changed or player hasn't joined, redirect to homepage
		if (globalState.game_id !== gameId) {
			if (!globalState.has_player_joined) {
				goto('/');
				return;
			}
			globalState.game_id = gameId;
		}

		if (!globalState.has_player_joined) {
			goto('/');
			return;
		}
	});

	$effect(() => {
		const {
			has_player_joined,
			is_game_started,
			is_collecting_aligner_prompts,
			have_all_users_submitted,
			is_game_over
		} = globalState;

		if (!has_player_joined) {
			return;
		} else if (is_collecting_aligner_prompts && !is_game_started) {
			routerState = RouterState.AlignerSetup;
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
	<section id="game-details" out:fly={gameDetailsTransition('out')}>
		{#if globalState.has_player_joined}
			<div class="leave-bar">
				<button class="leave-btn" onclick={handleLeave} disabled={isLeavePending}>
					{isLeavePending ? 'Leaving...' : 'Leave Game'}
				</button>
			</div>
		{/if}
		{#if routerState === RouterState.Lobby}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<Lobby />
			</div>
		{/if}
		{#if routerState === RouterState.AlignerSetup}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<AlignerSetup />
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

	#game-details {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow-y: auto;
		max-width: 50%;
		min-width: 50%;
	}

	#right {
		display: flex;
		flex-direction: column;
		flex: 1;
		max-width: 50%;
		border-left: 1.5px solid var(--color-border-light);
		background: white;
	}

	section {
		display: flex;
		align-items: center;
		width: 100%;
		flex-grow: 1;
	}

	.leave-bar {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		padding: 0.5rem 1rem;
		flex-grow: 0;
	}

	.leave-btn {
		font-size: 0.7rem;
		font-weight: 500;
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--color-border-light);
		background: white;
		border-radius: var(--radius-pill);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 150ms var(--ease);
	}

	.leave-btn:hover {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	.leave-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
