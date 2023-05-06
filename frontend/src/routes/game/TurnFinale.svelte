<script lang="ts">
	import LoadingBars from './LoadingBars.svelte';
	import { globalStore } from '$lib/store';
	import robot_comedy from '$lib/images/robot_comedy.png';
	import LoadingAudioWave from './LoadingAudioWave.svelte';

	let isForceNextTurnPending = false;

	async function forceNextTurn() {
		if (isForceNextTurnPending) return;
		isForceNextTurnPending = true;

		try {
			globalStore.update((_s) => ({
				..._s,
				have_all_users_submitted: false,
				is_game_over: true
			}));
		} finally {
			isForceNextTurnPending = false;
		}

		// Set have_all_users_submitted to false
		globalStore.update((_s) => ({
			..._s,
			have_all_users_submitted: false
		}));
	}
</script>

<div id="container">
	<div class="padding" />
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
