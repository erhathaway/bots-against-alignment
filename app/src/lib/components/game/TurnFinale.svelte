<script lang="ts">
	import LoadingBars from './LoadingBars.svelte';
	import { globalState } from '$lib/state/store.svelte';
	import type { AlignmentResponse } from '$lib/types';
	import confetti from 'canvas-confetti';

	let results = $derived(globalState.last_turn_results);
	let turnProcessed = $derived(results !== null && results.length > 0);
	let showCelebration = $state(false);
	let winnerName = $state('');

	function fireRoundWinConfetti() {
		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 }
		});
		setTimeout(() => {
			confetti({
				particleCount: 50,
				spread: 100,
				origin: { y: 0.5 }
			});
		}, 300);
	}

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
		if (!turnProcessed || globalState.is_game_over) return;

		const userWon = results?.find((r) => r.playerId === globalState.user_id && r.isRoundWinner);

		if (userWon) {
			showCelebration = true;
			winnerName = userWon.name;
			fireRoundWinConfetti();
		}

		const delay = userWon ? 3000 : 0;
		const timeout = setTimeout(() => {
			showCelebration = false;
			globalState.last_turn_results = null;
			globalState.have_all_users_submitted = false;
		}, delay);

		return () => clearTimeout(timeout);
	});
</script>

<div id="container">
	{#if showCelebration}
		<h2 class="win-text">Your bot won this round!</h2>
		<p class="winner-bot-name">{winnerName}</p>
	{:else if !turnProcessed}
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
		justify-content: center;
		height: 100%;
		padding: 3rem;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin-bottom: 2rem;
	}

	.game-over-text {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.win-text {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-accent);
		letter-spacing: 0.02em;
		animation: pulse 2s ease-in-out infinite alternate;
	}

	.winner-bot-name {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-top: 0.5rem;
	}

	@keyframes pulse {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.02);
		}
	}
</style>
