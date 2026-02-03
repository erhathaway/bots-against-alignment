<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';

	type Props = {
		onClose: () => void;
		isCreator?: boolean;
	};

	let { onClose, isCreator = false }: Props = $props();

	let pointsToWin = $state(5);
	let botPromptChanges = $state(2);
	let savingSettings = $state(false);
	let loading = $state(true);

	async function fetchSettings() {
		const gameId = globalState.game_id;
		if (!gameId) return;

		try {
			const response = await fetch(`/api/game/${gameId}/status`);
			if (response.ok) {
				const data = await response.json();
				if (data.pointsToWin != null) pointsToWin = data.pointsToWin;
				if (data.botPromptChanges != null) botPromptChanges = data.botPromptChanges;
			}
		} finally {
			loading = false;
		}
	}

	async function saveSettings() {
		const gameId = globalState.game_id;
		const creatorId = globalState.creator_id;
		if (!gameId || !creatorId || !isCreator) return;

		savingSettings = true;
		try {
			const response = await fetch(`/api/game/${gameId}/settings`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creatorId, pointsToWin, botPromptChanges })
			});
			if (response.ok) {
				onClose();
			} else {
				const data = await response.json();
				addNotification({
					source_url: 'game settings',
					title: 'Error saving settings',
					body: data.message || data,
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'save_settings'
				});
			}
		} finally {
			savingSettings = false;
		}
	}

	$effect(() => {
		fetchSettings();
	});
</script>

