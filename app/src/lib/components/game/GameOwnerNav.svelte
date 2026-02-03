<script lang="ts">
	import type { BotInfo } from './Lobby.svelte';

	type Props = {
		onAddAi: () => void;
		onRemoveAi: (playerId: string) => void;
		onOpenSettings: () => void;
		onStartGame: () => void;
		joinedBots: BotInfo[];
		addingAi: boolean;
		startingGame: boolean;
		canStart: boolean;
	};

	let {
		onAddAi,
		onRemoveAi,
		onOpenSettings,
		onStartGame,
		joinedBots,
		addingAi,
		startingGame,
		canStart
	}: Props = $props();

	let aiBots = $derived(joinedBots.filter((b) => b.isAuto));
</script>

<nav class="game-owner-nav">
	<div class="nav-left">
		<button class="config-btn" onclick={onOpenSettings}>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
			>
				<circle cx="12" cy="12" r="3"></circle>
				<path
					d="M12 1v6m0 6v6m6-12h-6m-6 0H1m17.66 3.66l-4.24 4.24M9.88 14.12l-4.24 4.24m12.72 0l-4.24-4.24M9.88 9.88L5.64 5.64"
				></path>
			</svg>
			<span>Config</span>
		</button>

		<div class="divider"></div>

		<button class="ai-btn" onclick={onAddAi} disabled={addingAi || joinedBots.length >= 8}>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="8" x2="12" y2="16"></line>
				<line x1="8" y1="12" x2="16" y2="12"></line>
			</svg>
			<span>{addingAi ? 'Adding AI...' : 'Add AI'}</span>
		</button>

		{#if aiBots.length > 0}
			<div class="ai-list">
				{#each aiBots as bot (bot.id)}
					<div class="ai-chip">
						<span>{bot.name}</span>
						<button class="remove-ai" onclick={() => onRemoveAi(bot.id)}>×</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<button class="start-btn" onclick={onStartGame} disabled={!canStart || startingGame}>
		<div class="start-content">
			{#if startingGame}
				<span class="start-text">Starting...</span>
			{:else}
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z" />
				</svg>
				<span class="start-text">Start Game</span>
			{/if}
		</div>
	</button>
</nav>

<style>
	.game-owner-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 4rem;
		background: #000000;
		display: flex;
		align-items: stretch;
		z-index: 150;
		border-bottom: 3px solid var(--color-accent);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.nav-left {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 1.5rem;
	}

	.config-btn,
	.ai-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border: 1.5px solid rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 220ms var(--ease);
		white-space: nowrap;
	}

	.config-btn:hover,
	.ai-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		border-color: var(--color-accent);
		box-shadow: 0 0 12px rgba(230, 200, 50, 0.3);
	}

	.ai-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.divider {
		width: 1px;
		height: 2rem;
		background: rgba(255, 255, 255, 0.2);
	}

	.ai-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.ai-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px dashed rgba(255, 255, 255, 0.3);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		color: #ffffff;
	}

	.remove-ai {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 220ms var(--ease);
	}

	.remove-ai:hover {
		color: #ffffff;
	}

	.start-btn {
		min-width: 280px;
		background: var(--color-accent);
		color: #000000;
		border: none;
		border-left: 3px solid #000000;
		cursor: pointer;
		transition: all 220ms var(--ease);
		position: relative;
		overflow: hidden;
	}

	.start-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.1) 50%,
			transparent 100%
		);
		transform: translateX(-100%);
		transition: transform 0.6s ease;
	}

	.start-btn:hover::before {
		transform: translateX(100%);
	}

	.start-btn:hover:not(:disabled) {
		background: #f0d840;
		box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.2);
	}

	.start-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.start-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--color-accent);
	}

	.start-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		position: relative;
		z-index: 1;
	}

	.start-text {
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
</style>
