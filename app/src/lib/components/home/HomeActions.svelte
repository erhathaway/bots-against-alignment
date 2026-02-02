<script lang="ts">
	type Props = {
		onJoinGame?: () => void;
		onNewGame?: () => void;
	};

	let { onJoinGame, onNewGame }: Props = $props();
</script>

<div class="buttons-container">
	<button onclick={onJoinGame}>Join Game</button>
	<button onclick={onNewGame}>New Game</button>
</div>

<style>
	.buttons-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		padding: 2rem 3rem 3rem;
		position: relative;
		z-index: 1;
	}

	button {
		font-size: clamp(0.95rem, 2.5vw, 1.25rem);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 1rem 3rem;
		border: 2.5px solid #000000;
		background: #000000;
		color: #ffffff;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		transition: all 220ms var(--ease);
		min-width: 220px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	button::before {
		content: '';
		display: inline-block;
		width: 6px;
		height: 6px;
		background: var(--color-accent);
		border-radius: 50%;
		margin-right: 0.75rem;
		box-shadow: 0 0 6px rgba(230, 200, 50, 0.6);
		transition: all 220ms var(--ease);
		flex-shrink: 0;
	}

	button:hover {
		background: #ffffff;
		color: #000000;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	button:hover::before {
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.8);
		background: #f0d840;
	}

	button:active {
		transform: scale(0.97);
		box-shadow: var(--glow-accent-strong);
	}
</style>
