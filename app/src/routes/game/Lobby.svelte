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

			if (status === 'STARTED' || status === 'ENDED') {
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
				globalState.is_game_started = true;
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
				{#each joinedBots as bot}
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
			<button
				class="ai-btn"
				onclick={addAiPlayer}
				disabled={addingAi || joinedBots.length >= 8}
			>
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
			<button onclick={forceStart} disabled={globalState.is_game_started}>
				Start Now
			</button>
		{/if}
	{:else}
		<GameLink />
		<p class="creator">Invite others to join</p>
		{#if isCountdownPending}
			<LoadingBars />
		{:else}
			<button onclick={beginCountdown} disabled={globalState.is_game_started}>
				Start Game
			</button>
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
	.player-list {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	.player-list h3 {
		font-size: 1.2rem;
		color: #666;
		margin-bottom: 0.75rem;
	}
	.players {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}
	.player-chip {
		background: rgb(240, 255, 220);
		border: 1px solid rgb(123, 255, 0);
		border-radius: 1rem;
		padding: 0.3rem 0.8rem;
		font-size: 0.9rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.player-chip.host {
		background: rgb(255, 245, 200);
		border: 2px solid rgb(255, 180, 0);
	}
	.player-chip.ai {
		background: rgb(220, 235, 255);
		border-color: rgb(100, 149, 237);
	}
	.host-badge {
		background: rgb(255, 180, 0);
		color: white;
		font-size: 0.65rem;
		font-weight: bold;
		padding: 0.1rem 0.4rem;
		border-radius: 0.5rem;
		vertical-align: middle;
	}
	.ai-badge {
		background: rgb(100, 149, 237);
		color: white;
		font-size: 0.65rem;
		font-weight: bold;
		padding: 0.1rem 0.4rem;
		border-radius: 0.5rem;
		vertical-align: middle;
	}
	.remove-ai {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		font-size: 0.8rem;
		padding: 0 0.2rem;
		margin: 0;
		line-height: 1;
	}
	.remove-ai:hover {
		color: red;
		background: none;
	}
	.ai-controls {
		margin-bottom: 1rem;
	}
	.ai-btn {
		font-size: 0.9rem;
		padding: 0.4rem 1rem;
		cursor: pointer;
		border: 2px dashed #999;
		background: white;
		border-radius: 1rem;
		color: #666;
		font-weight: bold;
	}
	.ai-btn:hover {
		border-color: rgb(100, 149, 237);
		color: black;
		background: rgb(220, 235, 255);
	}
	.ai-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.settings {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}
	.setting-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}
	.setting-row label {
		font-size: 0.85rem;
		color: #666;
		font-weight: 600;
	}
	.setting-row input[type='number'] {
		width: 4rem;
		text-align: center;
		font-size: 1.1rem;
		font-weight: bold;
		padding: 0.3rem;
		border: 2px solid #ccc;
		border-radius: 0.5rem;
		outline: none;
	}
	.setting-row input[type='number']:focus {
		border-color: rgb(123, 255, 0);
	}
	.setting-value {
		font-size: 1.1rem;
		font-weight: bold;
	}
	.countdown {
		text-align: center;
		margin: 1rem 0;
	}
	.countdown-timer {
		font-size: 2rem;
		font-weight: bold;
		color: #333;
		font-variant-numeric: tabular-nums;
	}
	.countdown-warning {
		font-size: 1rem;
		color: #e67e00;
		font-weight: 600;
		margin-top: 0.3rem;
	}
	p.non-creator {
		font-size: 2rem;
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
	button {
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		margin-top: 1rem;
		margin-bottom: 2rem;
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
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
