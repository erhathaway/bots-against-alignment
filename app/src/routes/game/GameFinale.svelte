<script lang="ts">
	import { goto } from '$app/navigation';
	import image from '$lib/images/3d-success.gif';

	let imageUrl = $state('');
	let imageText = $state('');

	async function fetchImageAndText() {
		try {
			const response = await fetch('/api/misc/image-and-text');
			const data = await response.json();
			if (response.ok) {
				imageUrl = data.imageUrl;
				imageText = data.imageText;
			} else {
				console.error('Failed to get image and text');
			}
		} catch (error) {
			console.error('Failed to fetch data:', error);
		}
	}

	function playAgain() {
		goto('/game');
	}

	function endGame() {
		goto('/');
	}

	$effect(() => {
		fetchImageAndText();
	});
</script>

<div class="game-finale">
	<h1>YOU LOSE!</h1>

	<div class="image-container">
		<img src={imageUrl || image} alt={imageText || 'Game end'} />
	</div>
	<div class="button-container">
	<button onclick={playAgain}>Play Again</button>
	<button onclick={endGame}>End</button>
</div>
</div>

<style>
	.game-finale {
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: hidden;
		width: 100%;
		height: 100%;
	}
	h1 {
		position: absolute;
		font-size: 5rem;
		margin-bottom: 20px;
	}

	.button-container {
		bottom: 0;
		display: flex;
		justify-content: space-between;
		width: 100%;
		box-shadow: 0px -5px 10px -3px rgba(0, 0, 0, 0.2);
	}
	button {
		flex-grow: 2;
		padding: 10px 20px;
		font-size: 3rem;
		cursor: pointer;
		border: 1px solid black;
		background-color: black;
		color: white;
	}
	button:hover {
		background-color: white;
		color: black;
	}
</style>
