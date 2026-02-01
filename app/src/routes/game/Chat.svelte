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

	// Typewriter state for aligner messages — queued so only one types at a time
	let typewriterProgress = $state<Record<number, number>>({});
	let typewriterQueue: { msgId: number; wordCount: number }[] = [];
	let activeTypewriterId: number | null = null;
	let activeTimer: ReturnType<typeof setTimeout> | null = null;

	function randomWordDelay() {
		return 150 + Math.random() * 350;
	}

	function isAlignerMessage(msg: ChatMessage) {
		return msg.type === 'system' && msg.senderName === 'The Aligner';
	}

	function processQueue() {
		if (activeTypewriterId !== null) return;
		const next = typewriterQueue.shift();
		if (!next) return;
		activeTypewriterId = next.msgId;
		typewriterProgress[next.msgId] = 0;
		const step = () => {
			const current = typewriterProgress[next.msgId] ?? 0;
			if (current >= next.wordCount) {
				activeTimer = null;
				activeTypewriterId = null;
				processQueue();
				return;
			}
			typewriterProgress[next.msgId] = current + 1;
			scrollToBottom();
			activeTimer = setTimeout(step, randomWordDelay());
		};
		activeTimer = setTimeout(step, randomWordDelay());
	}

	function enqueueTypewriter(msgId: number, wordCount: number) {
		if (typewriterProgress[msgId] !== undefined) return;
		typewriterProgress[msgId] = -1; // mark as queued
		typewriterQueue.push({ msgId, wordCount });
		processQueue();
	}

	function getDisplayedText(msg: ChatMessage): string {
		const words = msg.message.split(/\s+/);
		const revealed = typewriterProgress[msg.id];
		if (revealed === undefined || revealed >= words.length) return msg.message;
		if (revealed <= 0) return '';
		return words.slice(0, revealed).join(' ');
	}

	function isTypewriterDone(msg: ChatMessage): boolean {
		const words = msg.message.split(/\s+/);
		const revealed = typewriterProgress[msg.id];
		return revealed === undefined || revealed >= words.length;
	}

	function isTypewriterQueued(msg: ChatMessage): boolean {
		const revealed = typewriterProgress[msg.id];
		return revealed !== undefined && revealed < 0;
	}

	let alignerTyping = $derived(
		messages.some((m) => isAlignerMessage(m) && !isTypewriterDone(m))
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
				// Queue typewriter for new aligner messages
				for (const msg of newMessages) {
					if (isAlignerMessage(msg)) {
						const words = msg.message.split(/\s+/);
						enqueueTypewriter(msg.id, words.length);
					}
				}
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
		if (activeTimer) clearTimeout(activeTimer);
		activeTimer = null;
		activeTypewriterId = null;
		typewriterQueue = [];
		typewriterProgress = {};

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
			{#if message.type === 'system' && message.senderName === 'Game Start'}
				{@const info = (() => { try { return JSON.parse(message.message); } catch { return null; } })()}
				{#if info}
					<div class="message game-start">
						<div class="game-start-container">
							<div class="game-start-title">Game On!</div>
							<div class="game-start-rules">
								First to {info.pointsToWin} point{info.pointsToWin === 1 ? '' : 's'} &middot; {info.botPromptChanges} prompt change{info.botPromptChanges === 1 ? '' : 's'} per turn
							</div>
							<div class="game-start-players">
								{#each info.humans as name}
									<span class="player-chip human">{name}</span>
								{/each}
								{#each info.ai as name}
									<span class="player-chip ai">{name}</span>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{:else if message.type === 'system' && message.senderName === 'Turn Prompt'}
				<div class="message turn-prompt">
					<div class="turn-prompt-container">
						<div class="turn-prompt-label">Turn Prompt</div>
						<div class="turn-prompt-text">{message.message}</div>
					</div>
				</div>
			{:else if message.type === 'system' && message.senderName === 'Round Winner'}
				{@const win = (() => { try { return JSON.parse(message.message); } catch { return null; } })()}
				{#if win}
					<div class="message round-winner">
						<div class="round-winner-container">
							<div class="round-winner-label">Round Winner</div>
							<div class="round-winner-name">{win.name}</div>
							<div class="round-winner-score">{win.score} point{win.score === 1 ? '' : 's'}</div>
						</div>
					</div>
				{/if}
			{:else if message.type === 'system' && message.senderName === 'Standings'}
				{@const rows = (() => { try { return JSON.parse(message.message); } catch { return null; } })()}
				{#if rows}
					<div class="message standings">
						<div class="standings-container">
							{#each rows as row, i}
								<div class="standings-row" class:leader={i === 0}>
									<span class="standings-rank">{i + 1}</span>
									<span class="standings-name">{row.name}{#if row.isAuto}<span class="standings-ai">AI</span>{/if}</span>
									<span class="standings-score">{row.score}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{:else if message.type === 'system' && message.senderName === 'The Aligner'}
				{@const displayed = getDisplayedText(message)}
				{#if displayed}
					<div class="message aligner">
						<div class="message-aligner-container">
							<div class="message-text name">The Aligner</div>
							<div class="message-text text">{displayed}{#if !isTypewriterDone(message)}<span class="typewriter-cursor">|</span>{/if}</div>
						</div>
					</div>
				{/if}
			{:else if message.type === 'system'}
				<div class="message system">
					<div class="message-part-bottom">
						<div class="message-text">{message.message}</div>
					</div>
				</div>
			{:else if message.type === 'status' && message.senderName === 'Bot Response'}
				{@const bot = (() => { try { return JSON.parse(message.message); } catch { return null; } })()}
				{#if bot}
					{@const mine = bot.name === globalState.bot_name}
					<div class="message bot-response" class:mine class:theirs={!mine}>
						{#if mine}
							<div class="bot-avatar" style="background-color: {getNameColor(bot.name)};">
								<span class="bot-avatar-face">&#x1F916;</span>
							</div>
							<div class="bot-response-body">
								<div class="bot-response-name">You</div>
								<div class="bot-response-text">{bot.text}</div>
							</div>
						{:else}
							<div class="bot-response-body">
								<div class="bot-response-name">{bot.name}</div>
								<div class="bot-response-text">{bot.text}</div>
							</div>
							<div class="bot-avatar" style="background-color: {getNameColor(bot.name)};">
								<span class="bot-avatar-face">&#x1F916;</span>
							</div>
						{/if}
					</div>
				{/if}
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
		justify-content: flex-start;
		align-items: flex-start;
	}

	.aligner .message-aligner-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background-color: #ffe2f5;
		border-radius: 5px;
		padding: 0.5rem;
		border-left: 3px solid #ff00aa;
		max-width: 85%;
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
		text-align: left;
	}

	.typewriter-cursor {
		animation: blink 0.7s step-end infinite;
		color: #ff00aa;
		font-style: normal;
		font-weight: bold;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.game-start {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.game-start .game-start-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: linear-gradient(135deg, #111 0%, #222 100%);
		border: 2px solid rgb(123, 255, 0);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		width: 90%;
		gap: 0.4rem;
	}

	.game-start .game-start-title {
		font-size: 1rem;
		font-weight: bold;
		color: rgb(123, 255, 0);
		letter-spacing: 0.05em;
	}

	.game-start .game-start-rules {
		font-size: 11px;
		color: #ccc;
	}

	.game-start .game-start-players {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		justify-content: center;
		margin-top: 0.2rem;
	}

	.game-start .player-chip {
		font-size: 10px;
		font-weight: bold;
		padding: 0.15rem 0.5rem;
		border-radius: 1rem;
	}

	.game-start .player-chip.human {
		background: rgb(123, 255, 0);
		color: #111;
	}

	.game-start .player-chip.ai {
		background: rgb(100, 149, 237);
		color: white;
	}

	.bot-response {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 0.4rem;
	}

	.bot-response.mine {
		justify-content: flex-start;
	}

	.bot-response.theirs {
		justify-content: flex-end;
	}

	.bot-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.bot-avatar-face {
		font-size: 16px;
		line-height: 1;
	}

	.bot-response-body {
		display: flex;
		flex-direction: column;
		max-width: 70%;
	}

	.bot-response-name {
		font-size: 10px;
		font-weight: bold;
		margin-bottom: 2px;
		color: #555;
	}

	.bot-response.mine .bot-response-name {
		color: #0066cc;
	}

	.bot-response.theirs .bot-response-name {
		text-align: right;
	}

	.bot-response-text {
		padding: 0.5rem 0.75rem;
		border-radius: 12px;
		font-size: 13px;
		line-height: 1.4;
		background: #f0f0f0;
		color: #222;
	}

	.bot-response.mine .bot-response-text {
		border-top-left-radius: 4px;
		background: #e8f5e9;
	}

	.bot-response.theirs .bot-response-text {
		border-top-right-radius: 4px;
		background: #f0f0f0;
	}

	.round-winner {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.round-winner .round-winner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%);
		border: 2px solid #ffb300;
		border-radius: 10px;
		padding: 0.6rem 1rem;
		width: 90%;
		gap: 0.15rem;
	}

	.round-winner .round-winner-label {
		font-size: 9px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #b77b00;
	}

	.round-winner .round-winner-name {
		font-size: 1rem;
		font-weight: bold;
		color: #333;
	}

	.round-winner .round-winner-score {
		font-size: 11px;
		color: #777;
	}

	.standings {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.standings .standings-container {
		display: flex;
		flex-direction: column;
		width: 90%;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
	}

	.standings .standings-row {
		display: flex;
		align-items: center;
		padding: 0.3rem 0.6rem;
		font-size: 12px;
		border-bottom: 1px solid #eee;
		gap: 0.4rem;
	}

	.standings .standings-row:last-child {
		border-bottom: none;
	}

	.standings .standings-row.leader {
		background: #fff8e1;
		font-weight: bold;
	}

	.standings .standings-rank {
		width: 1.2rem;
		color: #999;
		font-weight: bold;
		text-align: center;
	}

	.standings .standings-name {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.standings .standings-ai {
		font-size: 8px;
		font-weight: bold;
		background: rgb(100, 149, 237);
		color: white;
		padding: 0.05rem 0.3rem;
		border-radius: 0.5rem;
	}

	.standings .standings-score {
		font-weight: bold;
		color: #333;
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
