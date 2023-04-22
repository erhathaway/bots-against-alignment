<script>
	import './styles.css';
	import Notification from './Notification.svelte';

</script>

<div class="app">
	<Notification />
	<slot />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
