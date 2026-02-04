<script lang="ts">
	import { tick } from 'svelte';
	import GameStartMessage from './GameStartMessage.svelte';
	import TurnPromptMessage from './TurnPromptMessage.svelte';
	import RoundWinnerMessage from './RoundWinnerMessage.svelte';
	import StandingsMessage from './StandingsMessage.svelte';
	import AlignerMessage from './AlignerMessage.svelte';
	import AlignerTyping from './AlignerTyping.svelte';
	import SystemMessage from './SystemMessage.svelte';
	import BotResponseMessage from './BotResponseMessage.svelte';
	import StatusMessage from './StatusMessage.svelte';
	import ChatBubble from './ChatBubble.svelte';
	import GameOverMessage from './GameOverMessage.svelte';

	export type FeedMessage = {
		id: number;
		senderName: string | null;
		content: string;
		type:
			| 'player_joined'
			| 'player_left'
			| 'countdown_started'
			| 'game_started'
			| 'aligner_prompt_submitted'
			| 'chat'
			| 'turn_started'
			| 'bot_response'
			| 'aligner_deliberation'
			| 'round_winner'
			| 'standings'
			| 'game_over';
	};

	type Props = {
		messages: FeedMessage[];
		currentBotName?: string | null;
		showAlignerTyping?: boolean;
		turnPrompt?: string;
		onShowBotModal?: () => void;
		hasSubmittedTurn?: boolean;
	};

	let {
		messages,
		currentBotName = null,
		showAlignerTyping = false,
		turnPrompt = '',
		onShowBotModal,
		hasSubmittedTurn = false
	}: Props = $props();

	// Find the last Turn Prompt message to determine which is the current turn
	const lastTurnPromptId = $derived(() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].type === 'turn_started') {
				return messages[i].id;
			}
		}
		return null;
	});

	let container: HTMLElement | null = null;

	function tryParseJSON(str: string) {
		try {
			return JSON.parse(str);
		} catch {
			return null;
		}
	}

	function isMe(senderName: string | null) {
		return Boolean(currentBotName && senderName && senderName === currentBotName);
	}

	$effect(() => {
		// scroll to bottom when messages change
		if (container && messages.length >= 0) {
			tick().then(() => {
				container!.scrollTop = container!.scrollHeight;
			});
		}
	});
</script>

<div class="message-container" bind:this={container}>
	{#each messages as message (message.id)}
		{#if message.type === 'game_started'}
			{@const info = tryParseJSON(message.content)}
			{#if info}
				<GameStartMessage
					pointsToWin={info.pointsToWin}
					botPromptChanges={info.botPromptChanges}
					humans={info.humans}
					ai={info.ai}
				/>
			{/if}
		{:else if message.type === 'turn_started'}
			<TurnPromptMessage
				prompt={message.content}
				isCurrentTurn={message.id === lastTurnPromptId()}
				hasSubmitted={hasSubmittedTurn}
				onShowModal={onShowBotModal}
			/>
		{:else if message.type === 'round_winner'}
			{@const win = tryParseJSON(message.content)}
			{#if win}
				<RoundWinnerMessage name={win.name} score={win.score} />
			{/if}
		{:else if message.type === 'standings'}
			{@const rows = tryParseJSON(message.content)}
			{#if rows}
				<StandingsMessage {rows} />
			{/if}
		{:else if message.type === 'aligner_deliberation'}
			<AlignerMessage message={message.content} />
		{:else if message.type === 'game_over'}
			{@const winner = tryParseJSON(message.content)}
			{#if winner}
				<GameOverMessage {winner} />
			{/if}
		{:else if message.type === 'bot_response'}
			{@const bot = tryParseJSON(message.content)}
			{#if bot}
				<BotResponseMessage
					name={bot.name}
					text={bot.text}
					prompt={turnPrompt}
					mine={isMe(bot.name)}
				/>
			{/if}
		{:else if message.type === 'player_joined' || message.type === 'player_left' || message.type === 'aligner_prompt_submitted'}
			<StatusMessage
				senderName={message.senderName ?? 'Unknown'}
				message={message.content}
				isMe={isMe(message.senderName)}
			/>
		{:else if message.type === 'countdown_started'}
			<SystemMessage message={message.content} />
		{:else if message.type === 'chat'}
			<ChatBubble
				senderName={message.senderName ?? 'Unknown'}
				message={message.content}
				isUser={isMe(message.senderName)}
			/>
		{:else}
			<!-- Fallback for unknown message types -->
			<SystemMessage message={message.content} />
		{/if}
	{/each}
	{#if showAlignerTyping}
		<AlignerTyping />
	{/if}
</div>

<style>
	.message-container {
		flex: 1;
		overflow-y: auto;
		width: 100%;
		padding: 0.5rem 0;
		display: flex;
		flex-direction: column;
	}
</style>
