<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import { untrack } from 'svelte';
	import LoadingBars from './LoadingBars.svelte';
	import LoadingCommas from './LoadingCommas.svelte';
	import GameLink from './GameLink.svelte';
	import CreatorNav from './CreatorNav.svelte';

	export type BotInfo = {
		id: string;
		name: string;
		points: number;
		turnComplete: boolean;
		isHost: boolean;
		isAuto: boolean;
	};

	type Props = {
		onOpenSettings?: () => void;
		onLobbyStateChange?: (state: {
			joinedBots: BotInfo[];
			addingAi: boolean;
			isCountdownPending: boolean;
		}) => void;
		addAiPlayer?: () => void;
		removeAiPlayer?: (playerId: string) => void;
		beginCountdown?: () => void;
	};

	let { onOpenSettings, onLobbyStateChange, ...props }: Props = $props();

	$effect(() => {
		onLobbyStateChange?.({ joinedBots, addingAi, isCountdownPending });
	});

	export { addAiPlayer, removeAiPlayer, beginCountdown };

	let joinedBots = $state<BotInfo[]>([]);
	let fetchStatusInterval: ReturnType<typeof setInterval> | null = null;
	let isCreator = $derived(globalState.creator_id != null);
	let addingAi = $state(false);
	let countdownStartedAt = $state<number | null>(null);
	let countdownRemaining = $state<number | null>(null);

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
	{#if countdownRemaining != null && countdownRemaining > 0}
		<div class="countdown">
			<p class="countdown-timer">{formatCountdown(countdownRemaining)}</p>
			<p class="countdown-warning">Make sure your prompts are ready!</p>
		</div>
	{:else if countdownRemaining === 0}
		<div class="countdown">
			<p class="countdown-timer">Starting game<LoadingCommas /></p>
		</div>
	{:else if !isCreator}
		<p class="non-creator">Waiting for the host to start the game<LoadingCommas /></p>
	{:else if isForceStartPending}
		<LoadingBars />
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
</style>
