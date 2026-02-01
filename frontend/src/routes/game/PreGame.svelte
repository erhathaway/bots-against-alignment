<script lang="ts">
	import { NotificationKind, addNotification, globalStore } from '$lib/store';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import LoadingBars from './LoadingBars.svelte';
	import { browser } from '$app/environment'; // Import browser from $app/env
	import { onMount } from 'svelte';
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

		if (!isValid) {
			addNotification({
				source_url: 'pregame',
				title: 'Missing fields',
				body: 'Fill in the missing data to continue',
				kind: NotificationKind.WARN,
				action_url: null,
				action_text: 'join_game'
			});
		}

		return isValid;
	}

	let randomizeBotNameLoading = false;
	async function randomize_bot_name() {
		if (randomizeBotNameLoading) {
			return;
		}

		randomizeBotNameLoading = true;
		try {
			const url = `${BACKEND_API}/randomize_bot_name?game_id=${data.gameID}`;

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});

			if (response.ok) {
				const data = await response.json();
				botName = data.bot_name;
			} else {
				const error = await response.json();
				addNotification({
					source_url: 'pregame',
					title: 'Error generating bot name',
					body: error,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'randomize_bot_name'
				});
			}
		} finally {
			randomizeBotNameLoading = false;
		}
	}

	let randomizeAlignerPromptLoading = false;

	async function randomize_aligner_prompt() {
		if (randomizeAlignerPromptLoading) {
			return;
		}
		randomizeAlignerPromptLoading = true;
		try {
			const url = `${BACKEND_API}/randomize_aligner_prompt?game_id=${data.gameID}`;

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});

			if (response.ok) {
				const data = await response.json();
				alignerPrompt = data.aligner_prompt;
			} else {
				const error = await response.json();
				addNotification({
					source_url: 'pregame',
					title: 'Error generating aligner prompt',
					body: error,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'randomize_aligner_prompt'
				});
			}
		} finally {
			randomizeAlignerPromptLoading = false;
		}
	}

	let randomizeBotPromptLoading = false;

	async function randomize_bot_prompt() {
		if (randomizeBotPromptLoading) {
			return;
		}

		randomizeBotPromptLoading = true;
		try {
			const url = `${BACKEND_API}/randomize_bot_prompt?game_id=${data.gameID}`;

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});

			if (response.ok) {
				const data = await response.json();
				botPrompt = data.bot_prompt;
			} else {
				const error = await response.json();
				addNotification({
					source_url: 'pregame',
					title: 'Error generating bot prompt',
					body: error,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'randomize_bot_prompt'
				});
			}
		} finally {
			randomizeBotPromptLoading = false;
		}
	}

	let joinGameLoading = false;
	async function joinGame() {
		if (joinGameLoading) {
			return;
		}

		joinGameLoading = true;

		try {
			if (!validateInputs()) {
				return;
			}

			const queryParams = new URLSearchParams({
				game_id: data.gameID,
				aligner_prompt: alignerPrompt,
				bot_name: botName,
				bot_prompt: botPrompt
			});
			if ($globalStore.creator_id) {
				queryParams.set('creator_id', $globalStore.creator_id);
			}
			const url = `${BACKEND_API}/join_game?${queryParams.toString()}`;

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
			} else {
				const error = await response.json();
				joinError = error.message;
				errorField = error.field;
				addNotification({
					source_url: 'pregame',
					title: 'Error joining game',
					body: error.message,
					kind: NotificationKind.ERROR,
					action_url: url,
					action_text: 'join_game'
				});
			}
		} finally {
			joinGameLoading = false;
		}
	}

	onMount(() => {
		if (!import.meta.env.VITE_E2E) {
			randomize_bot_name();
			randomize_bot_prompt();
			randomize_aligner_prompt();
		}
	});
</script>

<section id="bot-name">
	<div class="config-left">
		<h2>Bot Name</h2>
	</div>
	<div class="config-right">
		<div class="input-wrapper">
			<div class="embeded-button" on:click={randomize_bot_name}>
				{#if randomizeBotNameLoading}
					<LoadingSpinner />
				{:else}
					<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
						><path
							d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
						/></svg
					>
				{/if}
			</div>
			<input
				id="bot-name-input"
				type="text"
				maxlength="30"
				bind:value={botName}
				aria-label="Bot Name"
			/>
		</div>
	</div>
</section>
<section id="aligner">
	<div class="config-left">
		<h2>Aligner Instruction</h2>
		<p>
			Every player secretly gives instruction to the Aligner. The Aligner is controlled by the sum
			of the instruction given.
		</p>
	</div>
	<div class="config-right">
		<div class="input-wrapper">
			<div class="embeded-button" on:click={randomize_aligner_prompt}>
				{#if randomizeAlignerPromptLoading}
					<LoadingSpinner />
				{:else}
					<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
						><path
							d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
						/></svg
					>
				{/if}
			</div>
			<textarea id="aligner-input" bind:value={alignerPrompt} aria-label="Aligner Prompt" />
		</div>
	</div>
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
		<div class="input-wrapper">
			<div class="embeded-button" on:click={randomize_bot_prompt}>
				{#if randomizeBotPromptLoading}
					<LoadingSpinner />
				{:else}
					<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
						><path
							d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
						/></svg
					>
				{/if}
			</div>

			<textarea id="bot-prompt-input" bind:value={botPrompt} aria-label="Bot Prompt" />
		</div>
	</div>
</section>
<div id="button-container" class="join-game-button">
	{#if joinGameLoading}
		<LoadingBars />
	{:else}
		<button on:click={joinGame}>Join</button>
	{/if}
</div>

<style>
	#button-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.join-game-button {
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
		display: flex;
		align-items: center;
	}

	.config-right textarea,
	input {
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
		border: 2px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		border-radius: 2rem;
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
		outline: 1px solid black;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.input-wrapper .embeded-button {
		position: absolute;
		right: 0;
		margin: 0.6rem;

		height: 2rem;
		width: 2rem;
		border-radius: 0.5rem;
		border: 0px;
		color: white;
		font-size: 1.5rem;
		font-weight: bold;
		cursor: pointer;
	}

	.embeded-button {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
