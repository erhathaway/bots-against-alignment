<script lang="ts">
	import { goto } from '$app/navigation';
	import { globalState } from '$lib/state/store.svelte';

	type Props = {
		winner: { name: string; score: number };
	};

	let { winner }: Props = $props();

	let playAgainLoading = $state(false);

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

<div class="game-over-message">
	<div class="header">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
			<polyline points="22 4 12 14.01 9 11.01"></polyline>
		</svg>
		<span class="title">Game Over</span>
	</div>
	<div class="winner-text">
		<strong>{winner.name}</strong> wins with <strong>{winner.score}</strong> points!
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
	.game-over-message {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: linear-gradient(135deg, rgba(230, 200, 50, 0.08) 0%, rgba(230, 200, 50, 0.02) 100%);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		box-shadow:
			0 0 0 1px rgba(230, 200, 50, 0.2),
			0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-accent);
	}

	.header svg {
		flex-shrink: 0;
	}

	.title {
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.winner-text {
		font-size: 1rem;
		color: var(--color-text);
		text-align: center;
		line-height: 1.5;
	}

	.winner-text strong {
		color: var(--color-accent);
		font-weight: 700;
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
		.game-over-message {
			padding: 1.25rem;
			margin: 1rem 0;
		}

		.title {
			font-size: 1rem;
		}

		.winner-text {
			font-size: 0.9rem;
		}

		.play-again-btn {
			padding: 0.625rem 1.25rem;
			font-size: 0.875rem;
		}
	}
</style>
