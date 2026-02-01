<script lang="ts">
	import LoadingBars from './LoadingBars.svelte';
	import { globalState } from '$lib/state/store.svelte';
	import robot_comedy from '$lib/images/robot_comedy.png';
	import LoadingAudioWave from './LoadingAudioWave.svelte';
	import { addNotification } from '$lib/state/store.svelte';
	import { isRecord, NotificationKind } from '$lib/types';

	let isForceNextTurnPending = $state(false);

	async function forceNextTurn() {
		if (isForceNextTurnPending) return;
		isForceNextTurnPending = true;

		try {
			const gameId = globalState.game_id;
			const userId = globalState.user_id;
			const turnId = globalState.last_turn_id;
			if (!gameId || !userId || !turnId) {
				throw new Error('Missing game/user/turn context');
			}

			let isGameOver = false;
			if (globalState.creator_id) {
				const url = `/api/game/${gameId}/turn/${turnId}/process`;
				const response = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ playerId: userId })
				});
				if (response.ok) {
					const payload = await response.json();
					if (isRecord(payload) && Array.isArray(payload.alignmentResponses)) {
						isGameOver = payload.alignmentResponses.some(
							(responseEntry) =>
								isRecord(responseEntry) && responseEntry.isGlobalWinner === true
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

			globalState.have_all_users_submitted = false;
			globalState.is_game_over = isGameOver;
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
	<button onclick={forceNextTurn}>
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
