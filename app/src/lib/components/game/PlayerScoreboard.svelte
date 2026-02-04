<script lang="ts">
	import { globalState } from '$lib/state/store.svelte';
	import { untrack } from 'svelte';

	type Props = {
		withGameOwnerNav?: boolean;
		pendingAiIds?: string[];
	};

	let { withGameOwnerNav = false, pendingAiIds = [] }: Props = $props();

	type Player = {
		id: string;
		name: string;
		points: number;
		turnComplete: boolean;
		promptsRemaining: number;
		isHost: boolean;
		isAuto: boolean;
		isRoundWinner?: boolean;
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

{#if players.length > 0 || pendingAiIds.length > 0}
	<div class="scoreboard" class:with-game-owner-nav={withGameOwnerNav}>
		<div class="players">
			{#each pendingAiIds as pendingId (pendingId)}
				<div class="player pending">
					<div class="avatar pending-avatar">
						<span class="loading-spinner">⟳</span>
					</div>
					<div class="info">
						<div class="name">
							<span class="loading-text">AI Joining</span>
						</div>
						<div class="points pending-text">Please wait...</div>
					</div>
				</div>
			{/each}
			{#each players as player (player.id)}
				{@const isCurrentPlayer = player.name === globalState.bot_name}
				<div class="player" class:current={isCurrentPlayer} class:submitted={player.turnComplete}>
					<div class="player-top">
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
						</div>
						{#if player.turnComplete}
							<div class="check">✓</div>
						{/if}
					</div>
					{#if player.points > 0}
						<div class="medals-pill">
							{#each Array(player.points) as _, i}
								<span class="medal">🏅</span>
							{/each}
						</div>
					{/if}
					{#if player.promptsRemaining > 0}
						<div class="robots-pill">
							{#each Array(player.promptsRemaining) as _, i}
								<span class="robot">🤖</span>
							{/each}
						</div>
					{/if}
					{#if player.isRoundWinner}
						<div class="winner-badge">
							<span class="trophy">🏆</span>
							<span class="winner-text">{player.name}</span>
							<span class="points-earned">+1</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.scoreboard {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 4rem);
		max-width: 900px;
		display: flex;
		justify-content: center;
		z-index: 140;
		pointer-events: none;
	}

	.scoreboard.with-game-owner-nav {
		top: 5rem;
	}

	.players {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
	}

	.player {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.25rem 1rem;
		padding-left: 3.25rem;
		border-radius: var(--radius-lg);
		transition: all 220ms var(--ease);
		background: radial-gradient(
			ellipse at center,
			rgba(255, 255, 255, 0.7) 0%,
			rgba(255, 255, 255, 0.4) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		backdrop-filter: blur(12px);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.15),
			0 4px 12px rgba(0, 0, 0, 0.12),
			0 2px 4px rgba(0, 0, 0, 0.08);
		pointer-events: auto;
		position: relative;
	}

	.player-top {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.avatar {
		position: absolute;
		left: -0.25rem;
		top: 50%;
		transform: translateY(-50%);
	}

	.medals-pill,
	.robots-pill {
		position: absolute;
		bottom: -1.25rem;
		display: flex;
		gap: 0.25rem;
		align-items: center;
		pointer-events: none;
		background: #ffffff;
		border-radius: 999px;
		padding: 0.25rem 0.5rem;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.12),
			0 2px 4px rgba(0, 0, 0, 0.08);
	}

	.medals-pill {
		left: 0.75rem;
	}

	.robots-pill {
		right: 0.75rem;
	}

	.player.current {
		box-shadow:
			0 12px 48px rgba(0, 0, 0, 0.2),
			0 6px 16px rgba(0, 0, 0, 0.15),
			0 2px 6px rgba(0, 0, 0, 0.1);
	}

	.player.submitted {
		opacity: 0.8;
		background: radial-gradient(
			ellipse at center,
			rgba(255, 255, 255, 0.6) 0%,
			rgba(255, 255, 255, 0.3) 50%,
			rgba(255, 255, 255, 0) 100%
		);
	}

	.player.submitted .avatar {
		opacity: 0.9;
	}

	.player.pending {
		opacity: 0.7;
		animation: pendingPulse 1.5s ease-in-out infinite;
	}

	@keyframes pendingPulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 0.8;
		}
	}

	.pending-avatar {
		background: rgba(230, 200, 50, 0.3) !important;
		border-color: rgba(230, 200, 50, 0.6) !important;
	}

	.loading-spinner {
		display: inline-block;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		opacity: 0.8;
	}

	.pending-text {
		font-style: italic;
		opacity: 0.6;
	}


	.check {
		font-size: 1.25rem;
		color: #10b981;
		font-weight: 700;
		margin-left: 0.25rem;
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
		align-items: center;
		flex: 1;
	}

	.medal {
		font-size: 1rem;
		line-height: 1;
	}

	.robot {
		font-size: 0.875rem;
		line-height: 1;
	}

	.winner-badge {
		position: absolute;
		bottom: -1.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		align-items: center;
		background: #ffffff;
		border: 2px solid rgba(0, 0, 0, 0.5);
		border-radius: 999px;
		padding: 0.5rem 1rem;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.15);
		animation: floatAndRotate 3s ease-in-out infinite;
		z-index: 10;
	}

	@keyframes floatAndRotate {
		0%,
		100% {
			transform: translateX(-50%) translateY(0) rotate(0deg);
		}
		25% {
			transform: translateX(-50%) translateY(-8px) rotate(2deg);
		}
		50% {
			transform: translateX(-50%) translateY(0) rotate(0deg);
		}
		75% {
			transform: translateX(-50%) translateY(-8px) rotate(-2deg);
		}
	}

	.trophy {
		font-size: 1.5rem;
		line-height: 1;
	}

	.winner-text {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: 0.02em;
	}

	.points-earned {
		font-size: 0.875rem;
		font-weight: 700;
		color: #10b981;
		letter-spacing: 0.02em;
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
	}
</style>
