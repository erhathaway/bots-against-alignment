<script lang="ts">
	import HomeTitle from '$lib/components/home/HomeTitle.svelte';
	import HomeActions from '$lib/components/home/HomeActions.svelte';
	import JoinGameModal from '$lib/components/home/JoinGameModal.svelte';
	import StorybookLink from '$lib/components/home/StorybookLink.svelte';
	import GitHubLink from '$lib/components/home/GitHubLink.svelte';
	import { goto } from '$app/navigation';

	let showModal = $state(false);

	async function handleJoin(gameId: string) {
		try {
			const response = await fetch(`/api/game/${gameId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
			if (response.ok) {
				goto(`/game?game_id=${gameId}`);
			}
		} catch (error) {
			console.error('Error:', error);
		}
	}
</script>

<main>
	<HomeTitle />
	<HomeActions onJoinGame={() => (showModal = true)} onNewGame={() => goto('/game')} />

	{#if showModal}
		<JoinGameModal onClose={() => (showModal = false)} onJoin={handleJoin} />
	{/if}

	<GitHubLink />
	<StorybookLink />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: 0;
	}
</style>
