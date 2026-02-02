<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import HomePage from './+page.svelte';

	const { Story } = defineMeta({
		title: 'Home/HomePage',
		component: HomePage
	});
</script>

<Story name="Default" />
