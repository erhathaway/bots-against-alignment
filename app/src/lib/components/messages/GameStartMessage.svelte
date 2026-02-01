<script lang="ts">
	type Props = {
		pointsToWin: number;
		botPromptChanges: number;
		humans: string[];
		ai: string[];
	};

	let { pointsToWin, botPromptChanges, humans, ai }: Props = $props();
</script>

<div class="message game-start">
	<div class="game-start-container">
		<div class="game-start-title">Game On!</div>
		<div class="game-start-rules">
			First to {pointsToWin} point{pointsToWin === 1 ? '' : 's'} &middot; {botPromptChanges}
			prompt change{botPromptChanges === 1 ? '' : 's'} per turn
		</div>
		<div class="game-start-players">
			{#each humans as name (name)}
				<span class="player-chip human">{name}</span>
			{/each}
			{#each ai as name (name)}
				<span class="player-chip ai">{name}</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		margin: 0.6rem;
		flex-direction: column;
	}

	.game-start {
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.game-start-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: linear-gradient(135deg, #111 0%, #222 100%);
		border: 2px solid rgb(123, 255, 0);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		width: 90%;
		gap: 0.4rem;
	}

	.game-start-title {
		font-size: 1rem;
		font-weight: bold;
		color: rgb(123, 255, 0);
		letter-spacing: 0.05em;
	}

	.game-start-rules {
		font-size: 11px;
		color: #ccc;
	}

	.game-start-players {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		justify-content: center;
		margin-top: 0.2rem;
	}

	.player-chip {
		font-size: 10px;
		font-weight: bold;
		padding: 0.15rem 0.5rem;
		border-radius: 1rem;
	}

	.player-chip.human {
		background: rgb(123, 255, 0);
		color: #111;
	}

	.player-chip.ai {
		background: rgb(100, 149, 237);
		color: white;
	}
</style>
