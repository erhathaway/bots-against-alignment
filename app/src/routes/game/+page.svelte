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
	import CreatorNav from '$lib/components/game/CreatorNav.svelte';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';
	import type { BotInfo } from '$lib/components/game/Lobby.svelte';

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

	type LobbyState = {
		joinedBots: Array<{
			id: string;
			name: string;
			points: number;
			turnComplete: boolean;
			isHost: boolean;
			isAuto: boolean;
		}>;
		addingAi: boolean;
		isCountdownPending: boolean;
	};

	let lobbyState = $state<LobbyState>({
		joinedBots: [],
		addingAi: false,
		isCountdownPending: false
	});

	let addAiPlayer: () => void = () => {};
	let removeAiPlayer: (id: string) => void = () => {};
	let beginCountdown: () => void = () => {};
</script>

{#if globalState.has_player_joined}
	<PlayerScoreboard withCreatorNav={isCreator && routerState === RouterState.Lobby} />
{/if}

{#if showSettingsModal}
	<GameSettingsModal onClose={() => (showSettingsModal = false)} {isCreator} />
{/if}

{#if isCreator && routerState === RouterState.Lobby}
	<CreatorNav
		onAddAi={addAiPlayer}
		onRemoveAi={removeAiPlayer}
		onOpenSettings={() => (showSettingsModal = true)}
		onStartGame={beginCountdown}
		joinedBots={lobbyState.joinedBots}
		addingAi={lobbyState.addingAi}
		startingGame={lobbyState.isCountdownPending}
		canStart={!globalState.is_game_started && lobbyState.joinedBots.length >= 1}
	/>
{/if}

<div
	class="page-wrapper"
	class:with-creator-nav={isCreator && routerState === RouterState.Lobby}
>
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

	<!-- Top right settings button (hidden when creator nav is visible) -->
	{#if globalState.has_player_joined && !(isCreator && routerState === RouterState.Lobby)}
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
				<Lobby
					onOpenSettings={() => (showSettingsModal = true)}
					onLobbyStateChange={(state) => (lobbyState = state)}
					bind:addAiPlayer
					bind:removeAiPlayer
					bind:beginCountdown
				/>
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
</div>

<style>
	.page-wrapper {
		width: 100%;
		height: 100vh;
		position: relative;
	}

	.page-wrapper.with-creator-nav {
		padding-top: 4rem;
	}
	#screen {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
		align-items: center;
	}

	#game-details {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow-y: auto;
		width: 100%;
	}

	#right {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 900px;
		height: 100vh;
		background: white;
		margin: 0 auto;
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
		padding: 0.625rem 1rem;
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		background: #ffffff;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 220ms var(--ease);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
		z-index: 99;
	}

	.nav-btn svg {
		flex-shrink: 0;
		opacity: 0.7;
		transition: opacity 220ms var(--ease);
	}

	.nav-btn:hover {
		border-color: var(--color-border);
		color: var(--color-text);
		box-shadow: var(--shadow-md);
	}

	.nav-btn:hover svg {
		opacity: 1;
	}

	.nav-btn:active {
		transform: scale(0.98);
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
