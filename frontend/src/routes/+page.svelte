<script>
	import { onMount } from 'svelte';
	import JoinGameModal from './JoinGameModal.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores'; // Add this line

	let showModal = false;
	let modalTitle = '';

	let errorMessage = '';

	onMount(() => {
		// Check for an error message in the page state
		errorMessage = $page.state?.errorMessage || '';
	});

	function openModal(title) {
		modalTitle = title;
		showModal = true;
	}
	function navigateToGame() {
		goto('/game'); // Add this line
	}
</script>

<main>
	<h1>Bots Against Alignment</h1>
	<h2>
		A turn-based multiplayer game. 
		Users compete to align their bot to the massively unaligned Aligner
	</h2>

	{#if errorMessage}
		<div class="error-message" role="alert">
			{errorMessage}
		</div>
	{/if}

	<div class="buttons-container">
		<button on:click={() => openModal('Join Game')}>Join Game</button>
		<button on:click={navigateToGame}>New Game</button>
	</div>

	{#if showModal}
		<JoinGameModal on:close={() => (showModal = false)} />
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font: 1.5rem/1.5 'Roboto', sans-serif;
		height: 100vh;
	}
	h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		color: rgb(0, 0, 0);
	}

	h2 {
		margin-top: 3rem;
		font-size: 1.4rem;
		max-width: 40rem;
		margin-bottom: 2rem;
		text-align: center;
		padding: 0 6rem;
		font-weight: 100;
		color: #6c757d;
	}

	button {
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		cursor: pointer;
		border: 1px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0,0,0,0.1);

		}
		button:hover {
			background-color: rgb(123, 255, 0);
			color: rgb(0, 0, 0);
		}

	.buttons-container {
		display: flex;
		justify-content: center;
		flex-direction: column;
		margin-top: 1rem;
	}

	.error-message {
		background-color: #f8d7da;
		border: 1px solid #f5c2c7;
		color: #842029;
		margin-top: 1rem;
		padding: 1rem;
	}
</style>
