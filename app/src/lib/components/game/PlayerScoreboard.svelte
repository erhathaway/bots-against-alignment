<script lang="ts">
	import { globalState } from '$lib/state/store.svelte';
	import { untrack } from 'svelte';

	type Player = {
		id: string;
		name: string;
		points: number;
		turnComplete: boolean;
		isHost: boolean;
		isAuto: boolean;
	};

	let players = $state<Player[]>([]);
	let pointsToWin = $state(5);

	// Generate a consistent color based on player name
	function getPlayerColor(name: string): string {
		const colors = [
			'#e6c832', // yellow
			'#6366f1', // indigo
			'#ec4899', // pink
			'#10b981', // green
			'#f59e0b', // amber
			'#8b5cf6', // purple
			'#ef4444', // red
			'#06b6d4' // cyan
		];
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return colors[Math.abs(hash) % colors.length];
	}

	// Get initials from name
	function getInitials(name: string): string {
		const words = name.trim().split(/\s+/);
		if (words.length === 1) {
			return words[0].substring(0, 2).toUpperCase();
		}
		return (words[0][0] + words[words.length - 1][0]).toUpperCase();
	}

	async function fetchPlayers() {
		const gameId = globalState.game_id;
		if (!gameId) return;

		try {
			const response = await fetch(`/api/game/${gameId}/status`);
			if (!response.ok) return;
			const data = await response.json();
			if (data.bots) {
				players = data.bots;
				pointsToWin = data.pointsToWin || 5;
			}
		} catch {
			// silently ignore polling errors
		}
	}

	$effect(() => {
		const gameId = globalState.game_id;
		if (!gameId) return;

		// Reset on game change
		players = [];

		untrack(() => fetchPlayers());
		const intervalId = setInterval(fetchPlayers, 2000);
		return () => clearInterval(intervalId);
	});
</script>

{#if players.length > 0}
	<div class="scoreboard">
		<div class="players">
			{#each players as player (player.id)}
				{@const isCurrentPlayer = player.name === globalState.bot_name}
				<div class="player" class:current={isCurrentPlayer}>
					<div class="avatar" style="background-color: {getPlayerColor(player.name)}">
						{getInitials(player.name)}
					</div>
					<div class="info">
						<div class="name">
							{player.name}
							{#if player.isAuto}
								<span class="badge ai">AI</span>
							{/if}
							{#if player.isHost}
								<span class="badge host">HOST</span>
							{/if}
						</div>
						<div class="points">
							{player.points}/{pointsToWin}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.scoreboard {
		position: fixed;
		top: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 4rem);
		max-width: 900px;
		display: flex;
		justify-content: center;
		z-index: 100;
		pointer-events: none;
	}

	.players {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
	}

	.player {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-lg);
		transition: all 220ms var(--ease);
		background: #ffffff;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.12),
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(230, 200, 50, 0.4),
			0 0 20px rgba(230, 200, 50, 0.15);
		pointer-events: auto;
		position: relative;
	}

	/* Subtle yellow signal trace at bottom edge */
	.player::before {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 15%;
		right: 15%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(230, 200, 50, 0.4) 20%,
			rgba(230, 200, 50, 0.6) 50%,
			rgba(230, 200, 50, 0.4) 80%,
			transparent 100%
		);
		pointer-events: none;
		border-radius: var(--radius-lg);
	}

	.player.current {
		border-color: rgba(230, 200, 50, 0.6);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.12),
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1.5px rgba(230, 200, 50, 0.6),
			0 0 24px rgba(230, 200, 50, 0.25);
	}

	.player.current::before {
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(230, 200, 50, 0.5) 20%,
			rgba(230, 200, 50, 0.8) 50%,
			rgba(230, 200, 50, 0.5) 80%,
			transparent 100%
		);
	}

	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 700;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.9);
		box-shadow: var(--shadow-sm);
		flex-shrink: 0;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		line-height: 1.2;
	}

	.badge {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
	}

	.badge.host {
		background: var(--color-accent);
		color: var(--color-accent-text);
	}

	.badge.ai {
		background: #111111;
		color: #ffffff;
		border: 1px solid #000000;
	}

	.points {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}

	@media (max-width: 768px) {
		.scoreboard {
			width: calc(100% - 2rem);
			padding: 0.75rem 1rem;
		}

		.players {
			gap: 1rem;
		}

		.player {
			padding: 0.375rem 0.625rem;
			gap: 0.5rem;
		}

		.avatar {
			width: 2rem;
			height: 2rem;
			font-size: 0.75rem;
		}

		.name {
			font-size: 0.8rem;
		}

		.points {
			font-size: 0.7rem;
		}
	}
</style>
