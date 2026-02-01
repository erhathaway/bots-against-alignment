<script lang="ts">
	import { goto } from '$app/navigation';
	import { globalState } from '$lib/state/store.svelte';
	import confetti from 'canvas-confetti';

	type BotStanding = { name: string; points: number };
	let standings = $state<BotStanding[]>([]);
	let winner = $derived(standings.length > 0 ? standings[0] : null);
	let isCurrentUserWinner = $derived(winner !== null && winner.name === globalState.bot_name);
	let showFlash = $state(false);

	function fireGameWinConfetti() {
		const duration = 6000;
		const end = Date.now() + duration;

		// Initial big burst
		confetti({
			particleCount: 200,
			spread: 120,
			origin: { y: 0.4 },
			colors: ['#7bff00', '#ff00ff', '#00ffff', '#ffd700', '#ff4500']
		});

		// Continuous side cannons
		const frame = () => {
			confetti({
				particleCount: 4,
				angle: 60,
				spread: 55,
				origin: { x: 0, y: 0.6 },
				colors: ['#7bff00', '#ff00ff', '#00ffff', '#ffd700']
			});
			confetti({
				particleCount: 4,
				angle: 120,
				spread: 55,
				origin: { x: 1, y: 0.6 },
				colors: ['#7bff00', '#ff00ff', '#00ffff', '#ffd700']
			});

			if (Date.now() < end) {
				requestAnimationFrame(frame);
			}
		};
		requestAnimationFrame(frame);

		// Staggered bursts
		setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } }), 1000);
		setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.3 } }), 2000);
		setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 } }), 3500);
	}

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

	$effect(() => {
		if (isCurrentUserWinner) {
			showFlash = true;
			fireGameWinConfetti();
			setTimeout(() => {
				showFlash = false;
			}, 800);
		}
	});
</script>

<div class="game-finale" class:winner-glow={isCurrentUserWinner}>
	{#if showFlash}
		<div class="flash-overlay"></div>
	{/if}

	{#if winner}
		{#if isCurrentUserWinner}
			<h1 class="winner-title">YOU WON!</h1>
			<p class="winner-subtitle">{winner.name} dominated the alignment</p>
		{:else}
			<h1>{winner.name} wins!</h1>
		{/if}
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
		position: relative;
	}
	.winner-glow {
		animation: glow-bg 2s ease-in-out infinite alternate;
	}
	.flash-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: white;
		z-index: 100;
		animation: flash 0.8s ease-out forwards;
		pointer-events: none;
	}
	h1 {
		font-size: 3rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}
	.winner-title {
		font-size: 4rem;
		font-weight: 900;
		color: rgb(123, 255, 0);
		text-shadow:
			0 0 20px rgba(123, 255, 0, 0.6),
			0 0 40px rgba(123, 255, 0, 0.3);
		animation: winner-pulse 0.6s ease-in-out infinite alternate;
	}
	.winner-subtitle {
		font-size: 1.2rem;
		color: #666;
		margin-bottom: 1.5rem;
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
	@keyframes winner-pulse {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.08);
		}
	}
	@keyframes glow-bg {
		from {
			background: rgba(123, 255, 0, 0);
		}
		to {
			background: rgba(123, 255, 0, 0.05);
		}
	}
	@keyframes flash {
		0% {
			opacity: 0.8;
		}
		100% {
			opacity: 0;
		}
	}
</style>
