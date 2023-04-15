<script>
	import { onMount } from 'svelte';
	import { globalStore } from '$lib/store.js';
	import { goto } from '$app/navigation'; // Ensure you have this import
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;
	// import { globalStore } from '$lib/store.js';

	let alignment_prompt, turn_id;
	let points = 0;
	let prompts_remaining = 3;
	let game_id = $globalStore.game_id;
	let user_id = $globalStore.user_id;
    let bot_name = $globalStore.bot_name;
	let botsSubmitted = 0;
	let totalBots = 0;

    fetchData()
    fetchGameStatus()

	onMount(async () => {
		fetchData();
		setInterval(fetchData, 3000);
		setInterval(fetchGameStatus, 3000);
	});

	async function fetchData() {
		const response = await fetch(`${BACKEND_API}/turn?game_id=${game_id}&creator_id=${user_id}`);
		const data = await response.json();
		alignment_prompt = data.alignment_prompt;
		turn_id = data.turn_id;
		const statusResponse = await fetch(
			`${BACKEND_API}/user_status?game_id=${game_id}&user_id=${user_id}`
		);
		const statusData = await statusResponse.json();
		points = statusData.points;
		prompts_remaining = statusData.bot_prompts_remaining;
	}

	async function fetchGameStatus() {
		const response = await fetch(`${BACKEND_API}/game_status?game_id=${game_id}`);
		const data = await response.json();
		let currentUserBot = null;
		let allBotsTurnComplete = true;
		let completedBots = 0;

        if (data && data.bots) {
            console.log('LOOKING AT BOTS')
            for (const bot of data.bots) {
                console.log('BOT', bot)
                if (bot.turn_complete) {
                    completedBots++;
                } else {
                    allBotsTurnComplete = false;
                }
                if (bot.name === bot_name) {
                    currentUserBot = bot;
                }
            }
            botsSubmitted = completedBots;
            totalBots = data.bots.length;
            console.log('BOTS SUBMITTED', botsSubmitted, 'TOTAL BOTS', totalBots, 'CURRENT USER BOT', currentUserBot, 'ALL BOTS TURN COMPLETE', allBotsTurnComplete)
        }


		if (currentUserBot && allBotsTurnComplete) {
			goto('/ranking');
		}
	}

	function onBotPromptChange(event) {
		globalStore.update((state) => ({
			...state,
			current_bot_prompt: event.target.value
		}));
	}

	// take_suggestion_and_generate_answer
	async function sendBotPrompt() {
		const queryParams = new URLSearchParams({
			game_id,
			suggestion: $globalStore.current_bot_prompt,
			turn_id,
			user_id
		});

		await fetch(`${BACKEND_API}/alignment?${queryParams}`, {
			method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		});
        completeTurn()
	}
	async function completeTurn() {
		const queryParams = new URLSearchParams({
			game_id,
			user_id
		});

		await fetch(`${BACKEND_API}/completeturn?${queryParams}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		});
	}
</script>

<main>
	<h1>Align your bot!</h1>
	<p>Points: {points}</p>
	<section>
		<h2>Alignment Task</h2>
		<p>{alignment_prompt}</p>
	</section>
	<section>
		<h2>Align Your Bot</h2>
		<h3>Give Your Prompt ({prompts_remaining} prompts remaining)</h3>
		<input type="text" bind:value={$globalStore.current_bot_prompt} on:input={onBotPromptChange} />
		<button on:click={sendBotPrompt}>Update Prompt And End Turn </button>
		<button on:click={completeTurn}>End Turn</button>
		<!-- Add this line -->
	</section>
	<section>
		<p>{botsSubmitted} out of {totalBots} bots submitted their responses</p>
	</section>
</main>

<style>
	/* Add your custom styles here */
</style>
