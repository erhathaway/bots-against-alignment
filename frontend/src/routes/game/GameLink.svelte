<script>
	import { globalStore } from '$lib/store.js';
	import { browser } from '$app/environment'; // Import browser from $app/env
	import { page } from '$app/stores';
	let gameLink;

	let gameLinkHover = false;

	if (browser) {

		gameLink = window.location.href; //`${window.location.href}?game_id=${data.gameID}`; // Use window.location.href inside browser conditional
		if (!gameLink.includes('game_id')) {
			gameLink = `${gameLink}?game_id=${$globalStore.game_id}`;
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
	}
</script>

<span
	tabindex="0"
	on:mouseover={() => (gameLinkHover = true)}
	on:mouseout={() => (gameLinkHover = false)}
	on:click={() => copyToClipboard(gameLink)}
>
	<h2>Game # {$globalStore.game_id}</h2>
	{#if gameLinkHover}
		<button>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
				<path fill="none" d="M0 0h24v24H0z" />
				<path
					d="M8 12h8a4 4 0 0 1 4 4v1h2v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3h2v-1a4 4 0 0 1 4-4zm0 2H6a2 2 0 0 0-2 2v1H1v3h22v-3h-3v-1a2 2 0 0 0-2-2h-2V5a1 1 0 0 1 1-1h3V1h2v3h3a1 1 0 0 1 1 1v9h-2V6h-3V5H8v9zm5-8h2v2h-2V6zM4 6h2v2H4V6z"
				/>
			</svg>
			Copy
		</button>
	{/if}
</span>


<style>

	span {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		/* border: 2px solid black; */

	}

	h2 {
		font-size: 0.8rem;
	}
	h2:hover {
	font-weight: bold;
}
</style>
