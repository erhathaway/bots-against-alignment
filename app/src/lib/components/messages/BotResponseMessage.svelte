<script lang="ts">
	import { getNameColor } from './utils';

	type Props = {
		name: string;
		text: string;
		prompt: string;
		mine?: boolean;
	};

	let { name, text, prompt, mine = false }: Props = $props();

	// Parse prompt to find underlines and split into parts
	const promptParts = $derived(() => {
		const parts = prompt.split(/_{3,}/); // Split by 3 or more underscores
		const blanks = prompt.match(/_{3,}/g) || []; // Find all underline sequences
		return { parts, blanks };
	});

	const responses = $derived([text]);
</script>

<div class="message bot-response" class:mine class:theirs={!mine}>
	<div class="bot-response-card">
		<div class="card-text-flow">
			<p class="response-text">
				<!-- Debug: prompt = "{prompt}" -->
				{#if prompt && prompt.trim()}
					{#each promptParts().parts as part, i}
						{part}{#if i < promptParts().blanks.length}<span class="response-inline"
								>{responses[i] ||
									'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}</span
							>{/if}
					{/each}
					{#if promptParts().blanks.length === 0}
						<br /><span class="response-inline">{text}</span>
					{/if}
				{:else}
					[No prompt available]<br />
					<span class="response-inline">{text}</span>
				{/if}
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

	.bot-response {
		justify-content: center;
		align-items: center;
	}

	.bot-response.mine {
		align-items: flex-start;
	}

	.bot-response.theirs {
		align-items: flex-end;
	}

	.bot-response-card {
		background: #ffffff;
		border-radius: 12px;
		padding: 2rem 1.25rem;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(0, 0, 0, 0.06),
			0 16px 48px rgba(0, 0, 0, 0.04),
			0 24px 64px rgba(0, 0, 0, 0.03);
		position: relative;
		width: 100%;
		max-width: 320px;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		border: 1px solid rgba(0, 0, 0, 0.13);
	}

	.bot-response-card::after {
		content: 'BOT RESPONSE';
		position: absolute;
		bottom: 0.75rem;
		left: 0.75rem;
		font-size: 0.55rem;
		font-weight: 700;
		color: rgba(0, 0, 0, 0.3);
		letter-spacing: 0.1em;
		font-family: var(--font-sans);
	}

	.card-text-flow {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		padding-bottom: 1.5rem;
	}

	.response-text {
		font-size: 1rem;
		line-height: 1.5;
		color: rgba(0, 0, 0, 0.25);
		font-family: var(--font-sans);
		text-align: left;
		margin: 0;
		font-weight: 700;
		position: relative;
		z-index: 1;
	}

	.response-inline {
		color: #000000;
		text-decoration: underline;
		text-decoration-color: #000000;
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
	}

	@media (max-width: 768px) {
		.bot-response-card {
			max-width: 280px;
			padding: 1.25rem 1rem;
		}

		.response-text {
			font-size: 0.9rem;
		}

		.bot-response-card::after {
			font-size: 0.5rem;
		}
	}
</style>
