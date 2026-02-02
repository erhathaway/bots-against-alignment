<script lang="ts">
	type Props = {
		name: string;
		score: number;
	};

	let { name, score }: Props = $props();
</script>

<div class="message round-winner">
	<div class="round-winner-container">
		<div class="round-winner-label">Round Winner</div>
		<div class="round-winner-name">{name}</div>
		<div class="round-winner-score">{score} point{score === 1 ? '' : 's'}</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.5rem 0.75rem;
	}

	.round-winner {
		justify-content: center;
		align-items: center;
	}

	.round-winner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--color-accent-light);
		border: 1.5px solid var(--color-accent);
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		width: 90%;
		gap: 0.1rem;
	}

	.round-winner-label {
		font-size: 0.55rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-accent-text);
	}

	.round-winner-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.round-winner-score {
		font-size: 0.65rem;
		color: var(--color-text-muted);
	}
</style>
