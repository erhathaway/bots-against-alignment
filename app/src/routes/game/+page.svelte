<script lang="ts">
	import { globalState, leaveCurrentGame, addNotification } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import GameLayout from '$lib/components/game/GameLayout.svelte';
	import GameSettingsModal from '$lib/components/game/GameSettingsModal.svelte';
	import RulesModal from '$lib/components/game/RulesModal.svelte';
	import AlignerPromptModal from '$lib/components/game/AlignerPromptModal.svelte';
	import BotResponseModal from '$lib/components/game/BotResponseModal.svelte';
	import type { PageData } from './$types';
	import type { FeedMessage } from '$lib/components/messages/MessageFeed.svelte';
	import type { BotInfo } from '$lib/components/game/Lobby.svelte';

	let { data }: { data: PageData } = $props();

	// =====================
	// Game state tracking
	// =====================

	$effect(() => {
		const gameId = data.gameId;
		if (!gameId) return;

		// If the game ID changed or player hasn't joined, redirect to homepage
		if (globalState.game_id !== gameId) {
			if (!globalState.has_player_joined) {
				goto('/');
				return;
			}
			globalState.game_id = gameId;
		}

		if (!globalState.has_player_joined) {
			goto('/');
			return;
		}
	});

	$effect(() => {
		if (!browser) return;
		const gameId = globalState.game_id;
		if (!gameId) return;

		const url = new URL(window.location.href);
		if (url.searchParams.get('game_id') !== gameId) {
			url.searchParams.set('game_id', gameId);
			goto(`?${url.searchParams.toString()}`, { replaceState: true });
		}
	});

	// =====================
	// Settings modal
	// =====================

	let showSettingsModal = $state(false);
	let showRulesModal = $state(false);
	let isCreator = $derived(globalState.creator_id != null);

	// =====================
	// Aligner prompt modal
	// =====================

	let hasSubmittedAlignerPrompt = $state(false);
	let showAlignerPromptModal = $derived(
		globalState.is_collecting_aligner_prompts && !hasSubmittedAlignerPrompt
	);

	// =====================
	// Bot response modal
	// =====================

	let hasSubmittedBotResponse = $state(false);
	let currentTrackedTurnId = $state<number | null>(null);
	let promptsRemaining = $state(2);
	let currentTurnPrompt = $state('');

	// Reset submission state when turn changes
	$effect(() => {
		const turnId = globalState.last_turn_id;
		if (turnId !== null && turnId !== currentTrackedTurnId) {
			currentTrackedTurnId = turnId;
			hasSubmittedBotResponse = false;
		}
	});

	// Fetch user prompts remaining
	$effect(() => {
		const gameId = globalState.game_id;
		const userId = globalState.user_id;
		if (!gameId || !userId || !globalState.is_game_started) return;

		const fetchPromptsRemaining = async () => {
			try {
				const response = await fetch(`/api/game/${gameId}/me?playerId=${userId}`);
				if (response.ok) {
					const data = await response.json();
					promptsRemaining = data.promptsRemaining ?? 2;
				}
			} catch {
				// ignore
			}
		};

		fetchPromptsRemaining();
		const interval = setInterval(fetchPromptsRemaining, 5000);
		return () => clearInterval(interval);
	});

	// Fetch current turn prompt
	$effect(() => {
		const gameId = globalState.game_id;
		const turnId = globalState.last_turn_id;
		if (!gameId || !turnId) return;

		const fetchTurnPrompt = async () => {
			try {
				const response = await fetch(`/api/game/${gameId}/turn/ensure`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' }
				});
				if (response.ok) {
					const data = await response.json();
					if (data.alignmentPrompt) {
						currentTurnPrompt = data.alignmentPrompt;
					}
				}
			} catch {
				// ignore
			}
		};

		fetchTurnPrompt();
	});

	let showBotResponseModal = $derived(
		globalState.is_game_started &&
			!globalState.is_collecting_aligner_prompts &&
			!globalState.is_game_over &&
			globalState.last_turn_id !== null &&
			!hasSubmittedBotResponse &&
			currentTurnPrompt !== ''
	);

	function handleBotResponseSubmitted() {
		hasSubmittedBotResponse = true;
	}

	async function submitAlignerPrompt(alignerPrompt: string) {
		const gameId = globalState.game_id;
		const playerId = globalState.user_id;
		if (!gameId || !playerId) return;

		try {
			const response = await fetch(`/api/game/${gameId}/aligner-prompt`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId, prompt: alignerPrompt })
			});

			if (response.ok) {
				hasSubmittedAlignerPrompt = true;
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'aligner-prompt',
					title: 'Error submitting aligner prompt',
					body: data.message || data.error || 'Failed to submit aligner prompt',
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'submit_aligner_prompt'
				});
			}
		} catch (error) {
			addNotification({
				source_url: 'aligner-prompt',
				title: 'Error submitting aligner prompt',
				body: 'Network error',
				kind: NotificationKind.ERROR,
				action_url: null,
				action_text: 'submit_aligner_prompt'
			});
		}
	}

	// =====================
	// Leave game
	// =====================

	let isLeavePending = $state(false);
	async function handleLeave() {
		if (isLeavePending) return;
		if (!confirm('Are you sure you want to leave this game?')) return;
		isLeavePending = true;
		try {
			const success = await leaveCurrentGame();
			if (success) {
				goto('/');
			}
		} finally {
			isLeavePending = false;
		}
	}

	// =====================
	// AI Player Management (moved from Lobby.svelte)
	// =====================

	let joinedBots = $state<BotInfo[]>([]);
	let pendingAiIds = $state<string[]>([]);
	let addingAi = $state(false);
	let isCountdownPending = $state(false);
	let countdownStartedAt = $state<number | null>(null);
	let countdownRemaining = $state<number | null>(null);
	let initialLoadComplete = $state(false);
	let hasSeenPlayers = $state(false);

	async function addAiPlayer() {
		if (addingAi) return;
		const gameId = globalState.game_id;
		const creatorId = globalState.creator_id;
		if (!gameId || !creatorId) return;

		// Generate temporary ID for pending AI
		const tempId = `pending-${Date.now()}`;
		pendingAiIds = [...pendingAiIds, tempId];
		addingAi = true;

		try {
			const response = await fetch(`/api/game/${gameId}/auto-player`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId })
			});

			if (response.ok) {
				// Wait a bit then fetch to get the new AI
				await new Promise((resolve) => setTimeout(resolve, 500));
				await fetchGameStatus();
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'game',
					title: 'Error adding AI player',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'add_ai'
				});
			}
		} finally {
			// Remove pending ID after a delay
			setTimeout(() => {
				pendingAiIds = pendingAiIds.filter((id) => id !== tempId);
			}, 1000);
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
					source_url: 'game',
					title: 'Error removing AI player',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'remove_ai'
				});
			}
			await fetchGameStatus();
		} catch {
			// ignore
		}
	}

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
					source_url: 'game',
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

	async function forceStartGame() {
		if (isCountdownPending) return;
		isCountdownPending = true;
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
				// Clear countdown
				countdownStartedAt = null;
				countdownRemaining = null;
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'game',
					title: 'Error starting game',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'start_game'
				});
			}
		} finally {
			isCountdownPending = false;
		}
	}

	async function fetchGameStatus() {
		const gameId = globalState.game_id;
		if (!gameId) return;
		const url = `/api/game/${gameId}/status`;

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) return;
			const data = await response.json();

			if (data.bots && Array.isArray(data.bots)) {
				const newBots = data.bots as BotInfo[];

				// On initial load, if we have players, mark as seen
				if (!hasSeenPlayers && newBots.length > 0) {
					hasSeenPlayers = true;
				}

				joinedBots = newBots;
			}

			if (data.countdownStartedAt !== undefined) {
				countdownStartedAt = data.countdownStartedAt;
			}

			const status = data.status;
			if (status === 'ALIGNER_SETUP') {
				globalState.is_collecting_aligner_prompts = true;
			}
			if (status === 'STARTED' || status === 'ENDED') {
				globalState.is_game_started = true;
				globalState.is_collecting_aligner_prompts = false;
			}

			// Mark initial load complete after first successful fetch
			if (!initialLoadComplete) {
				initialLoadComplete = true;
			}
			if (!hasInitialLoadHappened) {
				hasInitialLoadHappened = true;
			}
		} catch {
			// silently ignore polling errors
		}
	}

	// Show initial pending AIs based on expected count
	let expectedInitialAiCount = $state(2); // Server seeds 2 AIs by default
	let hasInitialLoadHappened = $state(false);

	$effect(() => {
		const gameId = globalState.game_id;
		if (!gameId) return;

		// Reset for new game
		hasSeenPlayers = false;
		hasInitialLoadHappened = false;
		expectedInitialAiCount = 2;

		untrack(() => fetchGameStatus());
		const intervalId = setInterval(fetchGameStatus, 3000);
		return () => clearInterval(intervalId);
	});

	// Update pending indicators based on actual AI count vs expected
	$effect(() => {
		if (!hasInitialLoadHappened) return;

		const currentAiCount = joinedBots.filter((b) => b.isAuto).length;
		const pendingCount = Math.max(0, expectedInitialAiCount - currentAiCount);

		// Generate pending IDs for each expected AI that hasn't loaded yet
		const newPendingIds = Array.from({ length: pendingCount }, (_, i) => `initial-ai-${i}`);

		// Only update if changed to avoid infinite loops
		const currentIds = JSON.stringify(pendingAiIds.filter((id) => id.startsWith('initial-ai-')));
		const newIds = JSON.stringify(newPendingIds);

		if (currentIds !== newIds) {
			// Keep manually added pending IDs, update initial ones
			pendingAiIds = [
				...pendingAiIds.filter((id) => !id.startsWith('initial-ai-')),
				...newPendingIds
			];
		}
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

	// =====================
	// Chat messages (moved from Chat.svelte)
	// =====================

	let messages = $state<FeedMessage[]>([]);
	let lastMessageId = $state(0);
	let hasJoined = $derived(Boolean(globalState.bot_name && globalState.has_player_joined));

	let alignerTyping = $derived(
		messages.length > 0 &&
			messages[messages.length - 1].senderName === 'The Aligner' &&
			messages[messages.length - 1].type === 'system'
	);

	async function fetchMessages() {
		const gameId = globalState.game_id;
		if (!gameId) return;

		try {
			const url = `/api/game/${gameId}/chat?after=${lastMessageId}`;
			const response = await fetch(url);
			if (!response.ok) return;
			const data = await response.json();
			if (data.messages && data.messages.length > 0) {
				const newMessages = data.messages as FeedMessage[];
				messages = [...messages, ...newMessages];
				lastMessageId = newMessages[newMessages.length - 1].id;
			}
		} catch {
			// silently ignore polling errors
		}
	}

	$effect(() => {
		const gameId = globalState.game_id;
		if (!gameId) return;

		// Reset on game change
		messages = [];
		lastMessageId = 0;

		untrack(() => fetchMessages());
		const intervalId = setInterval(fetchMessages, 1500);
		return () => clearInterval(intervalId);
	});

	async function handleSendMessage(text: string) {
		const gameId = globalState.game_id;
		const botName = globalState.bot_name;
		if (!gameId || !botName) return;

		try {
			await fetch(`/api/game/${gameId}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, senderName: botName })
			});
			await fetchMessages();
		} catch {
			// silently ignore send errors
		}
	}

	// =====================
	// Game phase detection
	// =====================

	let showGameOwnerNav = $derived(
		isCreator && !globalState.is_game_started && !globalState.is_collecting_aligner_prompts
	);

	let canStart = $derived(!globalState.is_game_started && joinedBots.length >= 1);
</script>

{#if showAlignerPromptModal}
	<AlignerPromptModal onSubmit={submitAlignerPrompt} />
{/if}

{#if showBotResponseModal && globalState.last_turn_id && globalState.game_id && globalState.user_id && globalState.current_bot_prompt}
	<BotResponseModal
		turnPrompt={currentTurnPrompt}
		initialBotPrompt={globalState.current_bot_prompt}
		{promptsRemaining}
		gameId={globalState.game_id}
		playerId={globalState.user_id}
		turnId={globalState.last_turn_id}
		onSubmitted={handleBotResponseSubmitted}
	/>
{/if}

{#if showSettingsModal}
	<GameSettingsModal onClose={() => (showSettingsModal = false)} {isCreator} />
{/if}

{#if showRulesModal}
	<RulesModal onClose={() => (showRulesModal = false)} />
{/if}

{#if globalState.has_player_joined}
	<GameLayout
		{showGameOwnerNav}
		onAddAi={addAiPlayer}
		onRemoveAi={removeAiPlayer}
		onStartGame={beginCountdown}
		onForceStart={forceStartGame}
		onOpenSettings={() => (showSettingsModal = true)}
		{joinedBots}
		{pendingAiIds}
		{addingAi}
		startingGame={isCountdownPending}
		{canStart}
		{countdownRemaining}
		onLeave={handleLeave}
		{isLeavePending}
		onOpenRules={() => (showRulesModal = true)}
		{messages}
		currentBotName={globalState.bot_name}
		showAlignerTyping={alignerTyping}
		{hasJoined}
		onSendMessage={handleSendMessage}
	/>
{/if}
