
<script context="module" lang="ts">
	/** @type {import('@sveltejs/kit').Load} */
	export const load = async ({ url }: { url: URL}) => ({
    props: {
      url: url.href
    }
  });
</script>

<script lang="ts">
	import './styles.css';
	import Notification from './Notification.svelte';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import PageTransition from '$lib/PageTransition.svelte';
	export let url: string;

	const enableAnalytics = import.meta.env.VITE_ENABLE_VERCEL_ANALYTICS === 'true';
	if (enableAnalytics) {
		inject({ mode: dev ? 'development' : 'production' });
	}

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
