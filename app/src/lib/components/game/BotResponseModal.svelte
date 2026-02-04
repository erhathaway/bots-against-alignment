<script lang="ts">
	import LoadingBars from './LoadingBars.svelte';
	import { addNotification } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';

	type Props = {
		turnPrompt: string;
		initialBotPrompt: string;
		promptsRemaining: number;
		gameId: string;
		playerId: string;
		turnId: number;
		onSubmitted?: () => void;
	};

	let {
		turnPrompt,
		initialBotPrompt,
		promptsRemaining,
		gameId,
		playerId,
		turnId,
		onSubmitted
	}: Props = $props();

	let botPrompt = $state('');

	$effect(() => {
		botPrompt = initialBotPrompt;
	});
	let botResponse = $state<string | null>(null);
	let isGenerating = $state(false);
	let isSubmitting = $state(false);
	let showResponse = $state(true);

	// Parse prompt to find underlines and split into parts
	const promptParts = $derived(() => {
		const parts = turnPrompt.split(/_{3,}/); // Split by 3 or more underscores
		const blanks = turnPrompt.match(/_{3,}/g) || []; // Find all underline sequences
		return { parts, blanks };
	});

	const responses = $derived(botResponse ? [botResponse] : []);

	const hasChangedPrompt = $derived(botPrompt.trim() !== initialBotPrompt.trim());
	const canGenerate = $derived(!isGenerating && !botResponse);
	const canRegenerate = $derived(!isGenerating && botResponse && hasChangedPrompt);
	const canSubmit = $derived(!isSubmitting && botResponse !== null);
	const promptLocked = $derived(promptsRemaining <= 0);

	function hideResponse() {
		showResponse = false;
	}

	async function generateResponse() {
		if (isGenerating || promptLocked) return;

		console.log('Generating bot response...');
		isGenerating = true;
		botResponse = null;
		showResponse = true;

		try {
			console.log('Calling generate API...');
			const response = await fetch(`/api/game/${gameId}/turn/${turnId}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId, botPrompt })
			});

			console.log('Generate API response:', response.status);

			if (response.ok) {
				const data = await response.json();
				console.log('Bot response:', data.response);
				botResponse = data.response;
			} else {
				const data = await response.json();
				console.error('Generate error:', data);
				addNotification({
					source_url: 'bot-response',
					title: 'Error generating response',
					body: data.message || data.error || 'Failed to generate response',
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'generate_response'
				});
			}
		} catch (error) {
			console.error('Generate exception:', error);
			addNotification({
				source_url: 'bot-response',
				title: 'Error generating response',
				body: 'Network error',
				kind: NotificationKind.ERROR,
				action_url: null,
				action_text: 'generate_response'
			});
		} finally {
			isGenerating = false;
			console.log('Generation complete');
		}
	}

	async function submitResponse() {
		if (!canSubmit) return;

		isSubmitting = true;
		try {
			const response = await fetch(`/api/game/${gameId}/turn/${turnId}/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					playerId,
					suggestion: botPrompt,
					responseText: botResponse
				})
			});

			if (response.ok) {
				onSubmitted?.();
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'bot-response',
					title: 'Error submitting response',
					body: data.message || data.error || 'Failed to submit response',
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'submit_response'
				});
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="modal-overlay">
	<div class="modal-content">
		<!-- Turn Prompt Section -->
		<div class="section">
			<div class="turn-prompt-display">
				<div class="card-text-flow">
					<p class="prompt-text">
						{#each promptParts().parts as part, i}
							{part}{#if i < promptParts().blanks.length}<span class="response-inline"
									>{responses[i] ||
										'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}</span
								>{/if}
						{/each}
					</p>
				</div>
			</div>
		</div>

		<!-- Bot Prompt Section -->
		<div class="section bot-prompt-section">
			<div class="section-header bot-header">
				<h2>Bot Personality</h2>
				{#if promptLocked}
					<span class="locked-badge">LOCKED</span>
				{:else}
					<span class="prompts-remaining">{promptsRemaining} changes left</span>
				{/if}
			</div>
			<div class="textarea-container">
				<textarea
					bind:value={botPrompt}
					disabled={promptLocked || (botResponse !== null && showResponse)}
					placeholder="Enter your bot's instruction..."
					rows="4"
				></textarea>
				{#if !botResponse || !showResponse}
					{#if isGenerating}
						<div class="inline-loading">
							<LoadingBars />
						</div>
					{:else}
						<button
							class="respond-button"
							onclick={generateResponse}
							disabled={isGenerating || promptLocked}
						>
							<span class="button-icon">▶</span>
							Respond
						</button>
					{/if}
				{/if}

				<!-- Bot Response Card Overlay -->
				{#if botResponse && showResponse}
					<button class="bot-response-card" onclick={hideResponse}>
						<p>{botResponse}</p>
					</button>
				{/if}
			</div>
			{#if hasChangedPrompt && !promptLocked && (!botResponse || !showResponse)}
				<p class="change-warning">
					Changing this will use 1 of your {promptsRemaining} remaining prompt changes
				</p>
			{/if}
		</div>

		<!-- Action Buttons -->
		{#if botResponse}
			<div class="action-container">
				<div class="button-group">
					{#if !showResponse && canRegenerate && !promptLocked}
						{#if isGenerating}
							<LoadingBars />
						{:else}
							<button class="secondary-button" onclick={generateResponse}>
								<span class="button-icon">↻</span>
								Regenerate
							</button>
						{/if}
					{/if}
					{#if isSubmitting}
						<LoadingBars />
					{:else}
						<button class="primary-button" onclick={submitResponse} disabled={!canSubmit}>
							<span class="button-icon">✓</span>
							Submit
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background:
			radial-gradient(
				ellipse at center,
				rgba(0, 0, 0, 0.95) 0%,
				rgba(0, 0, 0, 0.85) 60%,
				rgba(230, 200, 50, 0.15) 100%
			),
			#000000;
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		animation: fadeIn 300ms var(--ease);
		box-shadow: inset 0 0 200px rgba(230, 200, 50, 0.1);
		overflow-y: auto;
		padding: 2rem;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		max-width: 700px;
		width: 100%;
		padding: 3rem;
		animation: slideIn 400ms var(--ease);
		margin: auto;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.section {
		margin-bottom: 2.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.25rem;
		position: relative;
	}

	.section-header::after {
		content: '';
		position: absolute;
		bottom: -0.625rem;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-accent) 30%,
			var(--color-accent) 70%,
			transparent
		);
		border-radius: 1px;
		box-shadow:
			0 0 15px rgba(230, 200, 50, 0.5),
			0 0 30px rgba(230, 200, 50, 0.2);
	}

	.section-number {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-accent);
		text-shadow: 0 0 15px rgba(230, 200, 50, 0.5);
		min-width: 3rem;
	}

	.section-header h2 {
		font-size: 1.4rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #ffffff;
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.2);
		flex: 1;
	}

	.bot-header {
		margin-bottom: 0.75rem;
	}

	.bot-header::after {
		display: none;
	}

	.bot-header h2 {
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.5);
		text-shadow: none;
		letter-spacing: 0.05em;
	}

	.locked-badge {
		background: rgba(230, 200, 50, 0.2);
		color: var(--color-accent);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-pill);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border: 1px solid var(--color-accent);
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.2);
	}

	.prompts-remaining {
		font-size: 0.9rem;
		font-family: var(--font-mono);
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 0.04em;
	}

	.turn-prompt-display {
		background: #000000;
		border-radius: 12px;
		padding: 2.5rem 2rem;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.4),
			0 8px 24px rgba(0, 0, 0, 0.35),
			0 16px 48px rgba(0, 0, 0, 0.3),
			0 24px 64px rgba(0, 0, 0, 0.25);
		position: relative;
		width: 100%;
		max-width: 400px;
		aspect-ratio: 5 / 7;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: space-between;
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin: 0 auto;
	}

	.turn-prompt-display::after {
		content: 'ALIGNER HAS CHOSEN THIS CARD';
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		font-size: 0.7rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.3);
		letter-spacing: 0.1em;
		font-family: var(--font-sans);
	}

	.card-text-flow {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		padding-bottom: 2.5rem;
	}

	.prompt-text {
		font-size: 1.25rem;
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
		text-decoration-thickness: 3px;
		text-underline-offset: 4px;
	}

	.textarea-container {
		position: relative;
	}

	textarea {
		width: 100%;
		min-height: 120px;
		font-size: 1.05rem;
		font-family: var(--font-mono);
		padding: 1.25rem 1.5rem;
		padding-bottom: 4rem;
		border: 2px solid rgba(230, 200, 50, 0.2);
		border-radius: var(--radius-sm);
		outline: none;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		color: #ffffff;
		resize: vertical;
		transition:
			border-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			background 200ms var(--ease);
	}

	.respond-button {
		position: absolute;
		bottom: 0.75rem;
		right: 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.6rem 1.25rem;
		border: 2px solid rgba(230, 200, 50, 0.4);
		background: rgba(0, 0, 0, 0.9);
		color: rgba(230, 200, 50, 0.7);
		border-radius: var(--radius-sm);
		box-shadow:
			0 0 8px rgba(230, 200, 50, 0.1),
			inset 0 0 15px rgba(230, 200, 50, 0.02);
		cursor: pointer;
		transition: all 220ms var(--ease);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.respond-button:hover:not(:disabled) {
		background: var(--color-accent);
		color: #000000;
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.3),
			0 0 40px rgba(230, 200, 50, 0.2);
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}

	.respond-button:active:not(:disabled) {
		transform: scale(0.97);
	}

	.respond-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.respond-button .button-icon {
		font-size: 0.9rem;
	}

	.inline-loading {
		position: absolute;
		bottom: 0.75rem;
		right: 0.75rem;
	}

	.bot-response-card {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #ffffff;
		border-radius: 12px;
		padding: 2.5rem 2rem;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.4),
			0 8px 24px rgba(0, 0, 0, 0.35),
			0 16px 48px rgba(0, 0, 0, 0.3),
			0 24px 64px rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 200ms var(--ease);
		animation: cardFlipIn 400ms var(--ease);
		z-index: 10;
	}

	.bot-response-card:hover {
		transform: translateY(-4px);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.45),
			0 12px 32px rgba(0, 0, 0, 0.4),
			0 20px 56px rgba(0, 0, 0, 0.35),
			0 28px 72px rgba(0, 0, 0, 0.3);
	}

	.bot-response-card::after {
		content: 'BOT RESPONSE';
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		font-size: 0.7rem;
		font-weight: 700;
		color: rgba(0, 0, 0, 0.3);
		letter-spacing: 0.1em;
		font-family: var(--font-sans);
	}

	.bot-response-card p {
		font-size: 1.25rem;
		line-height: 1.5;
		color: #000000;
		font-family: var(--font-sans);
		text-align: left;
		margin: 0;
		font-weight: 700;
		position: relative;
		z-index: 1;
	}

	@keyframes cardFlipIn {
		from {
			opacity: 0;
			transform: rotateY(-90deg) scale(0.8);
		}
		to {
			opacity: 1;
			transform: rotateY(0) scale(1);
		}
	}

	textarea:focus {
		border-color: var(--color-accent);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.3),
			inset 0 0 20px rgba(230, 200, 50, 0.05);
		background: rgba(0, 0, 0, 0.8);
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	textarea::placeholder {
		color: rgba(230, 200, 50, 0.3);
	}

	.change-warning {
		font-size: 0.85rem;
		font-family: var(--font-mono);
		color: var(--color-accent);
		margin-top: 0.75rem;
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.3);
	}

	.action-container {
		display: flex;
		justify-content: center;
		margin-top: 3rem;
	}

	.button-group {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.primary-button,
	.secondary-button {
		font-size: 1.2rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 1.25rem 3rem;
		border: 2.5px solid var(--color-accent);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 220ms var(--ease);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 200px;
		justify-content: center;
	}

	.primary-button {
		background: rgba(0, 0, 0, 0.9);
		color: rgba(230, 200, 50, 0.7);
		border-color: rgba(230, 200, 50, 0.4);
		box-shadow:
			0 0 8px rgba(230, 200, 50, 0.1),
			inset 0 0 15px rgba(230, 200, 50, 0.02);
	}

	.secondary-button {
		background: rgba(0, 0, 0, 0.6);
		color: rgba(255, 255, 255, 0.8);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.primary-button:hover:not(:disabled) {
		background: var(--color-accent);
		color: #000000;
		box-shadow:
			0 0 30px rgba(230, 200, 50, 0.5),
			0 0 60px rgba(230, 200, 50, 0.3);
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}

	.secondary-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.6);
	}

	.primary-button:active:not(:disabled),
	.secondary-button:active:not(:disabled) {
		transform: scale(0.97);
	}

	.primary-button:disabled,
	.secondary-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.button-icon {
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.modal-overlay {
			padding: 1rem;
		}

		.modal-content {
			padding: 2rem 1.5rem;
		}

		.section-number {
			font-size: 1.2rem;
			min-width: 2.5rem;
		}

		.section-header h2 {
			font-size: 1.1rem;
		}

		.turn-prompt-display {
			padding: 2rem 1.5rem;
			max-width: 300px;
		}

		.card-text-flow {
			gap: 0.5rem;
			padding-bottom: 2rem;
		}

		.prompt-text {
			font-size: 1.1rem;
		}

		.turn-prompt-display p {
			font-size: 1.1rem;
		}

		textarea {
			font-size: 1rem;
			padding-bottom: 3.5rem;
		}

		.respond-button {
			font-size: 0.75rem;
			padding: 0.5rem 1rem;
		}

		.bot-response-card {
			padding: 2rem 1.5rem;
		}

		.bot-response-card p {
			font-size: 1.1rem;
		}

		.primary-button,
		.secondary-button {
			font-size: 1rem;
			padding: 1rem 2rem;
			min-width: 160px;
		}

		.button-group {
			flex-direction: column;
			width: 100%;
		}

		.primary-button,
		.secondary-button {
			width: 100%;
		}
	}
</style>
