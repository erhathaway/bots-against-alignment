<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';
	import Notification from '$lib/components/Notification.svelte';
	import PageTransition from '$lib/components/PageTransition.svelte';

	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="app">
	<Notification />
	<PageTransition url={data.url}>
		{@render children()}
	</PageTransition>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
