<script>
	import { globalStore } from '$lib/store.js';

	export let data;
	import { page } from '$app/stores';
	import { goto } from '$app/navigation'; // Ensure you have this import
	import { browser } from '$app/environment'; // Import browser from $app/env
	import Chat from './Chat.svelte';
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

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

	let errorMessages = {
    botName: '',
    alignerPrompt: '',
    botPrompt: ''
  };

  $: {
	if (botName !== '' && document) {
		document.getElementById('bot-name-input').style.outlineColor = 'black';
	}
	if (alignerPrompt !== '' && document) {
		document.getElementById('aligner-input').style.outlineColor = 'black';
	}
	if (botPrompt !== '' && document) {
		document.getElementById('bot-prompt-input').style.outlineColor = 'black';
  }
}

  function validateInputs() {
    let isValid = true;

	if (!browser) {
		isValid = false;
	}

    if (botName.trim() === '') {
      errorMessages.botName = 'Missing';
      document.getElementById('bot-name-input').style.outlineColor = 'yellow';
      isValid = false;
    } else {
      errorMessages.botName = '';
      document.getElementById('bot-name-input').style.outlineColor = 'black';
    }

    if (alignerPrompt.trim() === '') {
      errorMessages.alignerPrompt = 'Missing';
      document.getElementById('aligner-input').style.outlineColor = 'yellow';
      isValid = false;
    } else {
      errorMessages.alignerPrompt = '';
      document.getElementById('aligner-input').style.outlineColor = 'black';
    }

    if (botPrompt.trim() === '') {
      errorMessages.botPrompt = 'Missing';
      document.getElementById('bot-prompt-input').style.outlineColor = 'yellow';
      isValid = false;
    } else {
      errorMessages.botPrompt = '';
      document.getElementById('bot-prompt-input').style.outlineColor = 'black';
    }

    return isValid;
  }

	async function joinGame() {
		if (!validateInputs()) {
      return;
    }
		const url = `${BACKEND_API}/join_game?game_id=${data.gameID}&aligner_prompt=${alignerPrompt}&bot_name=${botName}&bot_prompt=${botPrompt}`;
		console.log('*** join game', url);

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});

		if (response.ok) {
			const data = await response.json();
			globalStore.update((state) => {
				return {
					...state,
					openai_api_key: openAPIKey,
					current_bot_prompt: botPrompt,
					aligner_prompt: alignerPrompt,
					bot_name: botName,
					user_id: data.user_id,
					has_player_joined: true
				};
			});
			console.log('has joined game');
		} else {
			const error = await response.json();
			joinError = error.message;
			errorField = error.field;
		}
	}
</script>

<div id="screen" role="region" aria-label="Game">
	<section id="left">
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
			  {#if errorMessages.botName}
				<p style="color:red">{errorMessages.botName}</p>
			  {/if}
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
				{#if errorMessages.alignerPrompt}
				  <p style="color:red">{errorMessages.alignerPrompt}</p>
				{/if}
			</div>
		</section>
		<section>
			<div class="config-left">
				<h2>Bot Prompt</h2>
				<p>
					This guides your bot's response. You have 2 additonal chances to change this prompt over
					the course of the game.
				</p>
			</div>
			<div class="config-right">
				<textarea id="bot-prompt-input" bind:value={botPrompt} aria-label="Bot Prompt" />
				{#if errorMessages.botPrompt}
				  <p style="color:red">{errorMessages.botPrompt}</p>
				{/if}
			  </div>
		</section>
		<div>
			<button on:click={joinGame}>Join</button>
		</div>
	</section>
	<section id="right">
		<Chat />
	</section>
</div>

<style>
	#screen {
		display: flex;
		flex-direction: row;
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
	}

	#left {
		display: flex;
		flex-direction: column;
		overflow-y: scroll;
		max-width: 50%;
	}

	#right {
		display: flex;
		flex-direction: column;
		flex-grow: 2;
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
	}

	.config-left {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex-grow: 2;
		margin-right: 2rem;
	}

	.config-left h2 {
		margin-right: 1rem;
		font-weight: bold;
		font-size: 1.4rem;
	}
	.config-left p {
		width: 15rem;
		text-align: center;
		color: gray;
	}
	.config-right {
		width: 50%;
		height: 100%;
		display: flex;
		align-items: center;
		margin-right: 1rem;
	}

	.config-right textarea,
	input {
		height: 2rem;
		font-size: 1.4rem;
		padding: 0.7rem;
		border: 0px;
		border-radius: 0.5rem;
		outline: 3px solid rgb(0, 0, 0);
	}

	.config-right textarea {
		height: 10rem;
	}

	button {
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		margin-top: 2rem;
		margin-bottom: 3rem;
		cursor: pointer;
		border: 1px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
	}
</style>
