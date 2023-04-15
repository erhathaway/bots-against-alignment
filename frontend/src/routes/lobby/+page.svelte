<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	let bots;
	let status;
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;
	import { globalStore } from '$lib/store.js';

    const game_id = $globalStore.game_id;
	const creator_id = $globalStore.creator_id;
	console.log('GAME ID', game_id);
    console.log('CREATOR ID', creator_id);
	async function fetchStatus() {
		const url = `${BACKEND_API}/game_status?game_id=${game_id}`;

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
		const data = await response.json();
		status = data.status;
		bots = data.bots;

		if (status === 'IN_PROGRESS') {
			clearInterval(fetchStatusInterval);
		}
	}

	async function startGame() {
		if (creator_id === null) {
			console.error('Only the creator can start the game');
			return;
		}
		const url = `${BACKEND_API}/start?game_id=${game_id}&creator_id=${creator_id}`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});

		if (response.ok) {
			goto('/align');
		} else {
			// Show an error message or handle the error accordingly
			console.error('Failed to start the game');
		}
	}

	let fetchStatusInterval;
	onMount(() => {
		fetchStatus();
		fetchStatusInterval = setInterval(fetchStatus, 3000);
	});
</script>


<main class="lobby-container">
	<h1>Welcome to the Lobby!</h1>
	{#if status === 'LOBBY'}
		<div class="bot-list">
			{#each bots as bot}
				<div class="bot-card">
					<span>Name: {bot.name}</span>
					<!-- <span>Score: {bot.score}</span> -->
					<!-- <span>Current Prompt: {bot.current_prompt}</span> -->
					<!-- <span>Prompts Remaining: {bot.prompts_remaining}</span> -->
					<!-- <span>Submitted Prompts: {bot.submitted_prompts}</span> -->
				</div>
			{/each}
		</div>
		{#if creator_id}
			<button class="start-button" on:click={startGame}> Start Game </button>
		{:else}
			<p>Waiting for the creator to start the game.</p>
		{/if}
	{:else}
		<p>The game has already started.</p>
	{/if}
</main>

<style>
	.lobby-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.bot-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.bot-card {
		display: flex;
		flex-direction: row;
		gap: 10px;
		align-items: center;
	}

	.start-button {
		background-color: blue;
		color: white;
		padding: 10px 20px;
		border-radius: 5px;
		cursor: pointer;
		margin-top: 20px;
	}
</style>
