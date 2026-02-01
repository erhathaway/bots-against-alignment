<script lang="ts">
	import { browser } from '$app/environment';
	import { globalState } from '$lib/state/store.svelte';

	let gameLink = $state('');

	$effect(() => {
		if (!browser) return;
		const currentGameId = globalState.game_id;
		if (!currentGameId) return;

		const url = new URL(window.location.href);
		if (!url.searchParams.get('game_id')) {
			url.searchParams.set('game_id', currentGameId);
		}
		gameLink = url.toString();
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<button type="button" class="game-link" onclick={() => copyToClipboard(gameLink)}>
	<h2>Game # {globalState.game_id}</h2>
	<div id="link-icon">
		<div id="link-vertical-rule"></div>
		<svg
			width="24px"
			height="24px"
			stroke-width="1.5"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			color="#000000"
			><path
				d="M14 11.998C14 9.506 11.683 7 8.857 7H7.143C4.303 7 2 9.238 2 11.998c0 2.378 1.71 4.368 4 4.873a5.3 5.3 0 001.143.124"
				stroke="#FFFF00"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/><path
				d="M10 11.998c0 2.491 2.317 4.997 5.143 4.997h1.714c2.84 0 5.143-2.237 5.143-4.997 0-2.379-1.71-4.37-4-4.874A5.304 5.304 0 0016.857 7"
				stroke="#FFFF00"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/></svg
		>
	</div>
</button>

<style>
	.game-link {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		border: 2px solid black;
		border-radius: 2rem;
		padding: 0.1rem;
		padding-left: 1rem;
		padding-right: 1rem;
		background-color: black;
		color: white;
		color: rgb(123, 255, 0);
		cursor: pointer;
		font: inherit;
		border: 2px solid black;
		background: black;
		padding: 0.1rem 1rem;
		text-align: left;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.game-link:hover {
		background-color: rgb(123, 255, 0);
		color: black;
	}

	h2 {
		font-size: 0.6rem;
	}

	#link-icon {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		margin-left: 2rem;
	}

	#link-vertical-rule {
		height: 100%;
		background-color: rgb(123, 255, 0);
		border: none;
		margin-right: 0.5rem;
		border-left: rgb(123, 255, 0) 1px solid;
	}

	#link-vertical-rule:hover {
		background-color: black;
		border-left: black 1px solid;
	}
</style>
