<script lang="ts">
	import GameLink from './GameLink.svelte';
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
				color="#FFFF00"
				><path
					d="M2 8l9.732-4.866a.6.6 0 01.536 0L22 8M20 11v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8"
					stroke="#FFFF00"
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
		background: none;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
	}

	#home {
		position: fixed;
		top: 0;
		left: 0;
		font: inherit;
		padding: 0.5rem;
		margin: 0.5rem;
		height: 24px;
		width: 24px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		background-color: black;
		border-radius: 5rem;
		border: 2px solid black;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	#home:hover {
		background-color: rgb(123, 255, 0);
		border: 2px solid black;
	}
</style>
