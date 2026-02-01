<script lang="ts">
	import { globalState } from '$lib/state/store.svelte';
	import { tick, untrack } from 'svelte';
	import GameStartMessage from '$lib/components/messages/GameStartMessage.svelte';
	import TurnPromptMessage from '$lib/components/messages/TurnPromptMessage.svelte';
	import RoundWinnerMessage from '$lib/components/messages/RoundWinnerMessage.svelte';
	import StandingsMessage from '$lib/components/messages/StandingsMessage.svelte';
	import AlignerMessage from '$lib/components/messages/AlignerMessage.svelte';
	import AlignerTyping from '$lib/components/messages/AlignerTyping.svelte';
	import SystemMessage from '$lib/components/messages/SystemMessage.svelte';
	import BotResponseMessage from '$lib/components/messages/BotResponseMessage.svelte';
	import StatusMessage from '$lib/components/messages/StatusMessage.svelte';
	import ChatBubble from '$lib/components/messages/ChatBubble.svelte';

	type ChatMessage = {
		id: number;
		gameId: string;
		senderName: string | null;
		message: string;
		type: 'chat' | 'status' | 'system';
		createdAt: number;
	};

	let messages = $state<ChatMessage[]>([]);
	let inputText = $state('');
	let messageContainer: HTMLElement | null = null;
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
				const newMessages = data.messages as ChatMessage[];
				messages = [...messages, ...newMessages];
				lastMessageId = newMessages[newMessages.length - 1].id;
				scrollToBottom();
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

	async function sendMessage() {
		if (inputText.trim() === '') return;
		const gameId = globalState.game_id;
		const botName = globalState.bot_name;
		if (!gameId || !botName) return;

		const text = inputText;
		inputText = '';

		try {
			await fetch(`/api/game/${gameId}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, senderName: botName })
			});
			await fetchMessages();
		} catch {
			// restore text on failure
			inputText = text;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			sendMessage();
		}
	}

	async function scrollToBottom() {
		if (messageContainer) {
			await tick();
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	function tryParseJSON(str: string) {
		try {
			return JSON.parse(str);
		} catch {
			return null;
		}
	}
</script>

<div class="chat-window">
	<div class="message-container" bind:this={messageContainer}>
		{#each messages as message (message.id)}
			{#if message.type === 'system' && message.senderName === 'Game Start'}
				{@const info = tryParseJSON(message.message)}
				{#if info}
					<GameStartMessage
						pointsToWin={info.pointsToWin}
						botPromptChanges={info.botPromptChanges}
						humans={info.humans}
						ai={info.ai}
					/>
				{/if}
			{:else if message.type === 'system' && message.senderName === 'Turn Prompt'}
				<TurnPromptMessage prompt={message.message} />
			{:else if message.type === 'system' && message.senderName === 'Round Winner'}
				{@const win = tryParseJSON(message.message)}
				{#if win}
					<RoundWinnerMessage name={win.name} score={win.score} />
				{/if}
			{:else if message.type === 'system' && message.senderName === 'Standings'}
				{@const rows = tryParseJSON(message.message)}
				{#if rows}
					<StandingsMessage {rows} />
				{/if}
			{:else if message.type === 'system' && message.senderName === 'The Aligner'}
				<AlignerMessage message={message.message} />
			{:else if message.type === 'system'}
				<SystemMessage message={message.message} />
			{:else if message.type === 'status' && message.senderName === 'Bot Response'}
				{@const bot = tryParseJSON(message.message)}
				{#if bot}
					<BotResponseMessage
						name={bot.name}
						text={bot.text}
						mine={bot.name === globalState.bot_name}
					/>
				{/if}
			{:else if message.type === 'status'}
				<StatusMessage
					senderName={message.senderName ?? 'Unknown'}
					message={message.message}
					isMe={Boolean(message.senderName && message.senderName === globalState.bot_name)}
				/>
			{:else}
				<ChatBubble
					senderName={message.senderName ?? 'Unknown'}
					message={message.message}
					isUser={message.senderName === globalState.bot_name}
				/>
			{/if}
		{/each}
		{#if alignerTyping}
			<AlignerTyping />
		{/if}
	</div>
	{#if hasJoined}
		<div class="input-container">
			<input
				class="message-input"
				type="text"
				placeholder="Type your message..."
				bind:value={inputText}
				onkeydown={handleKeyPress}
			/>
			<button class="send-button" onclick={sendMessage}>Send</button>
		</div>
	{:else}
		<div class="input-container">
			<p>Join the game to chat!</p>
		</div>
	{/if}
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

	.message-container {
		flex: 2;
		overflow-y: auto;
		width: 100%;
		padding: 5px;
		display: flex;
		flex-direction: column;
	}

	.input-container {
		display: flex;
		padding: 10px;
	}

	.message-input {
		flex: 1;
		padding: 5px 10px;
		margin-left: 1rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
		width: 100%;
	}

	.send-button {
		border-radius: 5px;
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		cursor: pointer;
		border: 2px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
		border: 2px solid black;
	}
</style>
