<script lang="ts">
	import LoadingBars from '../../../routes/game/LoadingBars.svelte';

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
		background-color: rgb(0 255 51);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal {
		border-radius: 8px;
		max-width: 500px;
	}

	.join-game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		border: 2px solid black;
		background-color: white;
		border-radius: 0.7rem;
	}

	input {
		font-size: 1rem;
		padding: 0.5rem;
		margin-bottom: 1rem;
		width: 100%;
		max-width: 20rem;
		outline: 2px solid rgb(0, 0, 0);
		border: 1px solid black;
		border-radius: 0.5rem;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	button {
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		cursor: pointer;
		border: 3px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
	}

	.error {
		color: rgb(123, 255, 0);
	}

	section {
		margin-top: 1rem;
		height: 3rem;
		background-color: black;
		padding: 2rem;
		border-radius: 7px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.subtext {
		font-size: 0.8rem;
		color: grey;
		margin-bottom: 0.5rem;
	}

	::-webkit-input-placeholder {
		color: #edc5c5;
		opacity: 1 !important;
	}

	:-moz-placeholder {
		color: #edc5c5;
		opacity: 1 !important;
	}

	::-moz-placeholder {
		color: #edc5c5;
		opacity: 1 !important;
	}

	:-ms-input-placeholder {
		color: #edc5c5;
	}
</style>
