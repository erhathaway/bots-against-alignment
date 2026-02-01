<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import LoadingBars from './LoadingBars.svelte';
	import LoadingCommas from './LoadingCommas.svelte';
	import GameLink from './GameLink.svelte';

	type BotInfo = { name: string; points: number; turnComplete: boolean; isHost: boolean };
	let joinedBots = $state<BotInfo[]>([]);
	let fetchStatusInterval: ReturnType<typeof setInterval> | null = null;
	let isCreator = $derived(globalState.creator_id != null);
	let pointsToWin = $state(2);
	let botPromptChanges = $state(1);
	let savingSettings = $state(false);

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
				globalState.is_game_started = true;
			} else {
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
	{#if joinedBots.length > 0}
		<div class="player-list">
			<h3>{joinedBots.length} player{joinedBots.length === 1 ? '' : 's'} joined</h3>
			<div class="players">
				{#each joinedBots as bot}
					<span class="player-chip" class:host={bot.isHost}>{bot.name}{#if bot.isHost} <span class="host-badge">Host</span>{/if}</span>
				{/each}
			</div>
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
	.player-list {
		text-align: center;
		margin-bottom: 2rem;
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
	}
	.player-chip.host {
		background: rgb(255, 245, 200);
		border: 2px solid rgb(255, 180, 0);
	}
	.host-badge {
		background: rgb(255, 180, 0);
		color: white;
		font-size: 0.65rem;
		font-weight: bold;
		padding: 0.1rem 0.4rem;
		border-radius: 0.5rem;
		margin-left: 0.2rem;
		vertical-align: middle;
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
