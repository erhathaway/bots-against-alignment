<script>
	import { createEventDispatcher } from 'svelte';

	import { goto } from '$app/navigation';

	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	let gameId = '';
	let showError = false;

	const dispatch = createEventDispatcher();

	async function joinGame() {
		try {
			const response = await fetch(`${BACKEND_API}/game/${gameId}`);

			if (response.ok) {
				goto('/game');
			} else {
				showError = true;
			}
		} catch (error) {
			console.error('Error:', error);
			showError = true;
		}
	}

	function closeModal() {
		dispatch('close');
	}
</script>

<div class="modal-overlay" on:click={closeModal}>
	<div class="modal" on:click={(e) => e.stopPropagation()}>
		<div class="join-game-container">
			<p>Enter Game ID</p>
			<input type="text" bind:value={gameId} placeholder="Game ID" />
			<button
				role="button"
				on:click={joinGame}
				on:keydown={(e) => {
					if (e.keyCode === 13) joinGame();
				}}>Join Game</button
			>
			{#if showError}
				<p class="error">Invalid Game ID. Please try again.</p>
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
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal {
		background-color: white;
		padding: 2rem;
		border-radius: 8px;
		max-width: 500px;
	}

	h3 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	button {
		cursor: pointer;
	}
	.join-game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	input {
		font-size: 1rem;
		padding: 0.5rem;
		margin-bottom: 1rem;
	}

	button {
		font-size: 1rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}

	.error {
		color: red;
	}
</style>
