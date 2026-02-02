<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import { untrack } from 'svelte';
	import LoadingBars from './LoadingBars.svelte';
	import LoadingCommas from './LoadingCommas.svelte';
	import GameLink from './GameLink.svelte';

	type BotInfo = {
		id: string;
		name: string;
		points: number;
		turnComplete: boolean;
		isHost: boolean;
		isAuto: boolean;
	};

	let joinedBots = $state<BotInfo[]>([]);
	let fetchStatusInterval: ReturnType<typeof setInterval> | null = null;
	let isCreator = $derived(globalState.creator_id != null);
	let pointsToWin = $state(2);
	let botPromptChanges = $state(1);
	let savingSettings = $state(false);
	let addingAi = $state(false);
	let countdownStartedAt = $state<number | null>(null);
	let countdownRemaining = $state<number | null>(null);

	async function saveSettings(field: 'pointsToWin' | 'botPromptChanges', value: number) {
		const gameId = globalState.game_id;
		const creatorId = globalState.creator_id;
		if (!gameId || !creatorId) return;
		savingSettings = true;
		try {
			const response = await fetch(`/api/game/${gameId}/settings`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId, [field]: value })
			});
			if (!response.ok) {
				const data = await response.json();
				addNotification({
					source_url: 'lobby',
					title: 'Error saving settings',
					body: data.message || data,
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'save_settings'
				});
			}
		} finally {
			savingSettings = false;
		}
	}

	async function fetchStatus() {
		const gameId = globalState.game_id;
		const userId = globalState.user_id;
		if (!gameId) return;
		const url = `/api/game/${gameId}/status`;

		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await response.json();
		if (response.ok) {
			const status = data.status;

			if (data.bots && Array.isArray(data.bots)) {
				joinedBots = data.bots as BotInfo[];
			}
			if (data.pointsToWin != null) pointsToWin = data.pointsToWin;
			if (data.botPromptChanges != null) botPromptChanges = data.botPromptChanges;
			if (data.countdownStartedAt !== undefined) countdownStartedAt = data.countdownStartedAt;

			if (status === 'ALIGNER_SETUP') {
				globalState.is_collecting_aligner_prompts = true;
				if (fetchStatusInterval) clearInterval(fetchStatusInterval);
			}
			if (status === 'STARTED' || status === 'ENDED') {
				globalState.is_game_started = true;
				globalState.is_collecting_aligner_prompts = false;
				if (fetchStatusInterval) clearInterval(fetchStatusInterval);
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

		// Poll /me for host transfer detection
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

	let isCountdownPending = $state(false);
	async function beginCountdown() {
		if (isCountdownPending) return;
		isCountdownPending = true;
		try {
			if (globalState.creator_id == null) throw new Error('Only the creator can start the game');
			if (globalState.game_id == null) throw new Error('Game ID is null');
			const url = `/api/game/${globalState.game_id}/countdown`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId: globalState.creator_id })
			});

			if (response.ok) {
				const data = await response.json();
				countdownStartedAt = data.countdownStartedAt;
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'lobby',
					title: 'Error starting countdown',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'start_countdown'
				});
			}
		} finally {
			isCountdownPending = false;
		}
	}

	let isForceStartPending = $state(false);
	async function forceStart() {
		if (isForceStartPending) return;
		isForceStartPending = true;
		try {
			if (globalState.creator_id == null) throw new Error('Only the creator can start the game');
			if (globalState.is_game_started) throw new Error('Game already started');
			if (globalState.game_id == null) throw new Error('Game ID is null');
			const url = `/api/game/${globalState.game_id}/start`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId: globalState.creator_id })
			});

			if (response.ok) {
				const data = await response.json();
				if (data.status === 'ALIGNER_SETUP') {
					globalState.is_collecting_aligner_prompts = true;
				} else {
					globalState.is_game_started = true;
				}
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'lobby',
					title: 'Error starting game',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'start_game'
				});
			}
		} finally {
			isForceStartPending = false;
		}
	}

	async function addAiPlayer() {
		if (addingAi) return;
		const gameId = globalState.game_id;
		const creatorId = globalState.creator_id;
		if (!gameId || !creatorId) return;
		addingAi = true;
		try {
			const response = await fetch(`/api/game/${gameId}/auto-player`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId })
			});
			if (!response.ok) {
				const data = await response.json();
				addNotification({
					source_url: 'lobby',
					title: 'Error adding AI player',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'add_ai'
				});
			}
			await fetchStatus();
		} finally {
			addingAi = false;
		}
	}

	async function removeAiPlayer(playerId: string) {
		const gameId = globalState.game_id;
		const creatorId = globalState.creator_id;
		if (!gameId || !creatorId) return;
		try {
			const response = await fetch(`/api/game/${gameId}/auto-player`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId, playerId })
			});
			if (!response.ok) {
				const data = await response.json();
				addNotification({
					source_url: 'lobby',
					title: 'Error removing AI player',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'remove_ai'
				});
			}
			await fetchStatus();
		} catch {
			// ignore
		}
	}

	function formatCountdown(ms: number) {
		const totalSeconds = Math.ceil(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	$effect(() => {
		untrack(() => fetchStatus());
		fetchStatusInterval = setInterval(fetchStatus, 3000);
		return () => {
			if (fetchStatusInterval) clearInterval(fetchStatusInterval);
		};
	});

	// Countdown timer — ticks every second when active
	$effect(() => {
		if (!countdownStartedAt) {
			countdownRemaining = null;
			return;
		}
		const update = () => {
			const elapsed = Date.now() - countdownStartedAt!;
			const remaining = Math.max(0, 3 * 60 * 1000 - elapsed);
			countdownRemaining = remaining;
		};
		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	});
</script>

<div id="lobby">
	{#if joinedBots.length > 0}
		<div class="player-list">
			<h3>{joinedBots.length} player{joinedBots.length === 1 ? '' : 's'} in the waiting room</h3>
			<div class="players">
				{#each joinedBots as bot (bot.id)}
					<span class="player-chip" class:host={bot.isHost} class:ai={bot.isAuto}>
						{bot.name}
						{#if bot.isHost}<span class="host-badge">Host</span>{/if}
						{#if bot.isAuto}<span class="ai-badge">AI</span>{/if}
						{#if isCreator && bot.isAuto}
							<button class="remove-ai" onclick={() => removeAiPlayer(bot.id)}>&#x2715;</button>
						{/if}
					</span>
				{/each}
			</div>
		</div>
	{/if}

	{#if isCreator}
		<div class="ai-controls">
			<button class="ai-btn" onclick={addAiPlayer} disabled={addingAi || joinedBots.length >= 8}>
				{#if addingAi}
					Adding<LoadingCommas />
				{:else}
					+ Add AI Player
				{/if}
			</button>
		</div>
	{/if}

	<div class="settings">
		<div class="setting-row">
			<label for="points-to-win">Points to win</label>
			{#if isCreator}
				<input
					id="points-to-win"
					type="number"
					min="1"
					max="20"
					bind:value={pointsToWin}
					onchange={() => saveSettings('pointsToWin', pointsToWin)}
					disabled={savingSettings}
				/>
			{:else}
				<span class="setting-value">{pointsToWin}</span>
			{/if}
		</div>
		<div class="setting-row">
			<label for="bot-prompt-changes">Prompt changes allowed</label>
			{#if isCreator}
				<input
					id="bot-prompt-changes"
					type="number"
					min="0"
					max="10"
					bind:value={botPromptChanges}
					onchange={() => saveSettings('botPromptChanges', botPromptChanges)}
					disabled={savingSettings}
				/>
			{:else}
				<span class="setting-value">{botPromptChanges}</span>
			{/if}
		</div>
	</div>

	{#if countdownRemaining != null && countdownRemaining > 0}
		<div class="countdown">
			<p class="countdown-timer">{formatCountdown(countdownRemaining)}</p>
			<p class="countdown-warning">Make sure your prompts are ready!</p>
		</div>
	{:else if countdownRemaining === 0}
		<div class="countdown">
			<p class="countdown-timer">Starting game<LoadingCommas /></p>
		</div>
	{/if}

	{#if globalState.creator_id == null}
		{#if countdownRemaining != null}
			<p class="non-creator">Game starting soon<LoadingCommas /></p>
		{:else}
			<p class="non-creator">Waiting for the host to start the game<LoadingCommas /></p>
		{/if}
	{:else if countdownRemaining != null}
		{#if isForceStartPending}
			<LoadingBars />
		{:else}
			<button onclick={forceStart} disabled={globalState.is_game_started}> Start Now </button>
		{/if}
	{:else}
		<GameLink />
		<p class="creator">Invite others to join</p>
		{#if isCountdownPending}
			<LoadingBars />
		{:else}
			<button onclick={beginCountdown} disabled={globalState.is_game_started}> Start Game </button>
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
		padding: 2rem;
		gap: 1.5rem;
	}

	.player-list {
		text-align: center;
	}

	.player-list h3 {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 0.75rem;
	}

	.players {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}

	.player-chip {
		background: white;
		border: 1.5px solid var(--color-border-light);
		border-radius: var(--radius-pill);
		padding: 0.35rem 0.875rem;
		font-size: 0.8rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.player-chip.host {
		border-color: var(--color-accent);
	}

	.player-chip.ai {
		border-style: dashed;
	}

	.host-badge {
		background: var(--color-accent);
		color: white;
		font-size: 0.6rem;
		font-weight: 700;
		padding: 0.1rem 0.4rem;
		border-radius: var(--radius-pill);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ai-badge {
		background: var(--color-text-muted);
		color: white;
		font-size: 0.6rem;
		font-weight: 700;
		padding: 0.1rem 0.4rem;
		border-radius: var(--radius-pill);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.remove-ai {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 0.75rem;
		padding: 0;
		margin: 0;
		line-height: 1;
		transition: color 150ms;
	}

	.remove-ai:hover {
		color: var(--color-text);
		background: none;
	}

	.ai-controls {
		/* spacing handled by #lobby gap */
		display: contents;
	}

	.ai-btn {
		font-size: 0.8rem;
		padding: 0.4rem 1rem;
		border: 1.5px dashed var(--color-border-light);
		background: white;
		border-radius: var(--radius-pill);
		color: var(--color-text-secondary);
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms var(--ease);
	}

	.ai-btn:hover {
		border-color: var(--color-border);
		color: var(--color-text);
	}

	.ai-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.settings {
		display: flex;
		flex-direction: row;
		gap: 2.5rem;
		padding: 1rem 1.5rem;
		border: 1.5px solid var(--color-border-light);
		border-radius: var(--radius-md);
		background: white;
	}

	.setting-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	.setting-row label {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.setting-row input[type='number'] {
		width: 3.5rem;
		text-align: center;
		font-size: 1rem;
		font-weight: 600;
		padding: 0.3rem;
		border: 1.5px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		outline: none;
		transition: border-color 150ms;
	}

	.setting-row input[type='number']:focus {
		border-color: var(--color-accent);
	}

	.setting-value {
		font-size: 1rem;
		font-weight: 600;
	}

	.countdown {
		text-align: center;
	}

	.countdown-timer {
		font-size: 2.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-text);
		letter-spacing: 0.02em;
	}

	.countdown-warning {
		font-size: 0.85rem;
		color: var(--color-accent-text);
		font-weight: 500;
		margin-top: 0.25rem;
	}

	p.non-creator {
		font-size: 1rem;
		max-width: 20rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	p.creator {
		font-size: 1.1rem;
		max-width: 24rem;
		text-align: center;
		color: var(--color-text);
		font-weight: 500;
	}

	button {
		font-weight: 600;
		font-size: 1rem;
		padding: 0.75rem 2rem;
		border: 2px solid var(--color-border);
		background: var(--color-text);
		color: white;
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-md);
		transition: all 180ms var(--ease);
		letter-spacing: 0.02em;
		cursor: pointer;
	}

	button:hover {
		background: white;
		color: var(--color-text);
		border-color: var(--color-border);
	}

	button:active {
		transform: scale(0.97);
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: none;
	}
</style>
