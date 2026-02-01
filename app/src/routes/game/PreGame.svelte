<script lang="ts">
	import { addNotification, globalState } from '$lib/state/store.svelte';
	import { NotificationKind } from '$lib/types';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import LoadingBars from './LoadingBars.svelte';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';

	type GamePageData = {
		gameId: string | null;
		creatorId: string | null;
		errorMessage?: string;
	};

	let { data }: { data: GamePageData } = $props();

	let botName = $state('');
	let alignerPrompt = $state('');
	let botPrompt = $state('');

	let errorMessages = $state({
		botName: '',
		alignerPrompt: '',
		botPrompt: ''
	});

	function setOutlineColor(id: string, color: string) {
		const el = document.getElementById(id);
		if (el instanceof HTMLElement) {
			el.style.outlineColor = color;
		}
	}

	$effect(() => {
		if (!browser) return;
		if (botName !== '') {
			setOutlineColor('bot-name-input', 'black');
			errorMessages.botName = '';
		}
		if (alignerPrompt !== '') {
			setOutlineColor('aligner-input', 'black');
			errorMessages.alignerPrompt = '';
		}
		if (botPrompt !== '') {
			setOutlineColor('bot-prompt-input', 'black');
			errorMessages.botPrompt = '';
		}
	});

	function validateInputs() {
		if (!browser) return false;

		let isValid = true;

		if (botName.trim() === '') {
			errorMessages.botName = 'Missing';
			setOutlineColor('bot-name-input', 'yellow');
			isValid = false;
		} else {
			errorMessages.botName = '';
			setOutlineColor('bot-name-input', 'black');
		}

		if (alignerPrompt.trim() === '') {
			errorMessages.alignerPrompt = 'Missing';
			setOutlineColor('aligner-input', 'yellow');
			isValid = false;
		} else {
			errorMessages.alignerPrompt = '';
			setOutlineColor('aligner-input', 'black');
		}

		if (botPrompt.trim() === '') {
			errorMessages.botPrompt = 'Missing';
			setOutlineColor('bot-prompt-input', 'yellow');
			isValid = false;
		} else {
			errorMessages.botPrompt = '';
			setOutlineColor('bot-prompt-input', 'black');
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

	let randomizeBotNameLoading = $state(false);
	async function randomize_bot_name() {
		if (randomizeBotNameLoading) {
			return;
		}

		const gameId = data.gameId;
		if (!gameId) {
			addNotification({
				source_url: 'pregame',
				title: 'Game not initialized',
				body: 'Missing game ID. Refresh and try again.',
				kind: NotificationKind.ERROR,
				action_url: null,
				action_text: 'randomize_bot_name'
			});
			return;
		}

		randomizeBotNameLoading = true;
		try {
			const url = `/api/game/${gameId}/random/bot-name`;
			const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });

			if (response.ok) {
				const payload = await response.json();
				botName = payload.botName;
			} else if (response.status !== 429) {
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

	let randomizeAlignerPromptLoading = $state(false);

	async function randomize_aligner_prompt() {
		if (randomizeAlignerPromptLoading) {
			return;
		}
		const gameId = data.gameId;
		if (!gameId) {
			addNotification({
				source_url: 'pregame',
				title: 'Game not initialized',
				body: 'Missing game ID. Refresh and try again.',
				kind: NotificationKind.ERROR,
				action_url: null,
				action_text: 'randomize_aligner_prompt'
			});
			return;
		}
		randomizeAlignerPromptLoading = true;
		try {
			const url = `/api/game/${gameId}/random/aligner-prompt`;
			const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });

			if (response.ok) {
				const payload = await response.json();
				alignerPrompt = payload.alignerPrompt;
			} else if (response.status !== 429) {
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

	let randomizeBotPromptLoading = $state(false);

	async function randomize_bot_prompt() {
		if (randomizeBotPromptLoading) {
			return;
		}
		const gameId = data.gameId;
		if (!gameId) {
			addNotification({
				source_url: 'pregame',
				title: 'Game not initialized',
				body: 'Missing game ID. Refresh and try again.',
				kind: NotificationKind.ERROR,
				action_url: null,
				action_text: 'randomize_bot_prompt'
			});
			return;
		}

		randomizeBotPromptLoading = true;
		try {
			const url = `/api/game/${gameId}/random/bot-prompt`;
			const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });

			if (response.ok) {
				const payload = await response.json();
				botPrompt = payload.botPrompt;
			} else if (response.status !== 429) {
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

	let joinGameLoading = $state(false);
	async function joinGame() {
		if (joinGameLoading) {
			return;
		}

		joinGameLoading = true;

		try {
			if (!validateInputs()) {
				return;
			}

			const gameId = data.gameId;
			if (!gameId) {
				addNotification({
					source_url: 'pregame',
					title: 'Game not initialized',
					body: 'Missing game ID. Refresh and try again.',
					kind: NotificationKind.ERROR,
					action_url: null,
					action_text: 'join_game'
				});
				return;
			}

			const response = await fetch(`/api/game/${gameId}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					alignerPrompt,
					botName,
					botPrompt,
					creatorId: globalState.creator_id
				})
			});

			if (response.ok) {
				const payload = await response.json();
				globalState.current_bot_prompt = botPrompt;
				globalState.aligner_prompt = alignerPrompt;
				globalState.bot_name = botName;
				globalState.user_id = payload.playerId;
				globalState.has_player_joined = true;
			} else {
				const error = await response.json();
				addNotification({
					source_url: 'pregame',
					title: 'Error joining game',
					body: error.message,
					kind: NotificationKind.ERROR,
					action_url: `/api/game/${gameId}/join`,
					action_text: 'join_game'
				});
			}
		} finally {
			joinGameLoading = false;
		}
	}

	$effect(() => {
		if (env.PUBLIC_E2E === '1' || env.PUBLIC_E2E === 'true') return;
		randomize_bot_name();
		randomize_bot_prompt();
		randomize_aligner_prompt();
	});
</script>

<section id="bot-name">
	<div class="config-left">
		<h2>Bot Name</h2>
	</div>
	<div class="config-right">
		<div class="input-wrapper">
			<button type="button" class="embeded-button" onclick={randomize_bot_name}>
				{#if randomizeBotNameLoading}
					<LoadingSpinner />
				{:else}
					<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
						><path
							d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
						/></svg
					>
				{/if}
			</button>
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
			<button type="button" class="embeded-button" onclick={randomize_aligner_prompt}>
				{#if randomizeAlignerPromptLoading}
					<LoadingSpinner />
				{:else}
					<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
						><path
							d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
						/></svg
					>
				{/if}
			</button>
			<textarea id="aligner-input" bind:value={alignerPrompt} aria-label="Aligner Prompt"></textarea>
		</div>
	</div>
</section>
<section>
	<div class="config-left">
		<h2>Bot Prompt</h2>
		<p>
			This guides your bot's response. You have 2 chances to change this prompt over the
			course of the game.
		</p>
	</div>
	<div class="config-right">
		<div class="input-wrapper">
			<button type="button" class="embeded-button" onclick={randomize_bot_prompt}>
				{#if randomizeBotPromptLoading}
					<LoadingSpinner />
				{:else}
					<svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"
						><path
							d="M447.1 224c0-12.56-4.781-25.13-14.35-34.76l-174.9-174.9C249.1 4.786 236.5 0 223.1 0C211.4 0 198.9 4.786 189.2 14.35L14.35 189.2C4.783 198.9-.0011 211.4-.0011 223.1c0 12.56 4.785 25.17 14.35 34.8l174.9 174.9c9.625 9.562 22.19 14.35 34.75 14.35s25.13-4.783 34.75-14.35l174.9-174.9C443.2 249.1 447.1 236.6 447.1 224zM96 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S120 210.8 120 224S109.3 248 96 248zM224 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 376 224 376zM224 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1S248 210.8 248 224S237.3 248 224 248zM224 120c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S237.3 120 224 120zM352 248c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S365.3 248 352 248zM591.1 192l-118.7 0c4.418 10.27 6.604 21.25 6.604 32.23c0 20.7-7.865 41.38-23.63 57.14l-136.2 136.2v46.37C320 490.5 341.5 512 368 512h223.1c26.5 0 47.1-21.5 47.1-47.1V240C639.1 213.5 618.5 192 591.1 192zM479.1 376c-13.25 0-23.1-10.75-23.1-23.1s10.75-23.1 23.1-23.1s23.1 10.75 23.1 23.1S493.2 376 479.1 376z"
						/></svg
					>
				{/if}
			</button>

			<textarea id="bot-prompt-input" bind:value={botPrompt} aria-label="Bot Prompt"></textarea>
		</div>
	</div>
</section>
<div id="button-container" class="join-game-button">
	{#if joinGameLoading}
		<LoadingBars />
	{:else}
		<button onclick={joinGame}>Join</button>
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
		background: none;
		padding: 0;
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
