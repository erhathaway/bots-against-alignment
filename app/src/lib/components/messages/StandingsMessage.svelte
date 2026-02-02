<script lang="ts">
	type StandingsRow = {
		name: string;
		score: number;
		isAuto: boolean;
	};

	type Props = {
		rows: StandingsRow[];
	};

	let { rows }: Props = $props();
</script>

<div class="message standings">
	<div class="standings-container">
		{#each rows as row, i (row.name)}
			<div class="standings-row" class:leader={i === 0}>
				<span class="standings-rank">{i + 1}</span>
				<span class="standings-name"
					>{row.name}{#if row.isAuto}<span class="standings-ai">AI</span>{/if}</span
				>
				<span class="standings-score">{row.score}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.5rem 0.75rem;
	}

	.standings {
		justify-content: center;
		align-items: center;
	}

	.standings-container {
		display: flex;
		flex-direction: column;
		width: 90%;
		border: 1.5px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.standings-row {
		display: flex;
		align-items: center;
		padding: 0.3rem 0.75rem;
		font-size: 0.7rem;
		border-bottom: 1px solid var(--color-border-light);
		gap: 0.4rem;
	}

	.standings-row:last-child {
		border-bottom: none;
	}

	.standings-row.leader {
		background: var(--color-accent-light);
		font-weight: 600;
	}

	.standings-rank {
		width: 1.2rem;
		color: var(--color-text-muted);
		font-weight: 600;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.standings-name {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.standings-ai {
		font-size: 0.5rem;
		font-weight: 700;
		background: var(--color-text-muted);
		color: white;
		padding: 0.05rem 0.3rem;
		border-radius: var(--radius-pill);
		text-transform: uppercase;
	}

	.standings-score {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
