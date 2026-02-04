<script lang="ts">
	import GameOwnerNav from './GameOwnerNav.svelte';
	import PlayerScoreboard from './PlayerScoreboard.svelte';
	import GameControls from './GameControls.svelte';
	import MessageFeed from '$lib/components/messages/MessageFeed.svelte';
	import ChatInput from '$lib/components/messages/ChatInput.svelte';
	import type { BotInfo } from './Lobby.svelte';
	import type { FeedMessage } from '$lib/components/messages/MessageFeed.svelte';

	type Props = {
		// Game owner controls (lobby phase only)
		showGameOwnerNav: boolean;
		onAddAi?: () => void;
		onRemoveAi?: (id: string) => void;
		onStartGame?: () => void;
		onForceStart?: () => void;
		onOpenSettings?: () => void;
		joinedBots?: BotInfo[];
		addingAi?: boolean;
		startingGame?: boolean;
		canStart?: boolean;
		countdownRemaining?: number | null;

		// Leave game
		onLeave: () => void;
		isLeavePending: boolean;

		// Rules
		onOpenRules: () => void;

		// Chat
		messages: FeedMessage[];
		currentBotName: string | null;
		showAlignerTyping: boolean;
		hasJoined: boolean;
		onSendMessage: (text: string) => void;
	};

	let {
		showGameOwnerNav,
		onAddAi,
		onRemoveAi,
		onStartGame,
		onForceStart,
		onOpenSettings,
		joinedBots = [],
		addingAi = false,
		startingGame = false,
		canStart = false,
		countdownRemaining = null,
		onLeave,
		isLeavePending,
		onOpenRules,
		messages,
		currentBotName,
		showAlignerTyping,
		hasJoined,
		onSendMessage
	}: Props = $props();
</script>

{#if showGameOwnerNav && onAddAi && onRemoveAi && onStartGame && onForceStart && onOpenSettings}
	<GameOwnerNav
		{onAddAi}
		{onRemoveAi}
		{onOpenSettings}
		{onStartGame}
		{onForceStart}
		{joinedBots}
		{addingAi}
		{startingGame}
		{canStart}
		{countdownRemaining}
	/>
{/if}

<PlayerScoreboard withGameOwnerNav={showGameOwnerNav} />

<GameControls {onLeave} {isLeavePending} {onOpenRules} />

<div class="chat-container" class:with-game-owner-nav={showGameOwnerNav}>
	<MessageFeed {messages} {currentBotName} {showAlignerTyping} />
</div>

<div class="chat-input-wrapper">
	<ChatInput {hasJoined} onSend={onSendMessage} />
</div>

<style>
	.chat-container {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		padding-top: 8rem;
		padding-bottom: 180px;
		min-height: 100vh;
		overflow-y: auto;
	}

	.chat-container.with-game-owner-nav {
		padding-top: 12rem;
	}

	.chat-input-wrapper {
		/* ChatInput already has fixed positioning, this is just a container */
		position: relative;
		z-index: 120;
	}

	@media (max-width: 768px) {
		.chat-container {
			padding-top: 7rem;
			padding-bottom: 160px;
		}

		.chat-container.with-game-owner-nav {
			padding-top: 11rem;
		}
	}
</style>
