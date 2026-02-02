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
			colors: ['#D4A843', '#000000', '#ffffff', '#8B7424', '#F5E6C8']
		});

		// Continuous side cannons
		const frame = () => {
			confetti({
				particleCount: 4,
				angle: 60,
				spread: 55,
				origin: { x: 0, y: 0.6 },
				colors: ['#D4A843', '#000000', '#ffffff', '#8B7424']
			});
			confetti({
				particleCount: 4,
				angle: 120,
				spread: 55,
				origin: { x: 1, y: 0.6 },
				colors: ['#D4A843', '#000000', '#ffffff', '#8B7424']
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
				goto(`/?join=${data.gameId}`);
			} else {
				goto('/');
			}
		} catch {
			goto('/');
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
			{#each standings as bot, i (bot.name)}
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
		min-height: 100%;
		padding: 3rem;
		position: relative;
	}

	.winner-glow {
		background: rgba(247, 240, 220, 0.3);
	}

	.flash-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: white;
		z-index: 100;
		animation: flash 0.6s ease-out forwards;
		pointer-events: none;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-align: center;
	}

	.winner-title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--color-accent);
		letter-spacing: 0.02em;
		animation: winner-pulse 2s ease infinite alternate;
	}

	.winner-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 1rem;
	}

	.standings {
		width: 100%;
		max-width: 360px;
		margin-bottom: 2rem;
	}

	.standing-row {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		margin-bottom: 0.35rem;
		background: var(--color-surface);
		gap: 0.75rem;
		font-size: 0.9rem;
	}

	.standing-row.first-place {
		background: var(--color-accent-light);
		border: 1.5px solid var(--color-accent);
		font-weight: 600;
	}

	.rank {
		width: 1.5rem;
		color: var(--color-text-muted);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.name {
		flex: 1;
	}

	.score {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.button-container {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		margin-top: auto;
		padding: 1rem;
	}

	button {
		font-weight: 600;
		font-size: 0.95rem;
		padding: 0.75rem 2rem;
		border: 2px solid var(--color-border);
		background: var(--color-text);
		color: white;
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-md);
		transition: all 180ms var(--ease);
		letter-spacing: 0.02em;
		cursor: pointer;
		flex-grow: 1;
		max-width: 180px;
	}

	button:hover {
		background: white;
		color: var(--color-text);
		border-color: var(--color-border);
	}

	button:active {
		transform: scale(0.97);
	}

	@keyframes winner-pulse {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.015);
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
