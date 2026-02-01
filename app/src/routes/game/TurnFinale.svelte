<script lang="ts">
	import LoadingBars from './LoadingBars.svelte';
	import { globalState } from '$lib/state/store.svelte';
	import { addNotification } from '$lib/state/store.svelte';
	import { isRecord, NotificationKind, type AlignmentResponse } from '$lib/types';

	let isJudgePending = $state(false);
	let isCreator = $derived(Boolean(globalState.creator_id));
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

	async function judgeResponses() {
		if (isJudgePending) return;
		isJudgePending = true;

		try {
			const gameId = globalState.game_id;
			const userId = globalState.user_id;
			const turnId = globalState.last_turn_id;
			if (!gameId || !userId || !turnId) {
				throw new Error('Missing game/user/turn context');
			}

			const url = `/api/game/${gameId}/turn/${turnId}/process`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId: userId })
			});
			if (response.ok) {
				const payload = await response.json();
				if (isRecord(payload) && Array.isArray(payload.alignmentResponses)) {
					const responses = payload.alignmentResponses as AlignmentResponse[];
					globalState.last_turn_results = responses;
					if (responses.some((r) => r.isGlobalWinner === true)) {
						globalState.is_game_over = true;
					}
				}
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'turn finale',
					title: 'Error processing turn',
					body: data,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'process turn'
				});
			}
		} finally {
			isJudgePending = false;
		}
	}

	function advanceTurn() {
		globalState.last_turn_results = null;
		globalState.have_all_users_submitted = false;
	}
</script>

<div id="container">
	{#if !turnProcessed && isCreator}
		<h2>All bots submitted!</h2>
		<p class="subtitle">Click below to have the Aligner judge the responses.</p>
		<button onclick={judgeResponses}>
			{#if isJudgePending}
				<LoadingBars />
			{:else}
				Judge Responses
			{/if}
		</button>
	{:else if !turnProcessed && !isCreator}
		<h2>Waiting for host to judge...</h2>
		<p class="subtitle">The game creator will judge this round.</p>
	{:else if results}
		<h2>Round Results</h2>
		<div class="results-list">
			{#each results as entry}
				<div class="result-card" class:winner={entry.isRoundWinner}>
					<div class="result-header">
						<span class="bot-name">{entry.name}</span>
						{#if entry.isRoundWinner}
							<span class="winner-badge">WINNER</span>
						{/if}
						<span class="bot-score">Score: {entry.score}</span>
					</div>
					{#if entry.text}
						<p class="bot-response">"{entry.text}"</p>
					{/if}
				</div>
			{/each}
		</div>
		{#if globalState.is_game_over}
			<p class="game-over-text">Game Over!</p>
		{:else}
			<button onclick={advanceTurn}>
				Next Turn
			</button>
		{/if}
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
	.results-list {
		width: 100%;
		max-width: 500px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 1rem 0;
	}
	.result-card {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 2px solid #ddd;
		background: #fafafa;
	}
	.result-card.winner {
		border-color: rgb(123, 255, 0);
		background: rgb(240, 255, 220);
	}
	.result-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.bot-name {
		font-weight: bold;
		font-size: 1.1rem;
	}
	.winner-badge {
		background: rgb(123, 255, 0);
		color: black;
		font-size: 0.7rem;
		font-weight: bold;
		padding: 0.15rem 0.5rem;
		border-radius: 1rem;
	}
	.bot-score {
		margin-left: auto;
		color: #666;
		font-size: 0.9rem;
	}
	.bot-response {
		margin-top: 0.5rem;
		font-style: italic;
		color: #444;
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
