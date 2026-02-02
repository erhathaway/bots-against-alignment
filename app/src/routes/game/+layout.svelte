<script lang="ts">
	import GameLink from '$lib/components/game/GameLink.svelte';

	let { children } = $props();
</script>

<div class="app">
	{@render children()}
	<div id="game-link-container">
		<GameLink />
	</div>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		align-items: center;
	}

	#game-link-container {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 99;
	}
</style>
