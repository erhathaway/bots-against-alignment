<script lang="ts">
	import { globalStore } from '$lib/store';
	import { onMount, tick } from 'svelte';
	import { writable } from 'svelte/store';
	import chat_manager from '$lib/chat_manager';
	import type ChatGame from '$lib/chat_game';
	import type { Message } from '$lib/chat_types';

	let chat: ChatGame | null = null;
	let messages = writable<Message[]>([]);
	let seenMessages = new Set<string>();
	let inputText = '';
	let messageContainer: HTMLElement | null = null;
	let joinedChatGameId: string | null = null;
	let watchingChatGameId: string | null = null;
	let subscribedChatGameId: string | null = null;

	function sendMessage() {
		if (inputText.trim() === '') return;
		if (chat == null) {
			throw new Error('Chat is null');
		}

		const gameId = $globalStore.game_id;
		const botName = $globalStore.bot_name;
		if (gameId == null) {
			throw new Error('Game ID is null');
		}
		if (botName == null) {
			throw new Error('Bot name is null');
		}
		chat.sendMessage(inputText, gameId, botName);
		inputText = '';
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

	$: {
		const game_id = $globalStore.game_id;
		const bot_name = $globalStore.bot_name;

		const hasJoinedChat = joinedChatGameId === game_id;
		const hasWatchedChat = watchingChatGameId === game_id;
		const hasSubscribedChat = subscribedChatGameId === game_id;

		if (hasJoinedChat && hasWatchedChat && hasSubscribedChat) {
			('false');
		} else {
			initChat();
		}
	}

	function stringToColor(str: string) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	}

	function intToRGB(i: number) {
		const c = (i & 0x00ffffff).toString(16).toUpperCase();
		return '#' + '00000'.substring(0, 6 - c.length) + c;
	}

	function getNameColor(name: string) {
		const hash = stringToColor(name);
		return intToRGB(hash);
	}

	const initChat = () => {
		const gameId = $globalStore.game_id;
		const botName = $globalStore.bot_name;
		if (gameId) {
			console.log('Init Chat');
			chat = chat_manager.findOrCreateChatGame(gameId);
			subscribeToChat();

			if (botName) {
				if (joinedChatGameId !== gameId) {
					console.log('Joining Chat');
					chat.joinGame(botName);
					joinedChatGameId = gameId;
				}
			} else {
				if (watchingChatGameId !== gameId) {
					console.log('Watching Chat');
					chat.watchGame();
					watchingChatGameId = gameId;
				}
			}
		}
	};

	const subscribeToChat = () => {
		if (!chat) {
			throw new Error('Chat not initialized. Cant subscribe to chat.');
		}
		if (subscribedChatGameId === chat.gameId) {
			return;
		}
		console.log('Subscribing to Chat');
		chat.subscribe((newMessage) => {
			const _newMessage = { ...newMessage, isUser: newMessage.botName === $globalStore.bot_name };
			console.log('New Message: ', _newMessage);
			if (seenMessages.has(_newMessage.uuid)) {
				return;
			}
			messages.update((existingMessages) => {
				return [...existingMessages, _newMessage];
			});
			console.log('Seen Messages: ', $messages);
			seenMessages.add(_newMessage.uuid);
			scrollToBottom();
		});
		subscribedChatGameId = chat.gameId;
	};

	onMount(() => {
		initChat();

		return () => {
			if (chat) {
				chat.leaveGame();
			}
		};
	});
</script>

<div class="chat-window">
	<div class="message-container" bind:this={messageContainer}>
		{#each $messages as message, i (i)}
			{#if message.isSystemMessage}
				<div class="message system">
					<div class="message-part-bottom">
						<div class="message-text">{message.message}</div>
					</div>
				</div>
			{:else if message.isStatusMessage}
				<div class="message status">
					<div class="message-status-contianer">
						<div class="message-text name">{message.botName ?? ''}</div>
						<div class="message-text text">{message.message}</div>
					</div>
				</div>
			{:else}
				<div class="message {message.isUser ? 'user' : 'other'}">
					<div class="message-part-top">{message.botName ?? 'Unknown'}</div>
					<div class="message-part-bottom">
						<div
							class="message-icon"
							style="background-color: {getNameColor(message.botName ?? 'Unknown')};"
						/>
						<div class="message-text">{message.message}</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>
	{#if joinedChatGameId && joinedChatGameId === $globalStore.game_id}
		<div class="input-container">
			<input
				class="message-input"
				type="text"
				placeholder="Type your message..."
				bind:value={inputText}
				on:keypress={handleKeyPress}
			/>
			<button class="send-button" on:click={sendMessage}>Send</button>
		</div>
	{:else}
		<div class="input-container">
			<p>Give your bot a name to join the chat!</p>
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

	.status .message-status-contianer {
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

	.status .message-text {
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
		color: rgb(98, 98, 98);
	}
</style>
