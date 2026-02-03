<script lang="ts">
	import GameOwnerNav from './GameOwnerNav.svelte';
	import PlayerScoreboard from './PlayerScoreboard.svelte';
	import GameControls from './GameControls.svelte';
	import MessageFeed from '$lib/components/messages/MessageFeed.svelte';
	import ChatInput from '$lib/components/messages/ChatInput.svelte';
	import RulesModal from './RulesModal.svelte';
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
		messages,
		currentBotName,
		showAlignerTyping,
		hasJoined,
		onSendMessage
	}: Props = $props();

	let showRulesModal = $state(false);
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

<GameControls {onLeave} {isLeavePending} />

<div class="chat-container" class:with-game-owner-nav={showGameOwnerNav}>
	<MessageFeed {messages} {currentBotName} {showAlignerTyping} />
</div>

<div class="chat-input-wrapper">
	<ChatInput {hasJoined} onSend={onSendMessage} />
</div>

<button class="rules-button" onclick={() => (showRulesModal = true)} aria-label="View game rules">
	<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
	<span>Rules</span>
</button>

{#if showRulesModal}
	<RulesModal onClose={() => (showRulesModal = false)} />
{/if}

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

	.rules-button {
		position: fixed;
		bottom: 2rem;
		left: 2rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border: 2.5px solid var(--color-accent);
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(10px);
		color: var(--color-accent);
		border-radius: var(--radius-pill);
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		cursor: pointer;
		z-index: 150;
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.2),
			inset 0 0 30px rgba(230, 200, 50, 0.05);
		transition: all 220ms var(--ease);
	}

	.rules-button svg {
		width: 22px;
		height: 22px;
		flex-shrink: 0;
	}

	.rules-button:hover {
		background: var(--color-accent);
		color: #000000;
		box-shadow:
			0 0 30px rgba(230, 200, 50, 0.5),
			0 0 60px rgba(230, 200, 50, 0.3);
		transform: translateY(-2px);
	}

	.rules-button:active {
		transform: translateY(0) scale(0.98);
		box-shadow:
			0 0 40px rgba(230, 200, 50, 0.6),
			0 0 80px rgba(230, 200, 50, 0.4);
	}

	@media (max-width: 768px) {
		.chat-container {
			padding-top: 7rem;
			padding-bottom: 160px;
		}

		.chat-container.with-game-owner-nav {
			padding-top: 11rem;
		}

		.rules-button {
			bottom: 1rem;
			left: 1rem;
			padding: 0.875rem 1.25rem;
			font-size: 0.9rem;
		}

		.rules-button svg {
			width: 20px;
			height: 20px;
		}
	}
</style>
