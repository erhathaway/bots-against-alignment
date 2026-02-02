<script lang="ts">
	import HomeTitle from '$lib/components/home/HomeTitle.svelte';
	import HomeActions from '$lib/components/home/HomeActions.svelte';
	import JoinGameModal from '$lib/components/home/JoinGameModal.svelte';
	import BotSetupModal from '$lib/components/home/BotSetupModal.svelte';
	import StorybookLink from '$lib/components/home/StorybookLink.svelte';
	import GitHubLink from '$lib/components/home/GitHubLink.svelte';
	import { globalState } from '$lib/state/store.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let showJoinModal = $state(false);
	let showBotSetup = $state(false);
	let botSetupGameId = $state<string | null>(null);
	let botSetupCreatorId = $state<string | null>(null);
	let isCreatingGame = $state(false);

	function showWithTransition(fn: () => void) {
		if (document.startViewTransition) {
			document.startViewTransition(() => fn());
		} else {
			fn();
		}
	}

	async function handleNewGame() {
		if (isCreatingGame) return;
		isCreatingGame = true;
		try {
			const response = await fetch('/api/game', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.ok) {
				const data = await response.json();
				botSetupGameId = data.gameId;
				botSetupCreatorId = data.creatorId;
				globalState.game_id = data.gameId;
				globalState.creator_id = data.creatorId;
				showWithTransition(() => {
					showBotSetup = true;
				});
			}
		} finally {
			isCreatingGame = false;
		}
	}

	async function handleJoinValidated(gameId: string) {
		showJoinModal = false;
		botSetupGameId = gameId;
		botSetupCreatorId = null;
		globalState.game_id = gameId;
		globalState.creator_id = null;
		showWithTransition(() => {
			showBotSetup = true;
		});
	}

	function closeBotSetup() {
		showBotSetup = false;
		botSetupGameId = null;
		botSetupCreatorId = null;
	}

	onMount(() => {
		const joinParam = $page.url.searchParams.get('join');
		if (joinParam) {
			botSetupGameId = joinParam;
			botSetupCreatorId = null;
			globalState.game_id = joinParam;
			globalState.creator_id = null;
			showBotSetup = true;
			// Clean up URL
			const url = new URL(window.location.href);
			url.searchParams.delete('join');
			window.history.replaceState({}, '', url.toString());
		}
	});
</script>

<main>
	{#if !showBotSetup}
		<HomeTitle />
		<HomeActions
			onJoinGame={() => (showJoinModal = true)}
			onNewGame={handleNewGame}
			loading={isCreatingGame}
		/>
	{/if}

	{#if showJoinModal}
		<JoinGameModal onClose={() => (showJoinModal = false)} onJoin={handleJoinValidated} />
	{/if}

	{#if showBotSetup && botSetupGameId}
		<BotSetupModal gameId={botSetupGameId} creatorId={botSetupCreatorId} onClose={closeBotSetup} />
	{/if}

	<div class="bottom-links">
		<GitHubLink />
		<StorybookLink />
		<StorybookLink href="http://127.0.0.1:6006" label="Storybook Dev" />
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: 0;
		position: relative;
		overflow: hidden;
	}

	/* Horizontal signal trace */
	main::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			transparent 10%,
			rgba(230, 200, 50, 0.15) 20%,
			rgba(230, 200, 50, 0.3) 35%,
			rgba(230, 200, 50, 0.08) 50%,
			rgba(230, 200, 50, 0.3) 65%,
			rgba(230, 200, 50, 0.15) 80%,
			transparent 90%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 0;
	}

	/* Vertical signal trace */
	main::after {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		width: 1px;
		height: 100%;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(230, 200, 50, 0.12) 15%,
			rgba(230, 200, 50, 0.06) 40%,
			transparent 50%,
			rgba(230, 200, 50, 0.06) 60%,
			rgba(230, 200, 50, 0.12) 85%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 0;
	}

	.bottom-links {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		gap: 0.625rem;
		z-index: 100;
	}
</style>
