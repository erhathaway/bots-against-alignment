<script lang="ts">
	type Props = {
		onJoinGame?: () => void;
		onNewGame?: () => void;
	};

	let { onJoinGame, onNewGame }: Props = $props();
</script>

<div class="buttons-container">
	<button onclick={onJoinGame}>Join Game</button>
	<button onclick={onNewGame}>New Game</button>
</div>

<style>
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
		button {
			font-size: 60px;
		}
	}

	@media (max-width: 950px) {
		button {
			font-size: 50px;
		}

		.buttons-container {
			padding: 10px;
		}
	}

	@media (max-width: 800px) {
		button {
			font-size: 30px;
			margin: 5px;
		}

		.buttons-container {
			width: 100%;
		}
	}
</style>
