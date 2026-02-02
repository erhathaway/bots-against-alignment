<script lang="ts">
	type Props = {
		prompt: string;
	};

	let { prompt }: Props = $props();
</script>

<div class="message turn-prompt">
	<div class="turn-prompt-container">
		<div class="turn-prompt-label">Turn Prompt</div>
		<div class="turn-prompt-text">{prompt}</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.5rem 0.75rem;
	}

	.turn-prompt {
		justify-content: center;
		align-items: center;
	}

	.turn-prompt-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: white;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.75rem 1.25rem;
		width: 90%;
	}

	.turn-prompt-label {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		margin-bottom: 0.25rem;
	}

	.turn-prompt-text {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: center;
	}
</style>
