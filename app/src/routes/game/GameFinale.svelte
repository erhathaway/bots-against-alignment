<script lang="ts">
	import { goto } from '$app/navigation';
	import { globalState } from '$lib/state/store.svelte';

	type BotStanding = { name: string; points: number };
	let standings = $state<BotStanding[]>([]);
	let winner = $derived(standings.length > 0 ? standings[0] : null);

	async function fetchStandings() {
		const gameId = globalState.game_id;
		if (!gameId) return;
		try {
			const response = await fetch(`/api/game/${gameId}/status`);
			const data = await response.json();
			if (response.ok && data.bots) {
				const bots = (data.bots as BotStanding[]).sort((a, b) => b.points - a.points);
				standings = bots;
			}
		} catch (error) {
			console.error('Failed to fetch standings:', error);
		}
	}

	let playAgainLoading = $state(false);

	async function playAgain() {
		const gameId = globalState.game_id;
		if (!gameId || playAgainLoading) return;
		playAgainLoading = true;
		try {
			const response = await fetch(`/api/game/${gameId}/play-again`, { method: 'POST' });
			const data = await response.json();
			if (response.ok && data.gameId) {
				goto(`/game?game_id=${data.gameId}`);
			} else {
				goto('/game');
			}
		} catch {
			goto('/game');
		}
	}

	function endGame() {
		goto('/');
	}

	$effect(() => {
		fetchStandings();
	});
</script>

<div class="game-finale">
	{#if winner}
		<h1>{winner.name} wins!</h1>
	{:else}
		<h1>Game Over</h1>
	{/if}

	{#if standings.length > 0}
		<div class="standings">
			<h2>Final Scores</h2>
			{#each standings as bot, i}
				<div class="standing-row" class:first-place={i === 0}>
					<span class="rank">{i + 1}.</span>
					<span class="name">{bot.name}</span>
					<span class="score">{bot.points} pts</span>
				</div>
			{/each}
		</div>
	{/if}

	<div class="button-container">
		<button onclick={playAgain}>Play Again</button>
		<button onclick={endGame}>End</button>
	</div>
</div>

<style>
	.game-finale {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		height: 100%;
		padding: 2rem;
	}
	h1 {
		font-size: 3rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}
	h2 {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 1rem;
		text-align: center;
	}
	.standings {
		width: 100%;
		max-width: 400px;
		margin-bottom: 2rem;
	}
	.standing-row {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
		background: #f5f5f5;
		gap: 0.5rem;
	}
	.standing-row.first-place {
		background: rgb(240, 255, 220);
		border: 2px solid rgb(123, 255, 0);
		font-weight: bold;
	}
	.rank {
		width: 2rem;
		color: #666;
	}
	.name {
		flex: 1;
	}
	.score {
		font-weight: bold;
	}
	.button-container {
		display: flex;
		justify-content: center;
		gap: 1rem;
		width: 100%;
		margin-top: auto;
		padding: 1rem;
	}
	button {
		flex-grow: 1;
		max-width: 200px;
		padding: 10px 20px;
		font-size: 1.5rem;
		cursor: pointer;
		border: 1px solid black;
		background-color: black;
		border-radius: 2rem;
		color: white;
	}
	button:hover {
		background-color: rgb(123, 255, 0);
		color: black;
	}
</style>
