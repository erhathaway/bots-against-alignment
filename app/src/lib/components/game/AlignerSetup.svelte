<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import LoadingBars from './LoadingBars.svelte';
	import LoadingCommas from './LoadingCommas.svelte';
	import { onMount } from 'svelte';

	let alignerPrompt = $state('');
	let submitted = $state(false);
	let submittedCount = $state(0);
	let totalPlayers = $state(0);
	let submitLoading = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

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
					source_url: 'aligner-setup',
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

	async function handleSubmit() {
		if (submitLoading || submitted) return;
		const gameId = globalState.game_id;
		const playerId = globalState.user_id;
		if (!gameId || !playerId) return;

		if (!alignerPrompt.trim()) {
			addNotification({
				source_url: 'aligner-setup',
				title: 'Missing aligner prompt',
				body: 'Enter your aligner instruction to continue',
				kind: NotificationKind.WARN,
				action_url: null,
				action_text: 'submit_aligner'
			});
			return;
		}

		submitLoading = true;
		try {
			const response = await fetch(`/api/game/${gameId}/aligner-prompt`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId, prompt: alignerPrompt })
			});

			if (response.ok) {
				const data = await response.json();
				submitted = true;
				globalState.has_submitted_aligner_prompt = true;
				globalState.aligner_prompt = alignerPrompt;
				submittedCount = data.submittedCount;
				totalPlayers = data.totalPlayers;

				if (data.allSubmitted) {
					globalState.is_game_started = true;
					globalState.is_collecting_aligner_prompts = false;
				}
			} else {
				const error = await response.json();
				addNotification({
					source_url: 'aligner-setup',
					title: 'Error submitting aligner prompt',
					body: error.message || error.error || 'Failed to submit',
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'submit_aligner'
				});
			}
		} finally {
			submitLoading = false;
		}
	}

	async function pollStatus() {
		const gameId = globalState.game_id;
		if (!gameId) return;
		try {
			const response = await fetch(`/api/game/${gameId}/status`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.ok) {
				const data = await response.json();
				if (data.status === 'STARTED' || data.status === 'ENDED') {
					globalState.is_game_started = true;
					globalState.is_collecting_aligner_prompts = false;
					if (pollInterval) clearInterval(pollInterval);
				}
				if (data.alignerPromptsSubmitted != null) {
					submittedCount = data.alignerPromptsSubmitted;
				}
				if (data.bots) {
					totalPlayers = data.bots.length;
				}
			}
		} catch {
			// ignore polling errors
		}
	}

	$effect(() => {
		pollInterval = setInterval(pollStatus, 3000);
		pollStatus();
		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	});

	onMount(() => {
		if (import.meta.env.PUBLIC_E2E === '1' || import.meta.env.PUBLIC_E2E === 'true') return;
		randomizeAlignerPrompt();
	});
</script>

<div class="aligner-setup">
	{#if submitted}
		<div class="waiting-panel">
			<div class="panel-header">
				<span class="panel-number">01</span>
				<h2>Aligner Instruction</h2>
			</div>
			<p class="status-text">Instruction submitted</p>
			<p class="waiting-text">
				Waiting for other players<LoadingCommas />
			</p>
			{#if totalPlayers > 0}
				<p class="progress-text">{submittedCount} / {totalPlayers} submitted</p>
			{/if}
		</div>
	{:else}
		<section class="panel">
			<div class="panel-header">
				<span class="panel-number">01</span>
				<h2>Aligner Instruction</h2>
			</div>
			<p class="panel-desc">
				Your secret instruction to the aligner. It will be combined with other players' instructions
				to judge each round.
			</p>
			<div class="input-wrapper">
				<button type="button" class="embeded-button" onclick={randomizeAlignerPrompt}>
					{#if randomizeLoading}
						<LoadingSpinner />
					{:else}
						<span class="dice-icon">🎲</span>
					{/if}
				</button>
				<textarea id="aligner-input" bind:value={alignerPrompt} aria-label="Aligner Prompt"
				></textarea>
			</div>

			<div class="action-container">
				{#if submitLoading}
					<LoadingBars />
				{:else}
					<button class="submit-button" onclick={handleSubmit}>Submit</button>
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
	.aligner-setup {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
	}

	/* ── Individual panel ── */
	.panel,
	.waiting-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 2rem;
		border: 2.5px solid #000000;
		border-radius: var(--radius-lg);
		background: #ffffff;
		box-shadow: var(--shadow-md), var(--glow-accent-soft);
		position: relative;
		max-width: 540px;
		width: 100%;
	}

	.panel::before,
	.waiting-panel::before {
		content: '';
		position: absolute;
		top: 0;
		left: 1.5rem;
		right: 1.5rem;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
		border-radius: 1px;
		box-shadow: var(--glow-accent-soft);
	}

	/* ── Panel header ── */
	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.panel-number {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--color-accent);
		opacity: 0.8;
	}

	.panel-header h2 {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--color-text);
		font-family: var(--font-mono);
	}

	.panel-desc {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: -0.25rem 0 0.25rem;
	}

	/* ── Input fields ── */
	.panel textarea {
		font-size: 0.875rem;
		font-family: var(--font-mono);
		padding: 0.875rem 3rem 0.875rem 1rem;
		border: 2px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		outline: none;
		width: 100%;
		background: #fafafa;
		min-height: 8rem;
		resize: vertical;
		transition:
			border-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			background 200ms var(--ease);
	}

	.panel textarea:focus {
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-soft);
		background: #ffffff;
	}

	/* ── Input wrapper ── */
	.input-wrapper {
		position: relative;
		width: 100%;
	}

	/* ── Randomize button (embedded) ── */
	.embeded-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		background: #ffffff;
		padding: 0;
		margin: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.5;
		box-shadow: none;
		z-index: 10;
		transition:
			opacity 200ms var(--ease),
			box-shadow 200ms var(--ease);
	}

	.embeded-button svg {
		width: 14px;
		height: 14px;
		color: var(--color-text);
		transition: color 200ms var(--ease);
	}

	.dice-icon {
		font-size: 18px;
		line-height: 1;
		display: block;
	}

	.embeded-button:hover {
		opacity: 1;
		box-shadow: var(--glow-accent-soft);
	}

	.embeded-button:hover svg {
		color: var(--color-accent);
	}

	/* ── Action container ── */
	.action-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0 0;
	}

	/* ── Submit button ── */
	.submit-button {
		font-weight: 600;
		font-size: 1rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.75rem 2.5rem;
		border: 2.5px solid #000000;
		background: #000000;
		color: #ffffff;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		transition: all 220ms var(--ease);
		min-width: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.submit-button::before {
		content: '';
		display: inline-block;
		width: 6px;
		height: 6px;
		background: var(--color-accent);
		border-radius: 50%;
		margin-right: 0.75rem;
		box-shadow: 0 0 6px rgba(230, 200, 50, 0.6);
		transition: all 220ms var(--ease);
		flex-shrink: 0;
	}

	.submit-button:hover {
		background: #ffffff;
		color: #000000;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.submit-button:hover::before {
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.8);
		background: #f0d840;
	}

	.submit-button:active {
		transform: scale(0.97);
		box-shadow: var(--glow-accent-strong);
	}

	/* ── Waiting state ── */
	.status-text {
		font-size: 0.85rem;
		font-family: var(--font-mono);
		color: var(--color-accent-text);
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.waiting-text {
		font-size: 1rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	.progress-text {
		font-size: 0.8rem;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		text-align: center;
		letter-spacing: 0.04em;
	}
</style>
