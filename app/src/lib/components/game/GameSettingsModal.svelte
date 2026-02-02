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
	<div class="modal-header">
		<h2>Game Settings</h2>
		<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
	</div>

	{#if loading}
		<div class="modal-body loading">Loading settings...</div>
	{:else}
		<div class="modal-body">
			<div class="setting-row">
				<label for="points-to-win">Points to win</label>
				<div class="setting-description">First player to reach this score wins the game</div>
				{#if isCreator}
					<input
						id="points-to-win"
						type="number"
						min="1"
						max="20"
						bind:value={pointsToWin}
					/>
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
		background: rgba(0, 0, 0, 0.85);
		z-index: 200;
		backdrop-filter: blur(4px);
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: calc(100% - 4rem);
		max-width: 500px;
		background: #ffffff;
		border: 2px solid #000000;
		border-radius: var(--radius-lg);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(230, 200, 50, 0.4),
			0 0 40px rgba(230, 200, 50, 0.2);
		z-index: 201;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 1rem;
		border-bottom: 2px solid #000000;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--color-text);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-muted);
		transition: color 220ms var(--ease);
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		color: var(--color-text);
	}

	.modal-body {
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		flex: 1;
	}

	.modal-body.loading {
		text-align: center;
		color: var(--color-text-muted);
	}

	.setting-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-row label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.setting-description {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
		margin-bottom: 0.5rem;
	}

	.setting-row input[type='number'] {
		width: 100%;
		font-size: 1.25rem;
		font-weight: 600;
		padding: 0.75rem 1rem;
		border: 2px solid #000000;
		border-radius: var(--radius-md);
		outline: none;
		transition: all 220ms var(--ease);
		text-align: center;
	}

	.setting-row input[type='number']:focus {
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.setting-value {
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
		padding: 1rem;
		color: var(--color-text);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid var(--color-border-light);
	}

	.btn-primary,
	.btn-secondary {
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 220ms var(--ease);
		text-transform: uppercase;
	}

	.btn-primary {
		background: #000000;
		color: #ffffff;
		border: 2px solid #000000;
	}

	.btn-primary:hover:not(:disabled) {
		background: #ffffff;
		color: #000000;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #ffffff;
		color: var(--color-text);
		border: 2px solid #000000;
	}

	.btn-secondary:hover {
		background: #000000;
		color: #ffffff;
	}
</style>
