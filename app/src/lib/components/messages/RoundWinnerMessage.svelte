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
		margin: 0.6rem;
		flex-direction: column;
	}

	.round-winner {
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.round-winner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%);
		border: 2px solid #ffb300;
		border-radius: 10px;
		padding: 0.6rem 1rem;
		width: 90%;
		gap: 0.15rem;
	}

	.round-winner-label {
		font-size: 9px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #b77b00;
	}

	.round-winner-name {
		font-size: 1rem;
		font-weight: bold;
		color: #333;
	}

	.round-winner-score {
		font-size: 11px;
		color: #777;
	}
</style>
