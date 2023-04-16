<script>
	import { globalStore } from '$lib/store.js';

	export let data;
	import { page } from '$app/stores';
	import { goto } from '$app/navigation'; // Ensure you have this import
	import { browser } from '$app/environment'; // Import browser from $app/env
	import Chat from './Chat.svelte';
	import GameLink from './GameLink.svelte';
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;
	// import { spring } from 'svelte/motion';

	// import animate from 'svelte/animate';

	if (browser) {
		$page.url.searchParams.set('game_id', $globalStore.game_id);

		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
	let botName = '';
	let alignerPrompt = '';
	let botPrompt = '';
	let openAPIKey = '';
	let joinError = '';
	let errorField = '';

	async function joinGame() {
		const url = `${BACKEND_API}/join_game?game_id=${data.gameID}&aligner_prompt=${alignerPrompt}&bot_name=${botName}&bot_prompt=${botPrompt}`;
		console.log('*** url', url);

		// globalStore.update({ 'openai_api_key': openAPIKey });

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});

		if (response.ok) {
			const data = await response.json();

			// globalUserId.set(data.user_id);
			// localStorage.setItem('user_id', data.user_id);
			globalStore.update((state) => {
				return {
					...state,
					openai_api_key: openAPIKey,
					current_bot_prompt: botPrompt,
					aligner_prompt: alignerPrompt,
					bot_name: botName,
					user_id: data.user_id
				};
			});

			goto('/lobby');
		} else {
			const error = await response.json();
			joinError = error.message;
			errorField = error.field;
		}
	}
</script>

<div id="screen" role="region" aria-label="Game">
	<section id="left">
		<section id="game-link">
			<GameLink />
		</section>
		<section id="bot-name">
			<div class="config-left">
				<h2>Bot Name</h2>
			</div>
			<div class="config-right">
				<input
					id="bot-name-input"
					type="text"
					maxlength="50"
					bind:value={botName}
					aria-label="Bot Name"
				/>
			</div>
		</section>
		<section id="aligner">
			<div class="config-left">
				<h2>Aligner Instruction</h2>
				<p>
					Every player secretly gives instruction to the Aligner. The Aligner is controlled by the
					sum of the instruction given.
				</p>
			</div>
			<div class="config-right">
				<textarea id="aligner-input" bind:value={alignerPrompt} aria-label="Aligner Prompt" />
			</div>
			{#if errorField === 'alignerPrompt'}
				<p role="alert">{joinError}</p>
			{/if}
		</section>
		<section>
			<div class="config-left">

			<h2>Bot Prompt</h2>
			<p>
				This guides your bot's response. You have 2 additonal chances to change this prompt over the
				course of the game.
			</p>
		</div>
		<div class="config-right">
			<textarea bind:value={botPrompt} aria-label="Bot Prompt" />
			</div>
			{#if errorField === 'botPrompt'}
				<p role="alert">{joinError}</p>
			{/if}
		</section>
		<div>
			<button on:click={joinGame}>Join</button>
		</div>
	</section>
	<section id="right">
		<Chat />
	</section>
	<!-- <section>
		<h2>Open API Key</h2>
		<p>Only kept client-side</p>
		<div>
			<input type="text" bind:value={openAPIKey} aria-label="Open API Key" />
		</div>
		{#if errorField === 'openAPIKey'}
			<p role="alert">{joinError}</p>
		{/if}
	</section> -->
</div>

<style>
	#screen {
		display: flex;
		flex-direction: row;
		/* justify-content: space-between; */
		/* flex-grow: 2; */
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
	}

	#left {
		display: flex;
		flex-direction: column;
		/* flex-grow: 2; */
		/* background-color: blue; */
		max-width: 50%;
	}

	#right {
		display: flex;
		flex-direction: column;
		flex-grow: 2;
		/* background-color: red; */
		background-color: white;
		max-width: 50%;
		border-left: 2px solid black;
	}

	section {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 1rem;
		width: 100%;
		flex-grow: 2;
		/* padding: 2rem; */
		/* flex-grow: 2; */
	}


	/* #bot-name h2 {
		margin-right: 1rem;
		font-weight: bold;
		font-size: 1.4rem;

	} */

	/* #bot-name-input {
		width: 100%;
		outline: 2px solid rgb(0, 0, 0);
		height: 2rem;
		font-size: 1.5rem;
		border-radius: 0.5rem;
		padding: 0.7rem;
		font-size: 1.4rem;

	} */


	.config-left {
		display: flex;
		flex-direction: column;
		/* widows: 100%; */
		align-items: flex-end;
		flex-grow: 2;
		margin-right: 2rem;
		/* justify-content: flex-end; */
	}

	.config-left h2 {
		margin-right: 1rem;
		font-weight: bold;
		font-size: 1.4rem;
		
	}
	.config-left p {
		/* margin-right: 1rem; */
		/* font-weight: bold; */
		width: 15rem;
		text-align: center;
		color: gray;
	}
	.config-right {
		width: 50%;
		/* background-color: red; */
		height: 100%;
		display: flex;
		align-items: center;
		/* width: 100%; */
		
	}
	
	.config-right textarea, input {
		height: 2rem;
		font-size: 1.4rem;
		padding: 0.7rem;
		border: 0px;
		border-radius: 0.5rem;
		outline: 3px solid rgb(0, 0, 0);
		/* outline: ; */
	}

	.config-right textarea {
		height: 10rem;
	}
</style>
