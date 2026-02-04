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

	let stage = $state<'intro' | 'loading' | 'reveal'>('intro');
	let showBars = $state(false);
	let animationKey = $state(0);

	// Generate grayscale color from black to lightest gray
	function getGrayscaleColor(index: number, total: number): string {
		const colors = ['#000000', '#404040', '#808080', '#b0b0b0', '#d0d0d0', '#e8e8e8'];
		return colors[index % colors.length] || '#808080';
	}

	// Get initials from name
	function getInitials(name: string): string {
		const words = name.trim().split(/\s+/);
		if (words.length === 1) {
			return words[0].substring(0, 2).toUpperCase();
		}
		return (words[0][0] + words[words.length - 1][0]).toUpperCase();
	}

	function restartAnimation() {
		stage = 'intro';
		showBars = false;
		animationKey++;
	}

	$effect(() => {
		// Re-run animation when animationKey changes
		animationKey;

		// Stage 1: Show intro text
		const timer1 = setTimeout(() => {
			stage = 'loading';
		}, 1000);

		// Stage 2: Show loading dots
		const timer2 = setTimeout(() => {
			stage = 'reveal';
		}, 3500);

		// Stage 3: Grow bars
		const timer3 = setTimeout(() => {
			showBars = true;
		}, 4000);

		return () => {
			clearTimeout(timer1);
			clearTimeout(timer2);
			clearTimeout(timer3);
		};
	});

	const maxScore = Math.max(...rows.map((r) => r.score), 1);
</script>

<div class="message standings" onclick={restartAnimation} role="button" tabindex="0">
	{#if stage === 'intro'}
		<div class="intro-text">Let's see how everyone's doing...</div>
	{:else if stage === 'loading'}
		<div class="intro-text">Let's see how everyone's doing...</div>
		<div class="loading-dots">
			<span>•</span>
			<span>•</span>
			<span>•</span>
		</div>
	{:else if stage === 'reveal'}
		<div class="chart-container">
			{#each rows as row, i (row.name)}
				<div class="player-column">
					<div class="bar-wrapper">
						<div
							class="bar"
							class:zero={row.score === 0}
							class:show={showBars}
							style="--target-height: {row.score * 60}px; --color: {getGrayscaleColor(i, rows.length)}"
						>
							<div class="medals-stack">
								{#each Array(row.score) as _, idx}
									<span class="medal-icon">🏅</span>
								{/each}
							</div>
						</div>
					</div>
					<div class="avatar" style="background-color: {getGrayscaleColor(i, rows.length)}">
						{getInitials(row.name)}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 1.5rem 0.75rem;
		align-items: center;
	}

	.standings {
		width: 100%;
		cursor: pointer;
		user-select: none;
	}

	.standings:hover {
		opacity: 0.95;
	}

	.intro-text {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: center;
		animation: fadeIn 0.5s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.loading-dots {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		justify-content: center;
	}

	.loading-dots span {
		font-size: 2rem;
		animation: bounce 1s ease-in-out infinite;
	}

	.loading-dots span:nth-child(1) {
		animation-delay: 0s;
	}

	.loading-dots span:nth-child(2) {
		animation-delay: 0.15s;
	}

	.loading-dots span:nth-child(3) {
		animation-delay: 0.3s;
	}

	@keyframes bounce {
		0%,
		60%,
		100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-10px);
		}
	}

	.chart-container {
		display: flex;
		gap: 2rem;
		justify-content: center;
		align-items: flex-end;
		padding: 2rem 1rem;
		padding-bottom: 3rem;
		animation: fadeIn 0.6s ease-out;
	}

	.player-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
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
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		animation: fadeIn 0.6s ease-out;
	}

	.bar-wrapper {
		height: auto;
		min-height: 100px;
		display: flex;
		align-items: flex-end;
		position: relative;
	}

	.bar {
		width: 60px;
		background: var(--color);
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		height: 0;
		transition: height 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 0.5rem 0.25rem;
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
	}

	.bar.show {
		height: var(--target-height);
	}

	.bar.zero {
		animation: struggle 2s ease-in-out;
	}

	@keyframes struggle {
		0% {
			height: 0;
		}
		20% {
			height: 40px;
		}
		30% {
			height: 20px;
		}
		45% {
			height: 50px;
		}
		55% {
			height: 30px;
		}
		70% {
			height: 35px;
		}
		85% {
			height: 15px;
		}
		100% {
			height: 0;
		}
	}

	.medals-stack {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: center;
	}

	.medal-icon {
		font-size: 2.5rem;
		line-height: 1;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
	}
</style>
