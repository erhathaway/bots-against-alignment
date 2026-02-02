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
		flex-direction: column;
		margin: 0.5rem 0.75rem;
	}

	.game-start {
		justify-content: center;
		align-items: center;
	}

	.game-start-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--color-text);
		border: 1.5px solid var(--color-text);
		border-radius: var(--radius-md);
		padding: 0.75rem 1rem;
		width: 90%;
		gap: 0.35rem;
	}

	.game-start-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-accent);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.game-start-rules {
		font-size: 0.65rem;
		color: var(--color-text-muted);
	}

	.game-start-players {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		justify-content: center;
		margin-top: 0.15rem;
	}

	.player-chip {
		font-size: 0.6rem;
		font-weight: 600;
		padding: 0.1rem 0.45rem;
		border-radius: var(--radius-pill);
	}

	.player-chip.human {
		background: var(--color-accent);
		color: black;
	}

	.player-chip.ai {
		background: var(--color-text-muted);
		color: white;
	}
</style>
