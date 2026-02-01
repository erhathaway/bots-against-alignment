<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import LoadingBars from './LoadingBars.svelte';
	import LoadingCommas from './LoadingCommas.svelte';
	import GameLink from './GameLink.svelte';
	import chat_manager from '$lib/chat_manager';

	let fetchStatusInterval: ReturnType<typeof setInterval> | null = null;

	async function fetchStatus() {
		const gameId = globalState.game_id;
		if (!gameId) return;
		const url = `/api/game/${gameId}/status`;

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
		const data = await response.json();
		if (response.ok) {
			const status = data.status;

			if (status === 'STARTED' || status === 'ENDED' || status === 'WAITING_ON_ALIGNMENT_RATING') {
				globalState.is_game_started = true;
				fetchStatusInterval && clearInterval(fetchStatusInterval);
			}
		} else {
			addNotification({
				source_url: 'lobby',
				title: 'Error fetching game status',
				body: data,
				kind: NotificationKind.ERROR,
				action_url: url,
				action_text: 'fetch_status'
			});
		}
	}

	let isStartGamePending = $state(false);
	async function startGame() {
		if (isStartGamePending) {
			return;
		}

		isStartGamePending = true;
		try {
			if (globalState.creator_id == null) {
				throw new Error('Only the creator can start the game');
			}
			if (globalState.is_game_started) {
				throw new Error('Game already started');
			}
			if (globalState.game_id == null) {
				throw new Error('Game ID is null');
			}
			const url = `/api/game/${globalState.game_id}/start`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId: globalState.creator_id })
			});

			if (response.ok) {
				const chat = chat_manager.findOrCreateChatGame(globalState.game_id);
				chat.sendSystemMessage('Game started', globalState.game_id);
				globalState.is_game_started = true;
			} else {
				// Show an error message or handle the error accordingly
				const data = await response.json();
				addNotification({
					source_url: 'lobby',
					title: 'Error starting game',
					body: data,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'start_game'
				});
			}
		} finally {
			isStartGamePending = false;
		}
	}

	$effect(() => {
		fetchStatus();
		fetchStatusInterval = setInterval(fetchStatus, 3000);
		return () => {
			if (fetchStatusInterval) clearInterval(fetchStatusInterval);
		};
	});
</script>

<div id="lobby">
	{#if globalState.creator_id == null}
		<p class="non-creator">Waiting for creator to start game<LoadingCommas /></p>
	{:else}
		<GameLink />
		<p class="creator">Invite others to join</p>
		<p class="creator highlight">and then</p>
		{#if isStartGamePending}
			<LoadingBars />
		{:else}
			<button onclick={startGame} disabled={globalState.is_game_started}> Start Game </button>
		{/if}
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
	p.non-creator {
		font-size: 3rem;
		width: 20rem;
		text-align: center;
		color: gray;
	}
	p.creator {
		font-size: 2rem;
		width: 30rem;
		text-align: center;
		color: black;
		font-weight: bold;
	}

	p.highlight {
		font-size: 1.5rem;
		font-weight: bold;
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
