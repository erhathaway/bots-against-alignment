<script lang="ts">
	import { onMount } from 'svelte';
	import LoadingBars from './LoadingBars.svelte';
	import chat from '$lib/chat';
	import chat_manager from '$lib/chat_manager';
	import { NotificationKind, addNotification, globalStore } from '$lib/store';
	const BACKEND_API = import.meta.env.VITE_BACKEND_API;
    import robot_comedy from '$lib/images/robot_comedy.png';
	import LoadingAudioWave from './LoadingAudioWave.svelte';

	let isForceNextTurnPending = false;

	async function forceNextTurn() {
		if (isForceNextTurnPending) return;
		isForceNextTurnPending = true;

		try {
            globalStore.update((_s) => ({
                ..._s,
                have_all_users_submitted : false
            }));
			// Call the API to get turn finale results
			// const response = await fetch(`${BACKEND_API}/turn_finale?game_id=${$globalStore.game_id}&turn_id=${$globalStore.last_turn_id}`);
			// const data = await response.json();
			// if (response.ok) {
			// 	// Send each turn finale step to the chat API as an aligner message
			// 	for (const step of data.steps) {
			// 		const chat = chat_manager.findOrCreateChatGame($globalStore.game_id);
			// 		chat.sendMessage(step, $globalStore.game_id, 'ALIGNER');
			// 	}
			// } else {
            //     // addNotification({
			// 	// 	source_url: 'pregame',
			// 	// 	title: 'Error generating bot name',
			// 	// 	body: error,
			// 	// 	kind: NotificationKind.ERROR,
			// 	// 	action_url: url,
			// 	// 	action_text: 'randomize_bot_name'
			// 	// });
            //     addNotification({
            //         source_url: 'turn finale',
            //         title: 'Error getting turn finale',
            //         body: data,
            //         kind: NotificationKind.ERROR,
            //         action_url: url,
            //         action_text: 'get turn finale'
            //     });
			// 	console.error('Failed to get turn finale');
			// }
		} finally {
			isForceNextTurnPending = false;
		}

		// Set have_all_users_submitted to false
		globalStore.update((_s) => ({
			..._s,
			have_all_users_submitted : false
		}));
	}
</script>

<div id="container">
    <div class="padding" />
    <!-- <h2>Aligner Says</h2> -->
    <img alt="a robots head talking" src={robot_comedy} />

    <LoadingAudioWave />
    <div class="padding" />
    <button on:click={forceNextTurn}>
        {#if isForceNextTurnPending}
		<LoadingBars />
        {:else}
		Force Next Turn
        {/if}
    </button>
</div>

<style>
    h2 {
		font-size: 3rem;
		font-weight: bold;
		margin-bottom: 1.5rem;

	}

    #container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        /* padding-top: 10rem; */
    }
    .padding {
        height: 0rem;
    }
    img {
        height: 30rem;
        width: 30rem;
        border: 3px solid rgb(255, 255, 255);
        box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.4);
        border-radius: 0.7rem;
        /* margin-bottom: 10rem; */

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
