<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import LoadingSpinner from '$lib/components/game/LoadingSpinner.svelte';
	import LoadingBars from '$lib/components/game/LoadingBars.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	import { goto } from '$app/navigation';

	type Props = {
		gameId: string;
		creatorId: string | null;
		onClose?: () => void;
	};

	let { gameId, creatorId, onClose }: Props = $props();

	let botName = $state('');
	let botPrompt = $state('');

	let errorMessages = $state({
		botName: '',
		botPrompt: ''
	});

	const isFormValid = $derived(botName.trim() !== '' && botPrompt.trim() !== '');

	function setOutlineColor(id: string, color: string) {
		const el = document.getElementById(id);
		if (el instanceof HTMLElement) {
			el.style.outlineColor = color;
		}
	}

	$effect(() => {
		if (!browser) return;
		if (botName !== '') {
			setOutlineColor('bot-name-input', 'rgba(230, 200, 50, 0.2)');
			errorMessages.botName = '';
		}
		if (botPrompt !== '') {
			setOutlineColor('bot-prompt-input', 'rgba(230, 200, 50, 0.2)');
			errorMessages.botPrompt = '';
		}
	});

	function validateInputs() {
		if (!browser) return false;
		let isValid = true;

		if (botName.trim() === '') {
			errorMessages.botName = 'Missing';
			setOutlineColor('bot-name-input', '#e6c832');
			isValid = false;
		} else {
			errorMessages.botName = '';
			setOutlineColor('bot-name-input', 'rgba(230, 200, 50, 0.2)');
		}

		if (botPrompt.trim() === '') {
			errorMessages.botPrompt = 'Missing';
			setOutlineColor('bot-prompt-input', '#e6c832');
			isValid = false;
		} else {
			errorMessages.botPrompt = '';
			setOutlineColor('bot-prompt-input', 'rgba(230, 200, 50, 0.2)');
		}

		if (!isValid) {
			addNotification({
				source_url: 'bot-setup',
				title: 'Missing fields',
				body: 'Fill in the missing data to continue',
				kind: NotificationKind.WARN,
				action_url: null,
				action_text: 'join_game'
			});
		}

		return isValid;
	}

	let randomizeBotNameLoading = $state(false);
	async function randomizeBotName() {
		if (randomizeBotNameLoading) return;
		randomizeBotNameLoading = true;
		try {
			const url = `/api/game/${gameId}/random/bot-name`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.ok) {
				const payload = await response.json();
				botName = payload.botName;
			} else if (response.status !== 429) {
				const error = await response.json();
				addNotification({
					source_url: 'bot-setup',
					title: 'Error generating bot name',
					body: error,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'randomize_bot_name'
				});
			}
		} finally {
			randomizeBotNameLoading = false;
		}
	}

	let randomizeBotPromptLoading = $state(false);
	async function randomizeBotPrompt() {
		if (randomizeBotPromptLoading) return;
		randomizeBotPromptLoading = true;
		try {
			const url = `/api/game/${gameId}/random/bot-prompt`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.ok) {
				const payload = await response.json();
				botPrompt = payload.botPrompt;
			} else if (response.status !== 429) {
				const error = await response.json();
				addNotification({
					source_url: 'bot-setup',
					title: 'Error generating bot prompt',
					body: error,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'randomize_bot_prompt'
				});
			}
		} finally {
			randomizeBotPromptLoading = false;
		}
	}

	let joinLoading = $state(false);
	async function handleJoin() {
		if (joinLoading) return;
		joinLoading = true;
		try {
			if (!validateInputs()) return;

			const response = await fetch(`/api/game/${gameId}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					botName,
					botPrompt,
					creatorId
				})
			});

			if (response.ok) {
				const payload = await response.json();
				globalState.game_id = gameId;
				globalState.current_bot_prompt = botPrompt;
				globalState.bot_name = botName;
				globalState.user_id = payload.playerId;
				if (payload.creatorId) {
					globalState.creator_id = payload.creatorId;
				}
				globalState.has_player_joined = true;
				goto(`/game?game_id=${gameId}`);
			} else {
				const error = await response.json();
				addNotification({
					source_url: 'bot-setup',
					title: 'Error joining game',
					body: error.message || error.error || 'Failed to join game',
					kind: NotificationKind.ERROR,
					action_url: `/api/game/${gameId}/join`,
					action_text: 'join_game'
				});
			}
		} finally {
			joinLoading = false;
		}
	}

	onMount(() => {
		if (import.meta.env.PUBLIC_E2E === '1' || import.meta.env.PUBLIC_E2E === 'true') return;
		randomizeBotName();
		randomizeBotPrompt();
	});
</script>

<div
	class="modal-overlay"
	role="button"
	tabindex="0"
	aria-label="Close bot setup"
	onpointerdown={onClose}
	onkeydown={(event) => {
		if (event.key === 'Escape') onClose?.();
	}}
>
	<div
		class="modal"
		role="dialog"
		aria-modal="true"
		aria-label="Bot setup"
		tabindex="-1"
		onpointerdown={(event) => event.stopPropagation()}
	>
		<div class="panels">
			<section class="panel">
				<div class="panel-header">
					<span class="panel-number">01</span>
					<h2>Bot Name</h2>
				</div>
				<div class="input-wrapper">
					<button type="button" class="embeded-button" onclick={randomizeBotName}>
						{#if randomizeBotNameLoading}
							<LoadingSpinner />
						{:else}
							<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
								><path
									d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
								/></svg
							>
						{/if}
					</button>
					<input
						id="bot-name-input"
						type="text"
						maxlength="30"
						bind:value={botName}
						aria-label="Bot Name"
					/>
				</div>
			</section>

			<section class="panel">
				<div class="panel-header">
					<span class="panel-number">02</span>
					<h2>Bot Prompt</h2>
				</div>
				<p class="panel-desc">
					This guides your bot's response. You can change it during the game (limited by game
					settings).
				</p>
				<div class="input-wrapper">
					<button type="button" class="embeded-button" onclick={randomizeBotPrompt}>
						{#if randomizeBotPromptLoading}
							<LoadingSpinner />
						{:else}
							<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
								><path
									d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
								/></svg
							>
						{/if}
					</button>
					<textarea id="bot-prompt-input" bind:value={botPrompt} aria-label="Bot Prompt"></textarea>
				</div>
			</section>
		</div>

		<div class="action-container">
			{#if joinLoading}
				<LoadingBars />
			{:else}
				<button class="enter-button" onclick={handleJoin} disabled={!isFormValid}>Enter</button>
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
		z-index: 1000;
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

	.modal {
		max-width: 540px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
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

	/* ── Panel container ── */
	.panels {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	/* ── Individual panel ── */
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 2rem;
		position: relative;
	}

	/* ── Panel header ── */
	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.panel-number {
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--color-accent);
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.5);
		opacity: 0.9;
	}

	.panel-header h2 {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #ffffff;
		font-family: var(--font-mono);
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.2);
	}

	.panel-desc {
		font-size: 0.95rem;
		font-family: var(--font-mono);
		color: rgba(255, 255, 255, 0.5);
		line-height: 1.5;
		margin: -0.25rem 0 0.25rem;
	}

	/* ── Input fields ── */
	.panel textarea,
	.panel input {
		font-size: 1.1rem;
		font-family: var(--font-mono);
		padding: 1.25rem 3.5rem 1.25rem 1.5rem;
		border: 2px solid rgba(230, 200, 50, 0.2);
		border-radius: var(--radius-sm);
		outline: none;
		width: 100%;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		color: #ffffff;
		transition:
			border-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			background 200ms var(--ease);
	}

	.panel textarea:focus,
	.panel input:focus {
		border-color: var(--color-accent);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.3),
			inset 0 0 20px rgba(230, 200, 50, 0.05);
		background: rgba(0, 0, 0, 0.8);
	}

	.panel textarea {
		min-height: 10rem;
		resize: vertical;
	}

	/* ── Input wrapper ── */
	.input-wrapper {
		position: relative;
		width: 100%;
	}

	/* ── Randomize button (embedded) ── */
	.embeded-button {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1.5px solid rgba(230, 200, 50, 0.3);
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		padding: 0;
		margin: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
		fill: rgba(230, 200, 50, 0.6);
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.1);
		transition:
			opacity 200ms var(--ease),
			border-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			fill 200ms var(--ease);
	}

	.embeded-button svg {
		width: 18px;
		height: 18px;
	}

	.embeded-button:hover {
		opacity: 1;
		border-color: var(--color-accent);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.4),
			inset 0 0 20px rgba(230, 200, 50, 0.1);
		fill: var(--color-accent);
	}

	/* ── Action container ── */
	.action-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem 0 0;
	}

	/* ── Enter button ── */
	.enter-button {
		font-weight: 600;
		font-size: 1.25rem;
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

	.enter-button::before {
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

	.enter-button:hover {
		background: var(--color-accent);
		color: #000000;
		border-color: var(--color-accent);
		box-shadow:
			0 0 30px rgba(230, 200, 50, 0.5),
			0 0 60px rgba(230, 200, 50, 0.3);
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}

	.enter-button:hover::before {
		box-shadow:
			0 0 15px rgba(0, 0, 0, 0.8),
			0 0 30px rgba(0, 0, 0, 0.4);
		background: #000000;
	}

	.enter-button:active {
		transform: scale(0.97);
		box-shadow:
			0 0 40px rgba(230, 200, 50, 0.6),
			0 0 80px rgba(230, 200, 50, 0.4);
	}

	.enter-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		border-color: rgba(230, 200, 50, 0.2);
		color: rgba(230, 200, 50, 0.3);
		box-shadow: none;
	}

	.enter-button:disabled::before {
		opacity: 0.3;
		box-shadow:
			0 0 5px rgba(230, 200, 50, 0.2),
			0 0 10px rgba(230, 200, 50, 0.1);
	}

	.enter-button:disabled:hover {
		background: rgba(0, 0, 0, 0.9);
		color: rgba(230, 200, 50, 0.3);
		border-color: rgba(230, 200, 50, 0.2);
		box-shadow: none;
		text-shadow: none;
		transform: none;
	}

	.enter-button:disabled:hover::before {
		background: var(--color-accent);
		box-shadow:
			0 0 5px rgba(230, 200, 50, 0.2),
			0 0 10px rgba(230, 200, 50, 0.1);
	}

	/* ── Scrollbar styling ── */
	.modal::-webkit-scrollbar {
		width: 8px;
	}

	.modal::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	.modal::-webkit-scrollbar-thumb {
		background: rgba(230, 200, 50, 0.3);
		border-radius: 4px;
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.2);
	}

	.modal::-webkit-scrollbar-thumb:hover {
		background: rgba(230, 200, 50, 0.5);
		box-shadow: 0 0 15px rgba(230, 200, 50, 0.4);
	}
</style>
