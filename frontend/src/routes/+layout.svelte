<!-- __layout.svelte -->

<!-- 1. Using a `load` function, pass the current URL to the layout component as a prop -->
<script context="module">
	/** @type {import('@sveltejs/kit').Load} */
	// export const load = async ({ url }) => ({ props: { url } });
	export const load = async ({ url }) => ({
    props: {
      url: url.href
    }
  });
</script>

<script>
	import './styles.css';
	import Notification from './Notification.svelte';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import PageTransition from '$lib/PageTransition.svelte';
	export let url;

	inject({ mode: dev ? 'development' : 'production' });

	console.log('URL', url);
</script>

<div class="app">
	<Notification />
	<PageTransition {url}>
		<slot />
	</PageTransition>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
