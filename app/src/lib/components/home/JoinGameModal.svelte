<script lang="ts">
	import LoadingBars from '$lib/components/game/LoadingBars.svelte';

	type Props = {
		onClose?: () => void;
		onJoin?: (gameId: string) => void;
	};

	let { onClose, onJoin }: Props = $props();

	let rawGameId = $state('');
	let showError = $state(false);
	let isJoinGamePending = $state(false);

	function extractGameIdFromString(str: string) {
		const gameIdRegex = /(?:\?|&)game_id=([^&]+)/;
		const uuidRegex =
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

		const gameIdMatch = str.match(gameIdRegex);

		if (gameIdMatch) {
			return gameIdMatch[1];
		} else if (uuidRegex.test(str)) {
			return str;
		} else {
			return null;
		}
	}

	const gameId = $derived.by(() => {
		const extractedGameId = extractGameIdFromString(rawGameId);
		return extractedGameId ?? '';
	});

	async function joinGame() {
		if (isJoinGamePending) return;

		if (!gameId) {
			showError = true;
			return;
		}

		isJoinGamePending = true;
		try {
			onJoin?.(gameId);
		} finally {
			isJoinGamePending = false;
		}
	}

	function closeModal() {
		onClose?.();
	}
</script>

<div
	class="modal-overlay"
	role="button"
	tabindex="0"
	aria-label="Close join game modal"
	onpointerdown={closeModal}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			closeModal();
		}
	}}
>
	<div
		class="modal"
		role="dialog"
		aria-modal="true"
		aria-label="Join game"
		tabindex="-1"
		onpointerdown={(event) => event.stopPropagation()}
	>
		<div class="join-game-container">
			<p>Enter Game ID</p>
			<input
				type="text"
				bind:value={rawGameId}
				placeholder="45210b0a-12cc-4be9-9bd3-69896b58dfad"
				oninput={() => {
					showError = false;
				}}
			/>
			<span class="subtext">This is a UUID that the game creator should share with you</span>

			{#if isJoinGamePending}
				<LoadingBars />
			{:else}
				<button
					onclick={joinGame}
					onkeydown={(event) => {
						if (event.key === 'Enter') joinGame();
					}}
				>
					Join Game
				</button>
			{/if}
		</div>
		{#if showError}
			<section>
				<p class="error">Invalid Game ID. Please try again.</p>
			</section>
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
		background: rgba(255, 255, 255, 0.88);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		max-width: 460px;
		width: 90%;
	}

	.join-game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem;
		border: 2.5px solid #000000;
		background: #ffffff;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg), var(--glow-accent-soft);
		position: relative;
	}

	.join-game-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 2rem;
		right: 2rem;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
		border-radius: 1px;
		box-shadow: var(--glow-accent-soft);
	}

	.join-game-container p {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: 1.75rem;
	}

	input {
		font-size: 0.85rem;
		font-family: var(--font-mono);
		padding: 0.875rem 1rem;
		border: 2px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		outline: none;
		width: 100%;
		transition:
			border-color 200ms var(--ease),
			box-shadow 200ms var(--ease);
		margin-bottom: 1rem;
		background: #fafafa;
	}

	input:focus {
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-soft);
		background: #ffffff;
	}

	button {
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.75rem 2.5rem;
		border: 2.5px solid var(--color-border);
		background: #000000;
		color: #ffffff;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		transition: all 220ms var(--ease);
	}

	button:hover {
		background: #ffffff;
		color: #000000;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	button:active {
		transform: scale(0.97);
		box-shadow: var(--glow-accent-strong);
	}

	.error {
		color: var(--color-accent);
		letter-spacing: 0.04em;
		font-size: 0.875rem;
	}

	section {
		margin-top: 1.25rem;
		height: 3rem;
		background: var(--color-text);
		padding: 2rem;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(230, 200, 50, 0.3);
	}

	.subtext {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin-bottom: 1.25rem;
		letter-spacing: 0.02em;
		font-family: var(--font-mono);
	}

	::-webkit-input-placeholder {
		color: var(--color-border-light);
	}

	:-moz-placeholder {
		color: var(--color-border-light);
	}

	::-moz-placeholder {
		color: var(--color-border-light);
	}

	:-ms-input-placeholder {
		color: var(--color-border-light);
	}
</style>
