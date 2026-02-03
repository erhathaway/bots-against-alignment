<script lang="ts">
	import GameLink from './GameLink.svelte';

	type Props = {
		onLeave: () => void;
		isLeavePending: boolean;
	};

	let { onLeave, isLeavePending }: Props = $props();
</script>

<!-- Game Link - Bottom Right -->
<div class="game-link-wrapper">
	<GameLink />
</div>

<!-- Leave Button - Bottom Left -->
<button class="leave-btn" onclick={onLeave} disabled={isLeavePending}>
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
	>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
		<polyline points="16 17 21 12 16 7"></polyline>
		<line x1="21" y1="12" x2="9" y2="12"></line>
	</svg>
	<span>{isLeavePending ? 'Leaving...' : 'Leave Game'}</span>
</button>

<style>
	.game-link-wrapper {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 130;
	}

	.leave-btn {
		position: fixed;
		bottom: 1.5rem;
		left: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 1rem;
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		background: #ffffff;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 220ms var(--ease);
		box-shadow: var(--shadow-sm);
		z-index: 130;
	}

	.leave-btn svg {
		flex-shrink: 0;
		opacity: 0.7;
		transition: opacity 220ms var(--ease);
	}

	.leave-btn:hover:not(:disabled) {
		border-color: var(--color-border);
		color: var(--color-text);
		box-shadow: var(--shadow-md);
	}

	.leave-btn:hover:not(:disabled) svg {
		opacity: 1;
	}

	.leave-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.leave-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.game-link-wrapper {
			bottom: 1rem;
			right: 1rem;
		}

		.leave-btn {
			bottom: 1rem;
			left: 1rem;
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
			gap: 0.5rem;
		}

		.leave-btn svg {
			width: 16px;
			height: 16px;
		}
	}
</style>
