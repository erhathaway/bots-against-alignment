<script lang="ts">
	import JoinGameModal from './JoinGameModal.svelte';
	import { goto } from '$app/navigation';

	let showModal = $state(false);

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
	</div>

	<div class="buttons-container">
	<button onclick={openModal}>Join Game</button>
	<button onclick={navigateToGame}>New Game</button>
</div>

{#if showModal}
	<JoinGameModal onClose={() => (showModal = false)} />
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
		padding: 100px;
	}
	h1 {
		font-size: 120px;
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
		font-weight: bold;

		cursor: pointer;
		border: 3px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.3);
		font-size: 80px;
		margin: 5%;
	}
	button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
	}

	.buttons-container {
		display: flex;
		justify-content: center;
		flex-direction: column;
		width: 100%;
		height: 100%;
		padding: 70px;
	}

	@media (max-width: 1300px) {
		h1 {
			font-size: 110px;
			letter-spacing: 0px;
			line-height: 100px;
		}

		button {
			font-size: 60px;
		}
	}

	@media (max-width: 950px) {
		h1 {
			font-size: 80px;
			letter-spacing: 0px;
			line-height: 70px;
		}

		h2 {
			font-size: 1.5rem;
			line-height: 2rem;
			margin: 1rem;
		}

		.text-container {
			padding: 50px;
		}

		button {
			font-size: 50px;
		}

		.buttons-container {
			padding: 10px;
		}
	}

	@media (max-width: 800px) {
		main {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			font: 1.5rem/1.5 'Roboto', sans-serif;
			height: 100vh;
		}

		h1 {
			font-size: 80px;
			letter-spacing: 8px;
			letter-spacing: 0px;
			line-height: 70px;
			margin-bottom: 10px;
		}

		h2 {
			font-size: 2rem;
			line-height: 3rem;
			margin: 0rem;
		}

		button {
			font-size: 30px;

			margin: 5px;
		}

		.buttons-container {
			width: 100%;
		}
	}
</style>
