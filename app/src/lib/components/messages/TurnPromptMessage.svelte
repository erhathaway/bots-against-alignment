<script lang="ts">
	type Props = {
		prompt: string;
	};

	let { prompt }: Props = $props();

	// Parse prompt to find underlines and split into parts
	const promptParts = $derived(() => {
		const parts = prompt.split(/_{3,}/); // Split by 3 or more underscores
		const blanks = prompt.match(/_{3,}/g) || []; // Find all underline sequences
		return { parts, blanks };
	});
</script>

<div class="message turn-prompt">
	<div class="aligner-card">
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

	.aligner-card {
		background: #000000;
		border-radius: 12px;
		padding: 1.5rem 1.25rem;
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.3),
			0 8px 40px rgba(0, 0, 0, 0.25),
			0 16px 60px rgba(0, 0, 0, 0.2),
			0 24px 80px rgba(0, 0, 0, 0.15);
		position: relative;
		width: 100%;
		max-width: 320px;
		aspect-ratio: 5 / 7;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: space-between;
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin: 0 auto;
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
