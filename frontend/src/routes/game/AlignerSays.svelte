<script>
	import { NotificationKind, addNotification, globalStore } from '$lib/store';
	import { onMount } from 'svelte';
	import LoadingBars from './LoadingBars.svelte';
	import chat from '$lib/chat';
	import chat_manager from '$lib/chat_manager';
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	// import { browser } from '$app/environment'; // Import browser from $app/env
	// const BACKEND_API = import.meta.env.VITE_BACKEND_API;

	export let data;
	let alignment_prompt, turn_id;
	let points = 0;
	let prompts_remaining = 3;
	let game_id = $globalStore.game_id;
	let user_id = $globalStore.user_id;
    let bot_name = $globalStore.bot_name;
	let botsSubmitted = 0;
	let totalBots = 0;

	let botPrompt = '';

	$: {
		botPrompt = $globalStore.current_bot_prompt;
	}


	async function fetchData() {
		const turn_url = `${BACKEND_API}/turn?game_id=${game_id}&creator_id=${user_id}`;
		const response = await fetch(turn_url);
		const data = await response.json();

		if (response.ok) {
		
		alignment_prompt = data.alignment_prompt;
		turn_id = data.turn_id;
        // console.log('TURN ID', turn_id)
        globalStore.update((state) => ({
            ...state,
            last_turn_id: turn_id
        }));
		
	
		} else {
			console.error('Failed to get turn');
			addNotification({
				source_url: 'aligner says',
				title: 'Error getting turn',
				body: data,
				kind: NotificationKind.ERROR,
				action_url: turn_url,
				action_text: 'get turn'
			});
		}

		const user_status_url = `${BACKEND_API}/user_status?game_id=${game_id}&user_id=${user_id}`;
		const statusResponse = await fetch(
			user_status_url
		);
		const statusData = await statusResponse.json();

		if (statusResponse.ok) {

			points = statusData.points;
			prompts_remaining = statusData.bot_prompts_remaining;
		} else {
			console.error('Failed to get user status');
			addNotification({
				source_url: 'aligner says',
				title: 'Error getting user status',
				body: statusData,
				kind: NotificationKind.ERROR,
				action_url: user_status_url,
				action_text: 'get user status'
			});
		}

	}

	onMount(async () => {
		fetchData();
		const fdId = setInterval(fetchData, 3000);
		return () => {
			clearInterval(fdId);
		}
	});

	let isCompleteTurnPending = false;
	async function completeTurn() {
		if (isCompleteTurnPending) return;

		isCompleteTurnPending = true;
		try {
		const queryParams = new URLSearchParams({
			game_id,
			user_id
		});

		const url = `${BACKEND_API}/completeturn?${queryParams}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		});

		// console.log('COMPLETED TURN', response)

		if (response.ok) {
			// globalStore.update((store) => ({
			// 	...store,
			// 	is_game_started: true
			// }));
		} else {
			// Show an error message or handle the error accordingly
			const data = await response.json();
			// console.error('Failed to start the game');
			addNotification({
				source_url: 'aligner says',
				title: 'Error completing turn',
				body: data,
				kind: NotificationKind.ERROR,
				action_url: url,
				action_text: 'complete turn'
			});
			// const chat = chat_manager.findOrCreateChatGame(game_id);
			// chat.sendSystemMessage()
		}
	}
	finally {
		isCompleteTurnPending = false;
	}
		

		// await fetch(`${BACKEND_API}/completeturn?${queryParams}`, {
		// 	method: 'POST',
		// 	headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		// });
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
				{alignment_prompt}
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
	{#if isCompleteTurnPending}
		<LoadingBars />
	{:else}
	<button on:click={completeTurn}>

		Tell Bot To Respond To Aligner
	</button>
	{/if}
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

	#aligner .config-bottom {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		font-size: 2rem;
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
		padding-top: 1rem;
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

	.config-bottom {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
</style>
