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
		message: string;
		type: 'chat' | 'status' | 'system';
	};

	type Props = {
		messages: FeedMessage[];
		currentBotName?: string | null;
		showAlignerTyping?: boolean;
		turnPrompt?: string;
	};

	let {
		messages,
		currentBotName = null,
		showAlignerTyping = false,
		turnPrompt = ''
	}: Props = $props();

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
		{:else if message.type === 'system' && message.senderName === 'Game Over'}
			{@const winner = tryParseJSON(message.message)}
			{#if winner}
				<GameOverMessage {winner} />
			{/if}
		{:else if message.type === 'system'}
			<SystemMessage message={message.message} />
		{:else if message.type === 'status' && message.senderName === 'Bot Response'}
			{@const bot = tryParseJSON(message.message)}
			{#if bot}
				<BotResponseMessage
					name={bot.name}
					text={bot.text}
					prompt={turnPrompt}
					mine={isMe(bot.name)}
				/>
			{/if}
		{:else if message.type === 'status'}
			<StatusMessage
				senderName={message.senderName ?? 'Unknown'}
				message={message.message}
				isMe={isMe(message.senderName)}
			/>
		{:else}
			<ChatBubble
				senderName={message.senderName ?? 'Unknown'}
				message={message.message}
				isUser={isMe(message.senderName)}
			/>
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
