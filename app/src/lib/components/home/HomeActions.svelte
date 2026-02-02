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
		gap: 1rem;
		padding: 3rem;
	}

	button {
		font-size: clamp(1rem, 3vw, 1.5rem);
		font-weight: 600;
		letter-spacing: 0.04em;
		padding: 1rem 2.5rem;
		border: 2px solid var(--color-border);
		background: #000000;
		color: #ffffff;
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		transition: all 180ms var(--ease);
	}

	button:hover {
		background: #ffffff;
		color: #000000;
		border-color: #000000;
	}

	button:active {
		transform: scale(0.97);
	}
</style>
