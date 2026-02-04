<script lang="ts">
	type Props = {
		prompt: string;
		hasSubmitted?: boolean;
		isCurrentTurn?: boolean;
		onShowModal?: () => void;
	};

	let { prompt, hasSubmitted = false, isCurrentTurn = true, onShowModal }: Props = $props();

	let animationKey = $state(0);
	let isFlipped = $state(false);
	let timeRemaining = $state(30);
	let timerInterval: number | null = null;

	// Parse prompt to find underlines and split into parts
	const promptParts = $derived(() => {
		const parts = prompt.split(/_{3,}/); // Split by 3 or more underscores
		const blanks = prompt.match(/_{3,}/g) || []; // Find all underline sequences
		return { parts, blanks };
	});

	function handleClick() {
		if (isFlipped && isCurrentTurn && !hasSubmitted) {
			// Card is flipped and it's the current turn - trigger submission modal
			onShowModal?.();
		} else if (!isFlipped) {
			// Card is not flipped - restart animation
			isFlipped = false;
			animationKey++;
		}
	}

	$effect(() => {
		// Re-run animation when animationKey changes
		animationKey;

		// Reset timer
		timeRemaining = 30;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// Shake for 2 seconds, then pause, then flip
		const flipTimer = setTimeout(() => {
			isFlipped = true;
		}, 2500);

		return () => {
			clearTimeout(flipTimer);
			if (timerInterval) clearInterval(timerInterval);
		};
	});

	$effect(() => {
		// Start countdown when card flips, but only if it's current turn and user hasn't submitted
		const shouldShowTimer = isFlipped && isCurrentTurn && !hasSubmitted;

		if (shouldShowTimer && !timerInterval) {
			timerInterval = window.setInterval(() => {
				timeRemaining--;
				if (timeRemaining <= 0) {
					if (timerInterval) clearInterval(timerInterval);
					timerInterval = null;
					// Timer expired - trigger submission modal
					onShowModal?.();
				}
			}, 1000);
		} else if (!shouldShowTimer && timerInterval) {
			// Clear timer if conditions change
			clearInterval(timerInterval);
			timerInterval = null;
		}

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		};
	});
</script>

<div class="message turn-prompt">
	<div
		class="card-container"
		class:flipped={isFlipped}
		onclick={handleClick}
		role="button"
		tabindex="0"
	>
		<div class="card-flip">
			<div class="aligner-card card-front">
				<div class="title">
					<div>BOTS</div>
					<div>AGAINST</div>
					<div>ALIGNMENT</div>
				</div>
			</div>
			<div class="aligner-card card-back">
				{#if isFlipped && isCurrentTurn && !hasSubmitted}
					<div class="timer" class:warning={timeRemaining <= 10}>
						{timeRemaining}s
					</div>
				{/if}
				<div class="card-text-flow">
					<p class="prompt-text">
						{#each promptParts().parts as part, i}
							{part}{#if i < promptParts().blanks.length}<span class="response-inline"
									>{'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}</span
								>{/if}
						{/each}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 1rem 0.75rem;
	}

	.turn-prompt {
		justify-content: center;
		align-items: center;
	}

	.card-container {
		width: 100%;
		max-width: 320px;
		aspect-ratio: 5 / 7;
		perspective: 1500px;
		cursor: pointer;
		animation: rock 2s ease-in-out;
		margin: 0 auto;
	}

	@keyframes rock {
		0% {
			transform: rotate(0deg);
		}
		15% {
			transform: rotate(8deg);
		}
		35% {
			transform: rotate(-8deg);
		}
		55% {
			transform: rotate(6deg);
		}
		75% {
			transform: rotate(-6deg);
		}
		90% {
			transform: rotate(3deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}

	.card-flip {
		width: 100%;
		height: 100%;
		position: relative;
		transform-style: preserve-3d;
		transition: transform 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.card-container.flipped .card-flip {
		transform: rotateY(180deg);
	}

	.aligner-card {
		background: #000000;
		border-radius: 12px;
		padding: 1.5rem 1.25rem;
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.3),
			0 8px 40px rgba(0, 0, 0, 0.25),
			0 16px 60px rgba(0, 0, 0, 0.2),
			0 24px 80px rgba(0, 0, 0, 0.15);
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: space-between;
		border: 1px solid rgba(255, 255, 255, 0.1);
		backface-visibility: hidden;
	}

	.card-front {
		align-items: flex-start;
		justify-content: flex-start;
	}

	.card-back {
		transform: rotateY(180deg);
	}

	.title {
		font-size: 2.5rem;
		font-weight: 900;
		color: #ffffff;
		text-align: left;
		line-height: 0.9;
		letter-spacing: -0.03em;
		font-family: 'Helvetica Neue', Arial, sans-serif;
	}

	.timer {
		position: absolute;
		top: 1rem;
		right: 1rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.7);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid rgba(255, 255, 255, 0.2);
		font-family: 'Courier New', monospace;
		z-index: 10;
		transition: all 0.3s ease;
	}

	.timer.warning {
		color: #ff4444;
		background: rgba(255, 68, 68, 0.2);
		border-color: rgba(255, 68, 68, 0.4);
		animation: pulse 0.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.aligner-card::after {
		content: 'ALIGNER HAS CHOSEN THIS CARD';
		position: absolute;
		bottom: 0.75rem;
		left: 0.75rem;
		font-size: 0.55rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.3);
		letter-spacing: 0.1em;
		font-family: var(--font-sans);
	}

	.card-text-flow {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		padding-bottom: 2rem;
	}

	.prompt-text {
		font-size: 1rem;
		line-height: 1.5;
		color: #ffffff;
		font-family: var(--font-sans);
		text-align: left;
		margin: 0;
		font-weight: 700;
		position: relative;
		z-index: 1;
	}

	.response-inline {
		text-decoration: underline;
		text-decoration-color: #ffffff;
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
	}

	@media (max-width: 768px) {
		.aligner-card {
			max-width: 280px;
			padding: 1.25rem 1rem;
		}

		.prompt-text {
			font-size: 0.9rem;
		}

		.aligner-card::after {
			font-size: 0.5rem;
		}
	}
</style>
