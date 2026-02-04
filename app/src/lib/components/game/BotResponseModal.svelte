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

	let botPrompt = $state(initialBotPrompt);
	let botResponse = $state<string | null>(null);
	let isGenerating = $state(false);
	let isSubmitting = $state(false);

	const hasChangedPrompt = $derived(botPrompt.trim() !== initialBotPrompt.trim());
	const canGenerate = $derived(!isGenerating && !botResponse);
	const canRegenerate = $derived(!isGenerating && botResponse && hasChangedPrompt);
	const canSubmit = $derived(!isSubmitting && botResponse !== null);
	const promptLocked = $derived(promptsRemaining <= 0);

	async function generateResponse() {
		if (!canGenerate && !canRegenerate) return;

		console.log('Generating bot response...');
		isGenerating = true;
		botResponse = null;

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
				body: JSON.stringify({ playerId, suggestion: botPrompt })
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
			<div class="section-header">
				<span class="section-number">01</span>
				<h2>Aligner Says</h2>
			</div>
			<div class="turn-prompt-display">
				<p>{turnPrompt}</p>
			</div>
		</div>

		<!-- Bot Prompt Section -->
		<div class="section">
			<div class="section-header">
				<span class="section-number">02</span>
				<h2>Bot Instruction</h2>
				{#if promptLocked}
					<span class="locked-badge">LOCKED</span>
				{:else}
					<span class="prompts-remaining">{promptsRemaining} changes left</span>
				{/if}
			</div>
			<textarea
				bind:value={botPrompt}
				disabled={promptLocked || botResponse !== null}
				placeholder="Enter your bot's instruction..."
				rows="4"
			></textarea>
			{#if hasChangedPrompt && !promptLocked}
				<p class="change-warning">
					Changing this will use 1 of your {promptsRemaining} remaining prompt changes
				</p>
			{/if}
		</div>

		<!-- Bot Response Section -->
		{#if botResponse}
			<div class="section response-section">
				<div class="section-header">
					<span class="section-number">03</span>
					<h2>Bot Response</h2>
				</div>
				<div class="bot-response-display">
					<p>{botResponse}</p>
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="action-container">
			{#if !botResponse}
				{#if isGenerating}
					<LoadingBars />
				{:else}
					<button class="primary-button" onclick={generateResponse} disabled={!canGenerate}>
						<span class="button-icon">▶</span>
						Respond
					</button>
				{/if}
			{:else}
				<div class="button-group">
					{#if canRegenerate && !promptLocked}
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
			{/if}
		</div>
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
		padding: 2rem;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		border: 2px solid rgba(230, 200, 50, 0.3);
		border-radius: var(--radius-md);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.15),
			inset 0 0 30px rgba(230, 200, 50, 0.05);
	}

	.turn-prompt-display p {
		font-size: 1.3rem;
		line-height: 1.6;
		color: #ffffff;
		font-family: var(--font-mono);
		text-align: center;
		margin: 0;
	}

	textarea {
		width: 100%;
		min-height: 120px;
		font-size: 1.05rem;
		font-family: var(--font-mono);
		padding: 1.25rem 1.5rem;
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

	.response-section {
		animation: responseAppear 400ms var(--ease);
	}

	@keyframes responseAppear {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.bot-response-display {
		padding: 2rem;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		border: 2px solid rgba(230, 200, 50, 0.4);
		border-radius: var(--radius-md);
		box-shadow:
			0 0 25px rgba(230, 200, 50, 0.2),
			inset 0 0 40px rgba(230, 200, 50, 0.08);
	}

	.bot-response-display p {
		font-size: 1.4rem;
		line-height: 1.5;
		color: var(--color-accent);
		font-family: var(--font-mono);
		text-align: center;
		margin: 0;
		text-shadow: 0 0 15px rgba(230, 200, 50, 0.3);
		font-weight: 600;
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
		color: var(--color-accent);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.2),
			inset 0 0 30px rgba(230, 200, 50, 0.05);
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

		.turn-prompt-display p {
			font-size: 1.1rem;
		}

		textarea {
			font-size: 1rem;
		}

		.bot-response-display p {
			font-size: 1.2rem;
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
