<script lang="ts">
	import type { BotInfo } from '$lib/types';

	type Props = {
		onAddAi: () => void;
		onRemoveAi: (playerId: string) => void;
		onOpenSettings: () => void;
		onStartGame: () => void;
		onForceStart: () => void;
		joinedBots: BotInfo[];
		pendingAiIds: string[];
		addingAi: boolean;
		startingGame: boolean;
		canStart: boolean;
		countdownRemaining: number | null;
	};

	let {
		onAddAi,
		onRemoveAi,
		onOpenSettings,
		onStartGame,
		onForceStart,
		joinedBots,
		pendingAiIds,
		addingAi,
		startingGame,
		canStart,
		countdownRemaining
	}: Props = $props();

	let aiBots = $derived(joinedBots.filter((b) => b.isAuto));
	let isCountdownActive = $derived(countdownRemaining != null && countdownRemaining > 0);

	function formatCountdown(ms: number) {
		const totalSeconds = Math.ceil(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}
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

	{#if isCountdownActive}
		<!-- Countdown Display + Start Immediately Button -->
		<div class="countdown-section">
			<div class="countdown-display">
				<div class="countdown-label">Starting in</div>
				<div class="countdown-timer">
					{formatCountdown(countdownRemaining!)}
				</div>
			</div>
			<button class="force-start-btn" onclick={onForceStart} disabled={startingGame}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z" />
				</svg>
				<span>{startingGame ? 'Starting...' : 'Start Now'}</span>
			</button>
		</div>
	{:else}
		<!-- Normal Start Game Button -->
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
	{/if}
</nav>

<style>
	.game-owner-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 4rem;
		display: flex;
		align-items: stretch;
		z-index: 150;
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
		background: #000000;
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
		background: #e8e8e8;
		border: 1px dashed rgba(0, 0, 0, 0.2);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		color: #000000;
	}

	.ai-chip.pending {
		background: linear-gradient(
			90deg,
			rgba(230, 200, 50, 0.15) 0%,
			rgba(230, 200, 50, 0.25) 50%,
			rgba(230, 200, 50, 0.15) 100%
		);
		background-size: 200% 100%;
		border-color: var(--color-accent);
		border-style: solid;
		animation:
			pendingPulse 1.5s ease-in-out infinite,
			shimmer 2s linear infinite,
			borderGlow 1.5s ease-in-out infinite;
		position: relative;
		overflow: hidden;
	}

	.ai-chip.pending::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			45deg,
			transparent 30%,
			rgba(255, 255, 255, 0.3) 50%,
			transparent 70%
		);
		animation: shine 1.5s linear infinite;
	}

	@keyframes pendingPulse {
		0%,
		100% {
			opacity: 0.8;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.03);
		}
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	@keyframes shine {
		0% {
			transform: translate(-100%, -100%) rotate(45deg);
		}
		100% {
			transform: translate(100%, 100%) rotate(45deg);
		}
	}

	@keyframes borderGlow {
		0%,
		100% {
			box-shadow:
				0 0 5px rgba(230, 200, 50, 0.3),
				inset 0 0 5px rgba(230, 200, 50, 0.1);
		}
		50% {
			box-shadow:
				0 0 15px rgba(230, 200, 50, 0.6),
				inset 0 0 10px rgba(230, 200, 50, 0.2);
		}
	}

	.loading-dots {
		position: relative;
		z-index: 1;
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.loading-dots::after {
		content: '';
		animation: dots 1.5s steps(4, end) infinite;
	}

	@keyframes dots {
		0%,
		20% {
			content: '';
		}
		40% {
			content: '.';
		}
		60% {
			content: '..';
		}
		80%,
		100% {
			content: '...';
		}
	}

	.remove-ai {
		background: none;
		border: none;
		color: #000000;
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
		color: #333333;
	}

	/* Countdown Section */
	.countdown-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1.5rem;
		border-left: 3px solid rgba(255, 255, 255, 0.1);
	}

	.countdown-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.countdown-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
	}

	.countdown-timer {
		font-size: 1.5rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-accent);
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.3);
		letter-spacing: 0.05em;
	}

	.force-start-btn {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-accent);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		cursor: pointer;
		transition: all 220ms var(--ease);
		white-space: nowrap;
		margin-top: 1.25rem;
	}

	.force-start-btn:hover:not(:disabled) {
		background: var(--color-accent);
		color: #000000;
		box-shadow: 0 0 20px rgba(230, 200, 50, 0.4);
	}

	.force-start-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.force-start-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Normal Start Button */
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
		margin-top: 0.75rem;
		margin-right: 1.5rem;
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
