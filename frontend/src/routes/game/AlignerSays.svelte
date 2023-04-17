<script>
	import { globalStore } from '$lib/store.js';

	import { browser } from '$app/environment'; // Import browser from $app/env
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	export let data;

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
			errorMessages.botName = '';
		}
		if (alignerPrompt !== '' && document) {
			document.getElementById('aligner-input').style.outlineColor = 'black';
			errorMessages.alignerPrompt = '';
		}
		if (botPrompt !== '' && document) {
			document.getElementById('bot-prompt-input').style.outlineColor = 'black';
			errorMessages.botPrompt = '';
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

<!-- <section id="left"> -->

<section id="aligner">
	<div id="aligner-card" class="card">
		<div class="config-top">
			<h2>Aligner:</h2>
		</div>
		<div class="config-bottom">
			<p>
				Every player secretly gives instruction to the Aligner. The Aligner is controlled by the sum
				of the instruction given.
			</p>
		</div>
	</div>
</section>
<section id="bot">
	<div id="bot-card" class="card">
		<div class="config-top">
			<h2>Bot Prompt</h2>
		</div>
		<div class="config-bottom">
			<textarea id="bot-prompt-input" bind:value={botPrompt} aria-label="Bot Prompt" />
		</div>
	</div>
</section>
<div id="button-container">
	<button on:click={joinGame}>Tell Bot To Respond To Aligner</button>
</div>

<!-- </section> -->

<style>
	#button-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	#screen {
		display: flex;
		flex-direction: row;
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
	}

	section {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 1rem;
		/* width: 100%; */
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

	#aligner {
		margin-top: 0;
		/* margin: 3rem; */
		/* padding: 2rem; */
		/* width: 100%; */
		/* background-color: blue; */
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	#bot {
		padding-top: 2rem;
		margin-top: 0;
		/* margin: 3rem; */
		/* padding: 2rem; */
		/* width: 100%; */
		/* background-color: blue; */
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.card {
		background-color: rgb(123, 255, 0);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 2rem;
		width: 70%;
		border-radius: 1rem;
	}
	.card .config-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
	.card h2 {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}

	#bot-card {
		background-color: rgb(0, 204, 255);
	}

	#bot-prompt-input {
		margin-top: 1rem;
		border-radius: 1rem;
		padding: 1rem;
		/* display: flex; */
		/* flex-direction: column; */
		/* justify-content: space-between; */
		/* align-items: center; */
		width: 100%;
	}
</style>
