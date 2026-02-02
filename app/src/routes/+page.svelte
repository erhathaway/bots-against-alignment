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
		position: relative;
		overflow: hidden;
	}

	/* Horizontal signal trace */
	main::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			transparent 10%,
			rgba(230, 200, 50, 0.15) 20%,
			rgba(230, 200, 50, 0.3) 35%,
			rgba(230, 200, 50, 0.08) 50%,
			rgba(230, 200, 50, 0.3) 65%,
			rgba(230, 200, 50, 0.15) 80%,
			transparent 90%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 0;
	}

	/* Vertical signal trace */
	main::after {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		width: 1px;
		height: 100%;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(230, 200, 50, 0.12) 15%,
			rgba(230, 200, 50, 0.06) 40%,
			transparent 50%,
			rgba(230, 200, 50, 0.06) 60%,
			rgba(230, 200, 50, 0.12) 85%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 0;
	}

	.bottom-links {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		gap: 0.625rem;
		z-index: 100;
	}
</style>
