<script lang="ts">
	import { globalState, leaveCurrentGame, addNotification } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import GameLayout from '$lib/components/game/GameLayout.svelte';
	import GameSettingsModal from '$lib/components/game/GameSettingsModal.svelte';
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
	let isCreator = $derived(globalState.creator_id != null);

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
	let addingAi = $state(false);
	let isCountdownPending = $state(false);

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
					source_url: 'game',
					title: 'Error adding AI player',
					body: data.error || data.message || JSON.stringify(data),
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'add_ai'
				});
			}
			await fetchGameStatus();
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

			if (!response.ok) {
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
				joinedBots = data.bots as BotInfo[];
			}

			const status = data.status;
			if (status === 'ALIGNER_SETUP') {
				globalState.is_collecting_aligner_prompts = true;
			}
			if (status === 'STARTED' || status === 'ENDED') {
				globalState.is_game_started = true;
				globalState.is_collecting_aligner_prompts = false;
			}
		} catch {
			// silently ignore polling errors
		}
	}

	$effect(() => {
		const gameId = globalState.game_id;
		if (!gameId) return;

		untrack(() => fetchGameStatus());
		const intervalId = setInterval(fetchGameStatus, 3000);
		return () => clearInterval(intervalId);
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

{#if showSettingsModal}
	<GameSettingsModal onClose={() => (showSettingsModal = false)} {isCreator} />
{/if}

{#if globalState.has_player_joined}
	<GameLayout
		{showGameOwnerNav}
		onAddAi={addAiPlayer}
		onRemoveAi={removeAiPlayer}
		onStartGame={beginCountdown}
		onOpenSettings={() => (showSettingsModal = true)}
		{joinedBots}
		{addingAi}
		startingGame={isCountdownPending}
		{canStart}
		onLeave={handleLeave}
		{isLeavePending}
		{messages}
		currentBotName={globalState.bot_name}
		showAlignerTyping={alignerTyping}
		{hasJoined}
		onSendMessage={handleSendMessage}
	/>
{/if}
