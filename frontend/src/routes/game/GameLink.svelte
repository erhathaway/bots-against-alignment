<script>
	import { globalStore } from '$lib/store';
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
<!-- on:mouseover={() => (gameLinkHover = true)}
on:mouseout={() => (gameLinkHover = false)} -->

<span
	tabindex="0"
	on:click={() => copyToClipboard(gameLink)}
>
	<h2>Game # {$globalStore.game_id}</h2>
	<div id="link-icon">
		<div id="link-vertical-rule"/>
		<svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M14 11.998C14 9.506 11.683 7 8.857 7H7.143C4.303 7 2 9.238 2 11.998c0 2.378 1.71 4.368 4 4.873a5.3 5.3 0 001.143.124" stroke="#FFFF00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 11.998c0 2.491 2.317 4.997 5.143 4.997h1.714c2.84 0 5.143-2.237 5.143-4.997 0-2.379-1.71-4.37-4-4.874A5.304 5.304 0 0016.857 7" stroke="#FFFF00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
	</div>

</span>


<style>

	span {
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
		box-shadow: 0px 10px 15px -3px rgba(0,0,0,0.1),0px 10px 15px -3px rgba(0,0,0,0.1);
	}
	
	span:hover {
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
	/* width: 1rem; */
	height: 100%;
	/* height: 0.1rem; */
	background-color: rgb(123, 255, 0);
	border: none;
	margin-right: 0.5rem;
	border-left:rgb(123, 255, 0) 1px solid;
}

#link-vertical-rule:hover {
	background-color: black;
	border-left: black 1px solid;
}
</style>
