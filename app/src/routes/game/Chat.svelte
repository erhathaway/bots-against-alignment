<script lang="ts">
	import { globalState } from '$lib/state/store.svelte';
	import { tick, untrack } from 'svelte';

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

	function stringToColor(str: string) {
		let hash = 0;
		for (let index = 0; index < str.length; index++) {
			hash = str.charCodeAt(index) + ((hash << 5) - hash);
		}
		return hash;
	}

	function intToRGB(value: number) {
		const hexValue = (value & 0x00ffffff).toString(16).toUpperCase();
		return '#' + '00000'.substring(0, 6 - hexValue.length) + hexValue;
	}

	function getNameColor(name: string) {
		return intToRGB(stringToColor(name));
	}

	function displayName(senderName: string | null) {
		if (!senderName) return 'Unknown';
		if (senderName === globalState.bot_name) return 'You';
		return senderName;
	}

	function isMe(senderName: string | null) {
		return Boolean(senderName && senderName === globalState.bot_name);
	}
</script>

<div class="chat-window">
	<div class="message-container" bind:this={messageContainer}>
		{#each messages as message (message.id)}
			{#if message.type === 'system' && message.senderName === 'Turn Prompt'}
				<div class="message turn-prompt">
					<div class="turn-prompt-container">
						<div class="turn-prompt-label">Turn Prompt</div>
						<div class="turn-prompt-text">{message.message}</div>
					</div>
				</div>
			{:else if message.type === 'system' && message.senderName === 'The Aligner'}
				<div class="message aligner">
					<div class="message-aligner-container">
						<div class="message-text name">The Aligner</div>
						<div class="message-text text">{message.message}</div>
					</div>
				</div>
			{:else if message.type === 'system'}
				<div class="message system">
					<div class="message-part-bottom">
						<div class="message-text">{message.message}</div>
					</div>
				</div>
			{:else if message.type === 'status'}
				<div class="message status">
					<div class="message-status-container">
						<div class="message-text name" class:you={isMe(message.senderName)}>{displayName(message.senderName)}</div>
						<div class="message-text text">{message.message}</div>
					</div>
				</div>
			{:else}
				<div class="message {message.senderName === globalState.bot_name ? 'user' : 'other'}">
					<div class="message-part-top">{displayName(message.senderName)}</div>
					<div class="message-part-bottom">
						<div
							class="message-icon"
							style="background-color: {getNameColor(message.senderName ?? 'Unknown')};"
						></div>
						<div class="message-text">{message.message}</div>
					</div>
				</div>
			{/if}
		{/each}
		{#if alignerTyping}
			<div class="message aligner">
				<div class="message-aligner-container">
					<div class="typing-dots">
						<span class="dot"></span>
						<span class="dot"></span>
						<span class="dot"></span>
					</div>
				</div>
			</div>
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

	.message {
		display: flex;
		margin-bottom: 1rem;
		margin: 0.6rem;
		flex-direction: column;
	}

	.message-icon {
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.user .message-text {
		padding: 10px;
		background-color: #eee;
		border-radius: 5px;
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
	}

	.user {
		justify-content: flex-start;
	}

	.other {
		justify-content: flex-end;
	}

	.other .message-text {
		padding: 10px;
		background-color: #eee;
		border-radius: 5px;
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
	}

	.other .message-part-top {
		text-align: right;
	}
	.other .message-part-bottom {
		flex-direction: row-reverse;
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

	.message-part-top {
		margin-bottom: 5px;
		font-size: 10px;
	}

	.message-part-bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.aligner {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.aligner .message-aligner-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: #ffe2f5;
		border-radius: 5px;
		padding: 0.5rem;
		border-left: 3px solid #ff00aa;
		max-width: 90%;
	}

	.aligner .name {
		font-weight: bold;
		font-size: 10px;
		color: #ff00aa;
		margin-bottom: 0.2rem;
	}

	.aligner .message-text.text {
		font-size: 13px;
		color: #333;
		font-style: italic;
	}

	.turn-prompt {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.turn-prompt .turn-prompt-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: rgb(123, 255, 0);
		border: 2px solid rgb(80, 180, 0);
		border-radius: 10px;
		padding: 0.75rem 1.25rem;
		width: 90%;
	}

	.turn-prompt .turn-prompt-label {
		font-size: 10px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgb(50, 100, 0);
		margin-bottom: 0.3rem;
	}

	.turn-prompt .turn-prompt-text {
		font-size: 1rem;
		font-weight: bold;
		color: #000;
		text-align: center;
	}

	.system {
		justify-content: center;
		align-items: center;
	}

	.system .message-text {
		border-radius: 5px;
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
		padding: 0.3rem;
		background-color: #ecffe2;
		color: rgb(98, 98, 98);
	}

	.status {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.status .message-status-container {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		background-color: #e2f1ff;
		border-radius: 5px;
		padding: 0.3rem;
	}

	.status .name {
		font-weight: bold;
		font-size: 10px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
	}

	.status .name.you {
		color: #0066cc;
	}

	.status .message-text {
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
		color: rgb(98, 98, 98);
	}

	.typing-dots {
		display: flex;
		gap: 4px;
		padding: 6px 10px;
		align-items: center;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #ff00aa;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.dot:nth-child(1) {
		animation-delay: 0s;
	}
	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0.4);
			opacity: 0.3;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
