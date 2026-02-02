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

	<div class="bottom-links">
		<GitHubLink />
		<StorybookLink />
		<StorybookLink href="http://127.0.0.1:6006" label="Storybook Dev" />
	</div>
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

	.bottom-links {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		gap: 0.5rem;
		z-index: 100;
	}
</style>
