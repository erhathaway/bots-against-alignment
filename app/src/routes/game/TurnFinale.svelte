<script lang="ts">
	import LoadingBars from './LoadingBars.svelte';
	import { globalState } from '$lib/state/store.svelte';
	import type { AlignmentResponse } from '$lib/types';

	let results = $derived(globalState.last_turn_results);
	let turnProcessed = $derived(results !== null && results.length > 0);

	async function pollForResults() {
		const gameId = globalState.game_id;
		const turnId = globalState.last_turn_id;
		const userId = globalState.user_id;
		if (!gameId || !turnId) return;

		const url = `/api/game/${gameId}/turn/${turnId}/finale`;
		try {
			const response = await fetch(url);
			const data = await response.json();
			if (response.ok && data.processed && Array.isArray(data.alignmentResponses)) {
				globalState.last_turn_results = data.alignmentResponses as AlignmentResponse[];
				if (data.isGameOver) {
					globalState.is_game_over = true;
				}
			}
		} catch (error) {
			console.error('Failed to poll results:', error);
		}

		// Also poll /me for host transfer detection
		if (userId) {
			try {
				const meResponse = await fetch(`/api/game/${gameId}/me?playerId=${userId}`);
				const meData = await meResponse.json();
				if (meResponse.ok && meData.creatorId) {
					globalState.creator_id = meData.creatorId;
				}
			} catch {
				// ignore
			}
		}
	}

	$effect(() => {
		if (turnProcessed) return;
		pollForResults();
		const intervalId = setInterval(pollForResults, 2000);
		return () => clearInterval(intervalId);
	});

	$effect(() => {
		if (turnProcessed && !globalState.is_game_over) {
			globalState.last_turn_results = null;
			globalState.have_all_users_submitted = false;
		}
	});
</script>

<div id="container">
	{#if !turnProcessed}
		<h2>The Aligner is deliberating...</h2>
		<p class="subtitle">Watch the chat for the Aligner's reasoning!</p>
		<LoadingBars />
	{:else if globalState.is_game_over}
		<p class="game-over-text">Game Over!</p>
	{/if}
</div>

<style>
	#container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		height: 100%;
		padding: 2rem;
	}
	h2 {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}
	.subtitle {
		color: #666;
		margin-bottom: 1.5rem;
		font-size: 1rem;
	}
	.game-over-text {
		font-size: 1.5rem;
		font-weight: bold;
		color: rgb(0, 150, 0);
		margin-top: 1.5rem;
	}
</style>
