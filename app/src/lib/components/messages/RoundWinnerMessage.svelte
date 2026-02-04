<script lang="ts">
	import AnnouncementTitle from './AnnouncementTitle.svelte';

	type Props = {
		name: string;
		score: number;
	};

	let { name, score }: Props = $props();

	const subtitle = `${name} • ${score} point${score === 1 ? '' : 's'}`;
</script>

<div class="round-winner-container">
	<AnnouncementTitle title="Round Winner!" {subtitle} />
	<div class="winner-badge">
		<span class="medal">🏅</span>
		<span class="winner-text">{name}</span>
		<span class="points-earned">+1 point</span>
	</div>
</div>

<style>
	.round-winner-container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.winner-badge {
		display: flex;
		gap: 1rem;
		align-items: center;
		background: #ffffff;
		border: 3px solid rgba(0, 0, 0, 0.5);
		border-radius: 999px;
		padding: 1.25rem 2.5rem;
		box-shadow:
			0 12px 32px rgba(0, 0, 0, 0.2),
			0 6px 12px rgba(0, 0, 0, 0.15);
		animation: floatAndRotate 3s ease-in-out infinite;
	}

	@keyframes floatAndRotate {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		25% {
			transform: translateY(-10px) rotate(3deg);
		}
		50% {
			transform: translateY(0) rotate(0deg);
		}
		75% {
			transform: translateY(-10px) rotate(-3deg);
		}
	}

	.medal {
		font-size: 3rem;
		line-height: 1;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.winner-text {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: 0.02em;
	}

	.points-earned {
		font-size: 1.5rem;
		font-weight: 700;
		color: #10b981;
		letter-spacing: 0.02em;
	}
</style>
