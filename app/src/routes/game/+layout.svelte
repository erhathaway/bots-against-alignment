<script lang="ts">
	import GameLink from '$lib/components/game/GameLink.svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();
</script>

<div class="app">
	<div>
		<button id="home" type="button" aria-label="Go to home" onclick={() => goto('/')}>
			<svg
				width="18px"
				height="18px"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				color="#D4A843"
				><path
					d="M2 8l9.732-4.866a.6.6 0 01.536 0L22 8M20 11v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8"
					stroke="#D4A843"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/></svg
			>
		</button>
		<div id="header">
			<GameLink />
		</div>
	</div>
	{@render children()}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		align-items: center;
	}

	#header {
		position: fixed;
		top: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.75rem;
		z-index: 50;
	}

	#home {
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		width: 36px;
		height: 36px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		background: #000000;
		border: 2px solid #000000;
		border-radius: 50%;
		box-shadow: var(--shadow-sm);
		transition: all 150ms var(--ease);
		z-index: 50;
	}

	#home:hover {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
