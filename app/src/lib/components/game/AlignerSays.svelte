<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import LoadingBars from './LoadingBars.svelte';
	// let botsSubmitted = $state(0);
	// let totalBots = $state(0);
	// let points = $state(0);
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
				// botsSubmitted = data.botsSubmitted;
				// totalBots = data.totalBots;
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
			// let completedBots = 0;

			if (data && data.bots) {
				for (const bot of data.bots) {
					if (bot.turnComplete) {
						// completedBots++;
					} else {
						allBotsTurnComplete = false;
					}
				}
				// botsSubmitted = completedBots;
				// totalBots = data.bots.length;

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
			// points = statusData.points ?? 0;
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

<section id="bot">
	<div id="bot-card" class="card">
		<div class="config-top">
			<h2>Bot Prompt</h2>
			{#if promptLocked}
				<span class="locked-badge">LOCKED</span>
			{/if}
		</div>
		<div class="config-bottom">
			<textarea
				id="bot-prompt-input"
				bind:value={botPrompt}
				aria-label="Bot Prompt"
				disabled={hasSubmittedThisTurn || promptLocked}
			></textarea>
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
	.submitted-text {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		margin: 2rem 0;
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
		margin-top: 0;
		flex-grow: 1;
	}

	button {
		font-weight: 600;
		font-size: 0.95rem;
		padding: 0.75rem 2rem;
		border: 2px solid var(--color-border);
		background: var(--color-text);
		color: white;
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-md);
		transition: all 180ms var(--ease);
		letter-spacing: 0.02em;
		cursor: pointer;
		margin: 1.5rem 0 2rem;
	}

	button:hover {
		background: white;
		color: var(--color-text);
		border-color: var(--color-border);
	}

	button:active {
		transform: scale(0.97);
	}

	#bot {
		padding: 2rem;
		margin: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.card {
		background: white;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		width: min(85%, 480px);
		box-shadow: var(--shadow-sm);
	}

	.card .config-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		margin-bottom: 0.5rem;
	}

	.card h2 {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-secondary);
	}

	#bot-prompt-input {
		width: 100%;
		min-height: 6rem;
		border: 1.5px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
		resize: vertical;
		transition: border-color 150ms;
	}

	#bot-prompt-input:focus {
		border-color: var(--color-accent);
		outline: none;
	}

	#bot-prompt-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--color-surface);
	}

	.locked-badge {
		background: var(--color-text-muted);
		color: white;
		font-size: 0.6rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-pill);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.config-bottom {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
</style>
