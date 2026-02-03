<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import { untrack } from 'svelte';
	import LoadingCommas from './LoadingCommas.svelte';

	export type BotInfo = {
		id: string;
		name: string;
		points: number;
		turnComplete: boolean;
		isHost: boolean;
		isAuto: boolean;
	};

	type Props = {
		onLobbyStateChange?: (state: {
			joinedBots: BotInfo[];
			addingAi: boolean;
			isCountdownPending: boolean;
		}) => void;
	};

	let { onLobbyStateChange }: Props = $props();

	$effect(() => {
		onLobbyStateChange?.({ joinedBots, addingAi, isCountdownPending });
	});

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
