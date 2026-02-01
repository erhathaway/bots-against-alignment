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
		margin: 0.6rem;
		flex-direction: column;
	}

	.standings {
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.standings-container {
		display: flex;
		flex-direction: column;
		width: 90%;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
	}

	.standings-row {
		display: flex;
		align-items: center;
		padding: 0.3rem 0.6rem;
		font-size: 12px;
		border-bottom: 1px solid #eee;
		gap: 0.4rem;
	}

	.standings-row:last-child {
		border-bottom: none;
	}

	.standings-row.leader {
		background: #fff8e1;
		font-weight: bold;
	}

	.standings-rank {
		width: 1.2rem;
		color: #999;
		font-weight: bold;
		text-align: center;
	}

	.standings-name {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.standings-ai {
		font-size: 8px;
		font-weight: bold;
		background: rgb(100, 149, 237);
		color: white;
		padding: 0.05rem 0.3rem;
		border-radius: 0.5rem;
	}

	.standings-score {
		font-weight: bold;
		color: #333;
	}
</style>
