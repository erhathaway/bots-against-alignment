<script lang="ts">
	import { NotificationKind, addNotification, globalStore } from '$lib/store';
	import { onMount } from 'svelte';
	import LoadingBars from './LoadingBars.svelte';
	import LoadingCommas from './LoadingCommas.svelte';
	import chat_manager from '$lib/chat_manager';
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	let fetchStatusInterval: NodeJS.Timer | null = null;

	async function fetchStatus() {
		const url = `${BACKEND_API}/game_status?game_id=${$globalStore.game_id}`;

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
				globalStore.update((store) => ({
					...store,
					is_game_started: true
				}));
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

	let isStartGamePending = false;
	async function startGame() {
		if (isStartGamePending) {
			return;
		}

		isStartGamePending = true;
		try {
			if ($globalStore.creator_id == null) {
				throw new Error('Only the creator can start the game');
			}
			if ($globalStore.is_game_started) {
				throw new Error('Game already started');
			}
			if ($globalStore.game_id == null) {
				throw new Error('Game ID is null');
			}
			const url = `${BACKEND_API}/start?game_id=${$globalStore.game_id}&creator_id=${$globalStore.creator_id}`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});

			if (response.ok) {
				const chat = chat_manager.findOrCreateChatGame($globalStore.game_id);
				chat.sendSystemMessage('Game started', $globalStore.game_id);
				globalStore.update((store) => ({
					...store,
					is_game_started: true
				}));
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

	onMount(() => {
		fetchStatus();
		fetchStatusInterval = setInterval(fetchStatus, 3000);
		return () => {
			fetchStatusInterval && clearInterval(fetchStatusInterval);
		};
	});
</script>

<div id="lobby">
	{#if $globalStore.creator_id == null}
		<p class="non-creator">Waiting for creator to start game<LoadingCommas /></p>
	{:else}
		<p class="creator">Invite others to join</p>
		<p class="creator highlight">and then</p>
		{#if isStartGamePending}
			<LoadingBars />
		{:else}
			<button on:click={startGame} disabled={$globalStore.is_game_started}> Start Game </button>
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
