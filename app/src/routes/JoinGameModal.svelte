<script lang="ts">
	import { goto } from '$app/navigation';
	import LoadingBars from './game/LoadingBars.svelte';

	let { onClose }: { onClose?: () => void } = $props();

	let rawGameId = $state('');
	let gameId = $state('');
	let oldgameId = $state('');
	let showError = $state(false);

	$effect(() => {
		if (gameId !== oldgameId) {
			showError = false;
			oldgameId = gameId;
		}
	});

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

	$effect(() => {
		const extractedGameId = extractGameIdFromString(rawGameId);
		gameId = extractedGameId ?? '';
	});

	let isJoinGamePending = $state(false);

	async function joinGame() {
		if (isJoinGamePending) {
			return;
		}

		isJoinGamePending = true;
		try {
			const response = await fetch(`/api/game/${gameId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
			if (response.ok) {
				goto(`/game?game_id=${gameId}`);
			} else {
				showError = true;
			}
		} catch (error) {
			console.error('Error:', error);
			showError = true;
		} finally {
			isJoinGamePending = false;
		}
	}

	function closeModal() {
		if (typeof onClose === 'function') {
			onClose();
		}
	}
</script>

<div class="modal-overlay" onclick={closeModal}>
	<div class="modal" onclick={(event) => event.stopPropagation()}>
		<div class="join-game-container">
			<p>Enter Game ID</p>
			<input
				type="text"
				bind:value={rawGameId}
				placeholder="45210b0a-12cc-4be9-9bd3-69896b58dfad"
			/>
			<span class="subtext">This is a UUID that the game creator should share with you</span>

			{#if isJoinGamePending}
				<LoadingBars />
			{:else}
				<button
					role="button"
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

	h3 {
		padding-top: 2rem;
		margin-bottom: 1rem;
		padding-left: 5rem;
	}

	button {
		cursor: pointer;
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
		font-size: 1rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
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
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
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
		opacity: 1 !important; /* for older chrome versions. may no longer apply. */
	}

	:-moz-placeholder {
		/* Firefox 18- */
		color: #edc5c5;
		opacity: 1 !important;
	}

	::-moz-placeholder {
		/* Firefox 19+ */
		color: #edc5c5;
		opacity: 1 !important;
	}

	:-ms-input-placeholder {
		color: #edc5c5;
	}
</style>
