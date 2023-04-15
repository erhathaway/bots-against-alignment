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
		A turn-based multiplayer game where users compete to align their bot to the massively unaligned
		Aligner
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
	h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 2rem;
		margin-bottom: 2rem;
	}

	button {
		font-size: 1.5rem;
		padding: 0.75rem 1.5rem;
		margin: 0 0.5rem;
		cursor: pointer;
	}

	.buttons-container {
		display: flex;
		justify-content: center;
	}

	.error-message {
		background-color: #f8d7da;
		border: 1px solid #f5c2c7;
		color: #842029;
		margin-top: 1rem;
		padding: 1rem;
	}
</style>
