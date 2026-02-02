<script lang="ts">
	type Props = {
		message: string;
	};

	let { message }: Props = $props();
</script>

<div class="message aligner">
	<div class="message-aligner-container">
		<div class="name">The Aligner</div>
		<div class="text">{message}</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.35rem 0.75rem;
	}

	.aligner {
		flex-direction: row;
		justify-content: flex-start;
	}

	.message-aligner-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background: var(--color-accent-light);
		border-radius: var(--radius-md);
		padding: 0.5rem 0.75rem;
		border-left: 3px solid var(--color-accent);
		max-width: 85%;
	}

	.name {
		font-weight: 600;
		font-size: 0.6rem;
		color: var(--color-accent-text);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.15rem;
	}

	.text {
		font-size: 0.8rem;
		color: var(--color-text);
		line-height: 1.5;
		font-style: italic;
	}
</style>
