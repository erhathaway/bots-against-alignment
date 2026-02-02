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
	import PlayerScoreboard from '$lib/components/game/PlayerScoreboard.svelte';
	import GameSettingsModal from '$lib/components/game/GameSettingsModal.svelte';
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

	let showSettingsModal = $state(false);
	let isCreator = $derived(globalState.creator_id != null);
</script>

{#if globalState.has_player_joined && globalState.is_game_started}
	<PlayerScoreboard />
{/if}

{#if showSettingsModal}
	<GameSettingsModal onClose={() => (showSettingsModal = false)} {isCreator} />
{/if}

<!-- Top left home button -->
<a href="/" class="nav-btn home-btn">
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
		<polyline points="9 22 9 12 15 12 15 22"></polyline>
	</svg>
	<span>Home</span>
</a>

<!-- Bottom left leave button -->
{#if globalState.has_player_joined}
	<button class="nav-btn leave-btn" onclick={handleLeave} disabled={isLeavePending}>
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
			<polyline points="16 17 21 12 16 7"></polyline>
			<line x1="21" y1="12" x2="9" y2="12"></line>
		</svg>
		<span>{isLeavePending ? 'Leaving...' : 'Leave Game'}</span>
	</button>
{/if}

<!-- Top right settings button -->
{#if globalState.has_player_joined}
	<button class="nav-btn settings-btn" onclick={() => (showSettingsModal = true)}>
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
			<circle cx="12" cy="12" r="3"></circle>
			<path
				d="M12 1v6m0 6v6m6-12h-6m-6 0H1m17.66 3.66l-4.24 4.24M9.88 14.12l-4.24 4.24m12.72 0l-4.24-4.24M9.88 9.88L5.64 5.64"
			></path>
		</svg>
		<span>Settings</span>
	</button>
{/if}

<div id="screen" role="region" aria-label="Game" in:fly={screenTransition('in')}>
	<section id="game-details" out:fly={gameDetailsTransition('out')}>
		{#if routerState === RouterState.Lobby}
			<div in:fly={customFly('in')} out:fly={customFly('out')}>
				<Lobby onOpenSettings={() => (showSettingsModal = true)} />
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

	.nav-btn {
		position: fixed;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		background: #ffffff;
		border: 2px solid #000000;
		border-radius: var(--radius-lg);
		color: var(--color-text);
		cursor: pointer;
		transition: all 220ms var(--ease);
		box-shadow: var(--shadow-md);
		text-decoration: none;
		z-index: 99;
	}

	.nav-btn svg {
		flex-shrink: 0;
	}

	.nav-btn:hover {
		background: #000000;
		color: #ffffff;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.nav-btn:active {
		transform: scale(0.97);
	}

	.home-btn {
		top: 1.5rem;
		left: 1.5rem;
	}

	.leave-btn {
		bottom: 1.5rem;
		left: 1.5rem;
	}

	.settings-btn {
		top: 1.5rem;
		right: 1.5rem;
	}

	.leave-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: #ffffff;
		color: var(--color-text);
	}

	.leave-btn:disabled:hover {
		background: #ffffff;
		color: var(--color-text);
		border-color: #000000;
		box-shadow: var(--shadow-md);
	}
</style>
