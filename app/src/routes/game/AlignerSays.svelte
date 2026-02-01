<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import LoadingBars from './LoadingBars.svelte';
	let botsSubmitted = $state(0);
	let totalBots = $state(0);
	let points = $state(0);
	let promptsRemaining = $state(2);
	let hasSubmittedThisTurn = $state(false);
	let trackedTurnId = $state<number | null>(null);
	let botPrompt = $state(globalState.current_bot_prompt ?? '');
	let promptLocked = $derived(promptsRemaining <= 0);

	$effect(() => {
		const gameId = globalState.game_id;
		if (!gameId) return;
		botPrompt = globalState.current_bot_prompt ?? '';
	});

	$effect(() => {
		const turnId = globalState.last_turn_id;
		if (turnId !== null && turnId !== trackedTurnId) {
			trackedTurnId = turnId;
			hasSubmittedThisTurn = false;
		}
	});

	async function fetchTurnFinale() {
		const gameId = globalState.game_id;
		const currentTurnId = globalState.last_turn_id;
		if (!gameId || !currentTurnId) return;

		try {
			const url = `/api/game/${gameId}/turn/${currentTurnId}/finale`;
			const response = await fetch(url);
			const data = await response.json();
			if (response.ok) {
				botsSubmitted = data.botsSubmitted;
				totalBots = data.totalBots;
			} else if (response.status !== 404) {
				addNotification({
					source_url: 'aligner says',
					title: 'Error getting turn finale',
					body: data,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'get turn finale'
				});
			}
		} catch (error) {
			console.error('Failed to fetch turn finale:', error);
		}
	}

	async function fetchGameStatus() {
		const gameId = globalState.game_id;
		const botName = globalState.bot_name;
		if (!gameId) return;

		const url = `/api/game/${gameId}/status`;
		const response = await fetch(url);
		const data = await response.json();

		if (response.ok) {
			if (data.status === 'ENDED') {
				globalState.is_game_over = true;
				return;
			}

			let allBotsTurnComplete = true;
			let completedBots = 0;

			if (data && data.bots) {
				for (const bot of data.bots) {
					if (bot.turnComplete) {
						completedBots++;
					} else {
						allBotsTurnComplete = false;
					}
				}
				botsSubmitted = completedBots;
				totalBots = data.bots.length;

				if (botName && totalBots > 0) {
					globalState.have_all_users_submitted = allBotsTurnComplete;
				}
			}
		} else {
			addNotification({
				source_url: 'aligner says',
				title: 'Error getting game status',
				body: data,
				kind: NotificationKind.ERROR,
				action_url: url,
				action_text: 'get game status'
			});
		}
	}

	async function ensureTurn() {
		const gameId = globalState.game_id;
		if (!gameId) return;
		const response = await fetch(`/api/game/${gameId}/turn/ensure`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await response.json();

		if (response.ok) {
			const alignmentPrompt = data.alignmentPrompt;
			if (data.turnId && data.turnId !== globalState.last_turn_id) {
				globalState.last_turn_id = data.turnId;
			}
			if (alignmentPrompt && alignmentPrompt !== globalState.last_alignment_request) {
				globalState.last_alignment_request = alignmentPrompt;
			}
		} else {
			addNotification({
				source_url: 'aligner says',
				title: 'Error getting turn',
				body: data,
				kind: NotificationKind.ERROR,
				action_url: `/api/game/${gameId}/turn/ensure`,
				action_text: 'get turn'
			});
		}
	}

	async function fetchUserStatus() {
		const gameId = globalState.game_id;
		const userId = globalState.user_id;
		if (!gameId || !userId) return;

		const userStatusUrl = `/api/game/${gameId}/me?playerId=${userId}`;
		const statusResponse = await fetch(userStatusUrl);
		const statusData = await statusResponse.json();

		if (statusResponse.ok) {
			points = statusData.points ?? 0;
			promptsRemaining = statusData.promptsRemaining ?? 0;
			if (statusData.creatorId) {
				globalState.creator_id = statusData.creatorId;
			}
		} else {
			addNotification({
				source_url: 'aligner says',
				title: 'Error getting user status',
				body: statusData,
				kind: NotificationKind.ERROR,
				action_url: userStatusUrl,
				action_text: 'get user status'
			});
		}
	}

	async function fetchData() {
		await ensureTurn();
		await Promise.all([fetchGameStatus(), fetchTurnFinale(), fetchUserStatus()]);
	}

	$effect(() => {
		if (!globalState.game_id) return;
		fetchData();
		const intervalId = setInterval(fetchData, 3000);
		return () => clearInterval(intervalId);
	});

	let isCompleteTurnPending = $state(false);
	async function completeTurn() {
		if (isCompleteTurnPending) return;

		isCompleteTurnPending = true;
		try {
			const gameId = globalState.game_id;
			const userId = globalState.user_id;
			const turnId = globalState.last_turn_id;
			if (!gameId || !userId || !turnId) {
				throw new Error('Missing game/user/turn context');
			}
			const suggestion = botPrompt ?? '';

			const response = await fetch(`/api/game/${gameId}/turn/${turnId}/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId: userId, suggestion })
			});

			if (response.ok) {
				globalState.current_bot_prompt = botPrompt ?? globalState.current_bot_prompt;
				hasSubmittedThisTurn = true;
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'aligner says',
					title: 'Error completing turn',
					body: data,
					kind: NotificationKind.ERROR,
					action_url: `/api/game/${gameId}/turn/${turnId}/submit`,
					action_text: 'complete turn'
				});
			}
		} finally {
			isCompleteTurnPending = false;
		}
	}
</script>

<div class="status-bar">
	<span class="score">Score: {points}</span>
	<span class="prompts-left">
		{#if promptLocked}
			Prompt locked
		{:else}
			{promptsRemaining} prompt change{promptsRemaining === 1 ? '' : 's'} remaining
		{/if}
	</span>
	<span class="progress">{botsSubmitted} / {totalBots} bots submitted</span>
</div>
<section id="bot">
	<div id="bot-card" class="card">
		<div class="config-top">
			<h2>Bot Prompt</h2>
			{#if promptLocked}
				<span class="locked-badge">LOCKED</span>
			{/if}
		</div>
		<div class="config-bottom">
			<textarea id="bot-prompt-input" bind:value={botPrompt} aria-label="Bot Prompt" disabled={hasSubmittedThisTurn || promptLocked}></textarea>
		</div>
	</div>
</section>
<div id="button-container">
	{#if hasSubmittedThisTurn}
		<p class="submitted-text">Response submitted. Waiting for other players...</p>
	{:else if isCompleteTurnPending}
		<LoadingBars />
	{:else}
		<button onclick={completeTurn}> Tell Bot To Respond To Aligner </button>
	{/if}
</div>

<style>
	.status-bar {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		font-size: 0.9rem;
		font-weight: bold;
		border-bottom: 1px solid #eee;
	}
	.status-bar .score {
		color: rgb(0, 150, 0);
	}
	.status-bar .prompts-left {
		color: #666;
	}
	.status-bar .progress {
		color: #333;
	}
	.submitted-text {
		font-size: 1.1rem;
		color: #666;
		margin: 2rem 0 3rem;
		text-align: center;
	}
	#button-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	section {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 1rem;
		flex-grow: 2;
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

	#bot {
		padding-top: 2rem;
		margin-top: 0;

		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.card {
		background-color: rgb(123, 255, 0);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 2rem;
		padding-top: 1rem;
		width: 70%;
		border-radius: 1rem;
	}
	.card .config-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
	.card h2 {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}

	#bot-card {
		background-color: rgb(0, 204, 255);
	}

	#bot-prompt-input {
		margin-top: 1rem;
		border-radius: 1rem;
		padding: 1rem;

		width: 100%;
	}

	#bot-prompt-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.locked-badge {
		background: #666;
		color: white;
		font-size: 0.7rem;
		font-weight: bold;
		padding: 0.15rem 0.5rem;
		border-radius: 1rem;
	}

	.config-bottom {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
</style>