<div class="modal-backdrop" onclick={onClose}></div>
<div class="modal" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
	<button class="close-btn" onclick={onClose} aria-label="Close">
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M18 6L6 18M6 6L18 18"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>
	<div class="modal-header">
		<h2>Game Settings</h2>
	</div>

	{#if loading}
		<div class="modal-body loading">Loading settings...</div>
	{:else}
		<div class="modal-body">
			<div class="setting-row">
				<label for="points-to-win">Points to win</label>
				<div class="setting-description">First player to reach this score wins the game</div>
				{#if isCreator}
					<input id="points-to-win" type="number" min="1" max="20" bind:value={pointsToWin} />
				{:else}
					<div class="setting-value">{pointsToWin}</div>
				{/if}
			</div>

			<div class="setting-row">
				<label for="bot-prompt-changes">Prompt changes allowed</label>
				<div class="setting-description">
					Number of times players can modify their bot prompt per turn
				</div>
				{#if isCreator}
					<input
						id="bot-prompt-changes"
						type="number"
						min="0"
						max="10"
						bind:value={botPromptChanges}
					/>
				{:else}
					<div class="setting-value">{botPromptChanges}</div>
				{/if}
			</div>
		</div>

		<div class="modal-footer">
			{#if isCreator}
				<button class="btn-secondary" onclick={onClose}>Cancel</button>
				<button class="btn-primary" onclick={saveSettings} disabled={savingSettings}>
					{savingSettings ? 'Saving...' : 'Save Settings'}
				</button>
			{:else}
				<button class="btn-primary" onclick={onClose}>Close</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(
				ellipse at center,
				rgba(0, 0, 0, 0.95) 0%,
				rgba(0, 0, 0, 0.85) 60%,
				rgba(230, 200, 50, 0.15) 100%
			),
			#000000;
		backdrop-filter: blur(8px);
		z-index: 200;
		box-shadow: inset 0 0 200px rgba(230, 200, 50, 0.1);
		animation: fadeIn 300ms var(--ease);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: calc(100% - 4rem);
		max-width: 540px;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(20px);
		border: 2.5px solid rgba(230, 200, 50, 0.4);
		border-radius: var(--radius-lg);
		box-shadow:
			0 0 40px rgba(230, 200, 50, 0.2),
			0 0 80px rgba(230, 200, 50, 0.1),
			inset 0 0 60px rgba(230, 200, 50, 0.05);
		z-index: 201;
		display: flex;
		flex-direction: column;
		animation: slideIn 400ms var(--ease);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translate(-50%, -55%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.close-btn {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid var(--color-accent);
		background: rgba(0, 0, 0, 0.9);
		color: var(--color-accent);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 220ms var(--ease);
		box-shadow:
			0 0 15px rgba(230, 200, 50, 0.2),
			inset 0 0 20px rgba(230, 200, 50, 0.05);
		z-index: 202;
	}

	.close-btn svg {
		width: 20px;
		height: 20px;
	}

	.close-btn:hover {
		background: var(--color-accent);
		color: #000000;
		box-shadow:
			0 0 25px rgba(230, 200, 50, 0.4),
			0 0 50px rgba(230, 200, 50, 0.2);
		transform: rotate(90deg);
	}

	.close-btn:active {
		transform: scale(0.95) rotate(90deg);
	}

	.modal-header {
		padding: 2.5rem 2rem 1.5rem;
		text-align: center;
		position: relative;
	}

	.modal-header::after {
		content: '';
		position: absolute;
		bottom: 0;
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

	.modal-header h2 {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ffffff;
		text-shadow: 0 0 15px rgba(230, 200, 50, 0.3);
	}

	.modal-body {
		padding: 2.5rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		flex: 1;
	}

	.modal-body.loading {
		text-align: center;
		color: rgba(255, 255, 255, 0.5);
		font-family: var(--font-mono);
		font-size: 1.1rem;
	}

	.setting-row {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.setting-row label {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-accent);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-family: var(--font-mono);
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.3);
	}

	.setting-description {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1.5;
		margin-bottom: 0.5rem;
		font-family: var(--font-mono);
	}

	.setting-row input[type='number'] {
		width: 100%;
		font-size: 2rem;
		font-weight: 700;
		padding: 1rem 1.5rem;
		border: 2px solid rgba(230, 200, 50, 0.3);
		border-radius: var(--radius-md);
		outline: none;
		transition: all 220ms var(--ease);
		text-align: center;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		color: var(--color-accent);
		font-family: var(--font-mono);
	}

	.setting-row input[type='number']:focus {
		border-color: var(--color-accent);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.3),
			inset 0 0 20px rgba(230, 200, 50, 0.05);
		background: rgba(0, 0, 0, 0.8);
	}

	.setting-value {
		font-size: 2rem;
		font-weight: 700;
		text-align: center;
		padding: 1rem;
		color: var(--color-accent);
		font-family: var(--font-mono);
		text-shadow: 0 0 15px rgba(230, 200, 50, 0.4);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem 2rem 2rem;
		border-top: 1px solid rgba(230, 200, 50, 0.2);
	}

	.btn-primary,
	.btn-secondary {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		padding: 1rem 2rem;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 220ms var(--ease);
		text-transform: uppercase;
	}

	.btn-primary {
		background: rgba(0, 0, 0, 0.9);
		color: var(--color-accent);
		border: 2.5px solid var(--color-accent);
		box-shadow:
			0 0 15px rgba(230, 200, 50, 0.2),
			inset 0 0 25px rgba(230, 200, 50, 0.05);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-accent);
		color: #000000;
		box-shadow:
			0 0 25px rgba(230, 200, 50, 0.4),
			0 0 50px rgba(230, 200, 50, 0.2);
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}

	.btn-primary:active:not(:disabled) {
		transform: scale(0.97);
		box-shadow:
			0 0 35px rgba(230, 200, 50, 0.5),
			0 0 70px rgba(230, 200, 50, 0.3);
	}

	.btn-primary:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		border-color: rgba(230, 200, 50, 0.2);
		color: rgba(230, 200, 50, 0.3);
		box-shadow: none;
	}

	.btn-secondary {
		background: rgba(0, 0, 0, 0.6);
		color: rgba(255, 255, 255, 0.7);
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.5);
	}

	.btn-secondary:active {
		transform: scale(0.97);
	}

	@media (max-width: 768px) {
		.modal {
			width: calc(100% - 2rem);
			max-width: 100%;
		}

		.modal-header h2 {
			font-size: 1.3rem;
		}

		.setting-row label {
			font-size: 1rem;
		}

		.setting-description {
			font-size: 0.85rem;
		}

		.setting-row input[type='number'],
		.setting-value {
			font-size: 1.6rem;
		}

		.close-btn {
			width: 40px;
			height: 40px;
			top: 1rem;
			right: 1rem;
		}

		.close-btn svg {
			width: 18px;
			height: 18px;
		}
	}
</style>
