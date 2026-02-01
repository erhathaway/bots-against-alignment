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
		margin: 0.6rem;
		flex-direction: column;
	}

	.turn-prompt {
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.turn-prompt-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: rgb(123, 255, 0);
		border: 2px solid rgb(80, 180, 0);
		border-radius: 10px;
		padding: 0.75rem 1.25rem;
		width: 90%;
	}

	.turn-prompt-label {
		font-size: 10px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgb(50, 100, 0);
		margin-bottom: 0.3rem;
	}

	.turn-prompt-text {
		font-size: 1rem;
		font-weight: bold;
		color: #000;
		text-align: center;
	}
</style>
