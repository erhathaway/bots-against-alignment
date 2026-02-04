<script lang="ts">
	import { goto } from '$app/navigation';
	import { globalState } from '$lib/state/store.svelte';
	import AnnouncementTitle from './AnnouncementTitle.svelte';

	type Props = {
		winner: { name: string; score: number };
	};

	let { winner }: Props = $props();

	let playAgainLoading = $state(false);

	const subtitle = `${winner.name} wins • ${winner.score} point${winner.score === 1 ? '' : 's'}`;

	async function playAgain() {
		const gameId = globalState.game_id;
		if (!gameId || playAgainLoading) return;
		playAgainLoading = true;
		try {
			const response = await fetch(`/api/game/${gameId}/play-again`, { method: 'POST' });
			const data = await response.json();
			if (response.ok && data.gameId) {
				goto(`/?join=${data.gameId}`);
			} else {
				goto('/');
			}
		} catch {
			goto('/');
		} finally {
			playAgainLoading = false;
		}
	}
</script>

<div class="game-over-wrapper">
	<AnnouncementTitle title="Game Over!" {subtitle} />
	<div class="winner-badge">
		<span class="trophy">🏆</span>
		<span class="winner-text">{winner.name}</span>
		<span class="points-earned">{winner.score} point{winner.score === 1 ? '' : 's'}</span>
	</div>
	<button class="play-again-btn" onclick={playAgain} disabled={playAgainLoading}>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
		>
			<polyline points="23 4 23 10 17 10"></polyline>
			<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
		</svg>
		<span>{playAgainLoading ? 'Starting...' : 'Play Again'}</span>
	</button>
</div>

<style>
	.game-over-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.winner-badge {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		background: #ffffff;
		border: 4px solid rgba(0, 0, 0, 0.5);
		border-radius: 999px;
		padding: 1.5rem 3rem;
		box-shadow:
			0 16px 48px rgba(0, 0, 0, 0.25),
			0 8px 16px rgba(0, 0, 0, 0.2);
		animation: floatAndRotate 3s ease-in-out infinite;
	}

	@keyframes floatAndRotate {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		25% {
			transform: translateY(-12px) rotate(4deg);
		}
		50% {
			transform: translateY(0) rotate(0deg);
		}
		75% {
			transform: translateY(-12px) rotate(-4deg);
		}
	}

	.trophy {
		font-size: 3.5rem;
		line-height: 1;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.15);
		}
	}

	.winner-text {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: 0.02em;
	}

	.points-earned {
		font-size: 1.75rem;
		font-weight: 700;
		color: #10b981;
		letter-spacing: 0.02em;
	}

	.play-again-btn {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-accent);
		color: #000000;
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-pill);
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		cursor: pointer;
		transition: all 220ms var(--ease);
		box-shadow: 0 2px 8px rgba(230, 200, 50, 0.3);
	}

	.play-again-btn:hover:not(:disabled) {
		background: #f0d840;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(230, 200, 50, 0.4);
	}

	.play-again-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.play-again-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.play-again-btn svg {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.play-again-btn {
			padding: 0.625rem 1.25rem;
			font-size: 0.875rem;
		}
	}
</style>
