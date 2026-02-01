<script lang="ts">
	import { globalState } from '$lib/state/store.svelte';
	import { untrack } from 'svelte';
	import MessageFeed from '$lib/components/messages/MessageFeed.svelte';
	import ChatInput from '$lib/components/messages/ChatInput.svelte';
	import type { FeedMessage } from '$lib/components/messages/MessageFeed.svelte';

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

		// Use untrack so fetchMessages' reads (lastMessageId) don't become
		// effect dependencies — otherwise updating lastMessageId after each
		// fetch would re-trigger this effect, clearing messages in a loop.
		untrack(() => fetchMessages());
		const intervalId = setInterval(fetchMessages, 1500);
		return () => clearInterval(intervalId);
	});

	async function handleSend(text: string) {
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
</script>

<div class="chat-window">
	<MessageFeed
		{messages}
		currentBotName={globalState.bot_name}
		showAlignerTyping={alignerTyping}
	/>
	<ChatInput {hasJoined} onSend={handleSend} />
</div>

<style>
	.chat-window {
		width: 100%;
		height: 500px;
		display: flex;
		flex-direction: column;
		align-items: space-between;
		justify-content: space-between;
		flex-grow: 2;
		overflow-y: hidden;
		overflow-x: hidden;
	}
</style>
