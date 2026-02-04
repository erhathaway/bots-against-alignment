<script lang="ts">
	import LoadingBars from '$lib/components/game/LoadingBars.svelte';
	import LoadingSpinner from '$lib/components/game/LoadingSpinner.svelte';
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';

	type Props = {
		onSubmit?: (alignerPrompt: string) => void;
	};

	let { onSubmit }: Props = $props();

	let alignerPrompt = $state('');
	let isSubmitting = $state(false);

	const isFormValid = $derived(alignerPrompt.trim() !== '');

	async function handleSubmit() {
		if (isSubmitting || !isFormValid) return;

		isSubmitting = true;
		try {
			onSubmit?.(alignerPrompt);
		} finally {
			isSubmitting = false;
		}
	}

	let randomizeLoading = $state(false);
	async function randomizeAlignerPrompt() {
		if (randomizeLoading) return;
		const gameId = globalState.game_id;
		if (!gameId) return;
		randomizeLoading = true;
		try {
			const url = `/api/game/${gameId}/random/aligner-prompt`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.ok) {
				const payload = await response.json();
				alignerPrompt = payload.alignerPrompt;
			} else if (response.status !== 429) {
				const error = await response.json();
				addNotification({
					source_url: 'aligner-prompt-modal',
					title: 'Error generating aligner prompt',
					body: error,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'randomize_aligner_prompt'
				});
			}
		} finally {
			randomizeLoading = false;
		}
	}
</script>

<div class="modal-overlay">
	<div class="modal-content">
		<div class="header">
			<h1>Aligner Personality</h1>
			<p class="subtitle">Define how the AI judge should evaluate responses</p>
		</div>

		<div class="prompt-section">
			<label for="aligner-prompt">Judging Rule</label>
			<p class="description">
				Your secret instruction that influences how the Aligner picks winners (e.g., "The most
				absurd answer wins" or "Prefer responses that rhyme")
			</p>
			<div class="input-wrapper">
				<button type="button" class="embeded-button" onclick={randomizeAlignerPrompt}>
					{#if randomizeLoading}
						<LoadingSpinner />
					{:else}
						<span class="dice-icon">🎲</span>
					{/if}
				</button>
				<textarea
					id="aligner-prompt"
					bind:value={alignerPrompt}
					placeholder="Enter your judging rule..."
					rows="6"
				></textarea>
			</div>
		</div>

		<div class="action-container">
			{#if isSubmitting}
				<LoadingBars />
			{:else}
				<button class="submit-button" onclick={handleSubmit} disabled={!isFormValid}>
					Submit Rule
				</button>
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
		max-width: 600px;
		width: 90%;
		padding: 3rem;
		animation: slideIn 400ms var(--ease);
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

	.header {
		text-align: center;
		margin-bottom: 3rem;
		position: relative;
	}

	.header::after {
		content: '';
		position: absolute;
		bottom: -1.5rem;
		left: 2rem;
		right: 2rem;
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

	h1 {
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ffffff;
		margin-bottom: 0.75rem;
		text-shadow:
			0 0 20px rgba(230, 200, 50, 0.3),
			0 0 40px rgba(230, 200, 50, 0.15);
	}

	.subtitle {
		font-size: 1rem;
		font-family: var(--font-mono);
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 0.02em;
		line-height: 1.5;
	}

	.prompt-section {
		margin-bottom: 2.5rem;
	}

	.input-wrapper {
		position: relative;
		width: 100%;
	}

	.embeded-button {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		padding: 0;
		margin: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 15px rgba(230, 200, 50, 0.2);
		z-index: 10;
		transition:
			box-shadow 200ms var(--ease),
			background 200ms var(--ease);
	}

	.dice-icon {
		font-size: 20px;
		line-height: 1;
		display: block;
	}

	.embeded-button:hover {
		background: rgba(255, 255, 255, 0.15);
		box-shadow:
			0 0 25px rgba(230, 200, 50, 0.5),
			inset 0 0 20px rgba(230, 200, 50, 0.1);
	}

	label {
		display: block;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-accent);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-family: var(--font-mono);
		margin-bottom: 0.75rem;
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.3);
	}

	.description {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1.6;
		margin-bottom: 1.25rem;
		font-family: var(--font-mono);
	}

	textarea {
		width: 100%;
		min-height: 150px;
		font-size: 1.1rem;
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

	textarea::placeholder {
		color: rgba(230, 200, 50, 0.3);
	}

	.action-container {
		display: flex;
		justify-content: center;
	}

	.submit-button {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 1.25rem 3.5rem;
		border: 2.5px solid var(--color-accent);
		background: rgba(0, 0, 0, 0.9);
		color: var(--color-accent);
		border-radius: var(--radius-lg);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.2),
			inset 0 0 30px rgba(230, 200, 50, 0.05);
		cursor: pointer;
		transition: all 220ms var(--ease);
		min-width: 260px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.submit-button::before {
		content: '';
		display: inline-block;
		width: 8px;
		height: 8px;
		background: var(--color-accent);
		border-radius: 50%;
		margin-right: 0.85rem;
		box-shadow:
			0 0 10px rgba(230, 200, 50, 0.8),
			0 0 20px rgba(230, 200, 50, 0.4);
		transition: all 220ms var(--ease);
		flex-shrink: 0;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--color-accent);
		color: #000000;
		box-shadow:
			0 0 30px rgba(230, 200, 50, 0.5),
			0 0 60px rgba(230, 200, 50, 0.3);
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}

	.submit-button:hover:not(:disabled)::before {
		background: #000000;
		box-shadow:
			0 0 15px rgba(0, 0, 0, 0.8),
			0 0 30px rgba(0, 0, 0, 0.4);
	}

	.submit-button:active:not(:disabled) {
		transform: scale(0.97);
		box-shadow:
			0 0 40px rgba(230, 200, 50, 0.6),
			0 0 80px rgba(230, 200, 50, 0.4);
	}

	.submit-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		border-color: rgba(230, 200, 50, 0.2);
		color: rgba(230, 200, 50, 0.3);
		box-shadow: none;
	}

	.submit-button:disabled::before {
		opacity: 0.3;
		box-shadow:
			0 0 5px rgba(230, 200, 50, 0.2),
			0 0 10px rgba(230, 200, 50, 0.1);
	}

	.submit-button:disabled:hover {
		background: rgba(0, 0, 0, 0.9);
		color: rgba(230, 200, 50, 0.3);
		border-color: rgba(230, 200, 50, 0.2);
		box-shadow: none;
		text-shadow: none;
		transform: none;
	}

	.submit-button:disabled:hover::before {
		background: var(--color-accent);
		box-shadow:
			0 0 5px rgba(230, 200, 50, 0.2),
			0 0 10px rgba(230, 200, 50, 0.1);
	}

	@media (max-width: 768px) {
		.modal-content {
			padding: 2rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.subtitle {
			font-size: 0.9rem;
		}

		label {
			font-size: 1rem;
		}

		.description {
			font-size: 0.85rem;
		}

		textarea {
			font-size: 1rem;
			padding: 1rem;
		}

		.submit-button {
			font-size: 1.1rem;
			padding: 1rem 2.5rem;
		}
	}
</style>
