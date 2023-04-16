<script>
	import GameLink from './GameLink.svelte';
</script>

<div class="app">
	<div id="header">
		<GameLink />
	</div>
	<slot />
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
        /* width: 100vw; */
        background: none;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
		/* background-color: #f5f5f5; */
	}
</style>
