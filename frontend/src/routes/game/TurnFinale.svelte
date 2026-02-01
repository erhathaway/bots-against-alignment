<script lang="ts">
	import LoadingBars from './LoadingBars.svelte';
	import { globalStore } from '$lib/store';
	import robot_comedy from '$lib/images/robot_comedy.png';
	import LoadingAudioWave from './LoadingAudioWave.svelte';
	import { NotificationKind, addNotification } from '$lib/store';

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	let isForceNextTurnPending = false;

	async function forceNextTurn() {
		if (isForceNextTurnPending) return;
		isForceNextTurnPending = true;

		try {
			const gameId = $globalStore.game_id;
			const userId = $globalStore.user_id;
			const turnId = $globalStore.last_turn_id;
			if (!gameId || !userId || !turnId) {
				throw new Error('Missing game/user/turn context');
			}

			let isGameOver = false;
			if ($globalStore.creator_id) {
				const url = `${import.meta.env.VITE_BACKEND_API}/process/turn?game_id=${gameId}&user_id=${userId}&turn_id=${turnId}`;
				const response = await fetch(url, { method: 'POST' });
				if (response.ok) {
					const payload = (await response.json()) as unknown;
					if (isRecord(payload) && Array.isArray(payload['alignment_responses'])) {
						isGameOver = payload['alignment_responses'].some(
							(r: unknown) => isRecord(r) && r['is_global_winner'] === true
						);
					}
				} else {
					const data = await response.json();
					addNotification({
						source_url: 'turn finale',
						title: 'Error processing turn',
						body: data,
						kind: NotificationKind.ERROR,
						action_url: url,
						action_text: 'process turn'
					});
				}
			}

			globalStore.update((_s) => ({
				..._s,
				have_all_users_submitted: false,
				is_game_over: isGameOver
			}));
		} finally {
			isForceNextTurnPending = false;
		}
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
			Next Turn
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
