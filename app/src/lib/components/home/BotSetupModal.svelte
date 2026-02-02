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

	function setOutlineColor(id: string, color: string) {
		const el = document.getElementById(id);
		if (el instanceof HTMLElement) {
			el.style.outlineColor = color;
		}
	}

	$effect(() => {
		if (!browser) return;
		if (botName !== '') {
			setOutlineColor('bot-name-input', 'black');
			errorMessages.botName = '';
		}
		if (botPrompt !== '') {
			setOutlineColor('bot-prompt-input', 'black');
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
			setOutlineColor('bot-name-input', 'black');
		}

		if (botPrompt.trim() === '') {
			errorMessages.botPrompt = 'Missing';
			setOutlineColor('bot-prompt-input', '#e6c832');
			isValid = false;
		} else {
			errorMessages.botPrompt = '';
			setOutlineColor('bot-prompt-input', 'black');
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
				<button class="enter-button" onclick={handleJoin}>Enter</button>
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
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(16px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		max-width: 540px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
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
		border: 2.5px solid #000000;
		border-radius: var(--radius-lg);
		background: #ffffff;
		box-shadow: var(--shadow-md), var(--glow-accent-soft);
		position: relative;
	}

	.panel::before {
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
	.panel textarea,
	.panel input {
		font-size: 0.875rem;
		font-family: var(--font-mono);
		padding: 0.875rem 3rem 0.875rem 1rem;
		border: 2px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		outline: none;
		width: 100%;
		background: #fafafa;
		transition:
			border-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			background 200ms var(--ease);
	}

	.panel textarea:focus,
	.panel input:focus {
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-soft);
		background: #ffffff;
	}

	.panel textarea {
		min-height: 8rem;
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
		top: 0.5rem;
		right: 0.5rem;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1.5px solid var(--color-border-light);
		background: #ffffff;
		padding: 0;
		margin: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.5;
		fill: var(--color-text);
		box-shadow: none;
		transition:
			opacity 200ms var(--ease),
			border-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			fill 200ms var(--ease);
	}

	.embeded-button svg {
		width: 14px;
		height: 14px;
	}

	.embeded-button:hover {
		opacity: 1;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-soft);
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
		font-size: 1rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 1rem 3rem;
		border: 2.5px solid #000000;
		background: #000000;
		color: #ffffff;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		transition: all 220ms var(--ease);
		min-width: 220px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.enter-button::before {
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

	.enter-button:hover {
		background: #ffffff;
		color: #000000;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.enter-button:hover::before {
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.8);
		background: #f0d840;
	}

	.enter-button:active {
		transform: scale(0.97);
		box-shadow: var(--glow-accent-strong);
	}
</style>
