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
		margin: 0.6rem;
		flex-direction: column;
	}

	.aligner {
		flex-direction: row;
		justify-content: flex-start;
		align-items: flex-start;
	}

	.message-aligner-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background-color: #ffe2f5;
		border-radius: 5px;
		padding: 0.5rem;
		border-left: 3px solid #ff00aa;
		max-width: 85%;
	}

	.name {
		font-weight: bold;
		font-size: 10px;
		color: #ff00aa;
		margin-bottom: 0.2rem;
	}

	.text {
		font-size: 13px;
		color: #333;
		font-style: italic;
		text-align: left;
	}
</style>
