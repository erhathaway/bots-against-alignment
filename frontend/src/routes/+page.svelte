<script lang="ts">
	import JoinGameModal from './JoinGameModal.svelte';
	import { goto } from '$app/navigation';

	let showModal = false;

	function openModal() {
		showModal = true;
	}
	function navigateToGame() {
		goto('/game');
	}
</script>

<main>
	<div class="text-container">
		<h1>Bots Against Alignment</h1>
		<h2>A turn-based multiplayer game</h2>
		<!-- <h2>Users compete to align their bot to the Aligner</h2> -->
	</div>

	<div class="buttons-container">
		<button on:click={openModal}>Join Game</button>
		<button on:click={navigateToGame}>New Game</button>
	</div>

	{#if showModal}
		<JoinGameModal on:close={() => (showModal = false)} />
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		font: 1.5rem/1.5 'Roboto', sans-serif;
		height: 100vh;
	}

	.text-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font: 1.5rem/1.5 'Roboto', sans-serif;
		height: 100%;
	}
	h1 {
		font-size: 7rem;
		color: rgb(0, 0, 0);
		font-weight: bold;
		letter-spacing: 15px;
		color: rgb(123, 255, 0);
		text-shadow: 4px 4px 5px rgba(67, 164, 25, 0.3);
		margin: 0;
		font-family: 'Bebas Neue', cursive;
		-webkit-text-stroke-width: 2px;
		-webkit-text-stroke-color: rgba(0, 0, 0, 0.6);
	}

	h2 {
		font-size: 1.7rem;
		text-align: center;
		font-weight: 100;
		letter-spacing: 2px;
		line-height: 2.3rem;
		color: #000000;
		margin: 0;
		margin: 2rem;
	}

	button {
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		height: 100%;
		cursor: pointer;
		border: 3px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.3);
		width: calc(100%-20px);
		font-size: 80px;
		margin: 10px;
	}
	button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
	}

	.buttons-container {
		display: flex;
		justify-content: center;
		flex-direction: column;
		height: 100%;
	}

	@media(max-width: 900px) {
		h1 {
			font-size: 5rem;
			letter-spacing: 10px;
		}

		h2 {
			font-size: 1.5rem;
			line-height: 2rem;
			margin: 1rem;
		}

		button {
			width: 100%;
			font-size: 50px;
			margin: 5px;
		}
	}

	@media (max-width: 600px) {
		main {
			display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font: 1.5rem/1.5 'Roboto', sans-serif;
		height: 100vh;
			}

		h1 {
			font-size: 4rem;
			letter-spacing: 8px;
		}

		h2 {
			font-size: 1.2rem;
			line-height: 1.8rem;
			margin: 1rem;
		}

		button {
			width: 100%;
			font-size: 40px;
			margin: 5px;
		}
	}
</style>
