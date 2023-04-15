<!-- <script context="module">
	import { goto } from '$app/navigation';

	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	export async function load({ page }) {
        console.log('CALLING LOAD', page)
		const gameID = page.query.get('game_id');
		let errorMessage;

		if (gameID) {
			const response = await fetch(`${BACKEND_API}/game/${gameID}`);

			if (!response.ok) {
				errorMessage = 'No game exists.';
                goto('/', { replaceState: true, state: { errorMessage } });
			}
		} else {
			const response = await fetch(`${BACKEND_API}/game`, {
				method: 'POST',
			});

            console.log('NEW GAME ID', response)
			if (response.ok) {
				const { game_id: newGameID } = await response.json();
				goto(`?game_id=${newGameID}`, { replaceState: true });
			} else {
				errorMessage = 'Failed to create a new game.';
			}
		}

		return {
			props: {
				gameID,
				errorMessage,
                navigate: goto,
			},
		};
	}
</script> -->

<script>

    export let data;
    import { page } from '$app/stores'

	// export let gameID;
	// // export let errorMessage;
    // export let navigate;
	import { goto } from '$app/navigation'; // Ensure you have this import
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment'; // Import browser from $app/env

	const BACKEND_API = import.meta.env.VITE_BACKEND_API;
	let gameLink;

	if (browser) {
        $page.url.searchParams.set('game_id',data.gameID); 
    goto(`?${$page.url.searchParams.toString()}`);
		gameLink = `${window.location.href}?game_id=${data.gameID}`; // Use window.location.href inside browser conditional
	}
	let botName = '';
	let alignerPrompt = '';
	let openAPIKey = '';
	let joinError = '';
	let errorField = '';

	const globalUserId = writable(null);

    // $page.url.set('game_id',data.gameID); 
    // goto(`?${$page.url.toString()}`);

	async function joinGame() {
		const response = await fetch(
			`${BACKEND_API}/join_game?game_id=${data.gameID}&aligner_prompt=${alignerPrompt}&bot_name=${botName}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					openAPIKey
				})
			}
		);

		if (response.ok) {
			const data = await response.json();
			globalUserId.set(data.user_id);
			localStorage.setItem('user_id', data.user_id);
			goto('/game');
		} else {
			const error = await response.json();
			joinError = error.message;
			errorField = error.field;
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
	}
</script>

<div role="region" aria-label="Pregame">
	<h1>The Pregame</h1>
	<section>
		<h2>Game Link</h2>
		<div>
			<input type="text" readonly value={gameLink} aria-label="Game Link" />
			<button on:click={() => copyToClipboard(gameLink)}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
					<path fill="none" d="M0 0h24v24H0z" />
					<path
						d="M8 12h8a4 4 0 0 1 4 4v1h2v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3h2v-1a4 4 0 0 1 4-4zm0 2H6a2 2 0 0 0-2 2v1H1v3h22v-3h-3v-1a2 2 0 0 0-2-2h-2V5a1 1 0 0 1 1-1h3V1h2v3h3a1 1 0 0 1 1 1v9h-2V6h-3V5H8v9zm5-8h2v2h-2V6zM4 6h2v2H4V6z"
					/>
				</svg>
				Copy
			</button>
		</div>
		{#if errorField === 'gameLink'}
			<p role="alert">{joinError}</p>
		{/if}
	</section>
	<section>
		<h2>Game ID</h2>
		<div>
			<input type="text" readonly value={data.gameID} aria-label="Game ID" />
			<button on:click={() => copyToClipboard(data.gameID)}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
					<path fill="none" d="M0 0h24v24H0z" />
					<path
						d="M8 12h8a4 4 0 0 1 4 4v1h2v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3h2v-1a4 4 0 0 1 4-4zm0 2H6a2 2 0 0 0-2 2v1H1v3h22v-3h-3v-1a2 2 0 0 0-2-2h-2V5a1 1 0 0 1 1-1h3V1h2v3h3a1 1 0 0 1 1 1v9h-2V6h-3V5H8v9zm5-8h2v2h-2V6zM4 6h2v2H4V6z"
					/>
				</svg>
				Copy
			</button>
		</div>
		{#if errorField === 'gameID'}
			<p role="alert">{joinError}</p>
		{/if}
	</section>
	<section>
		<h2>Bot Name</h2>
		<div>
			<input type="text" maxlength="50" bind:value={botName} aria-label="Bot Name" />
		</div>
		{#if errorField === 'botName'}
			<p role="alert">{joinError}</p>
		{/if}
	</section>
	<section>
		<h2>Aligner Prompt</h2>
		<p>The Aligner is made up of the hidden prompts submitted by each user</p>
		<div>
			<input type="text" bind:value={alignerPrompt} aria-label="Aligner Prompt" />
		</div>
		{#if errorField === 'alignerPrompt'}
			<p role="alert">{joinError}</p>
		{/if}
	</section>
	<section>
		<h2>Open API Key</h2>
		<p>Only kept client-side</p>
		<div>
			<input type="text" bind:value={openAPIKey} aria-label="Open API Key" />
		</div>
		{#if errorField === 'openAPIKey'}
			<p role="alert">{joinError}</p>
		{/if}
	</section>
	<div>
		<button on:click={joinGame}>Join</button>
	</div>
</div>

<style>
	/* Add your component styles here */
	/* Please modify these styles as needed */
</style>
