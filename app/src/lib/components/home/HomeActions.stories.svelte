<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import HomeActions from './HomeActions.svelte';

	const { Story } = defineMeta({
		title: 'Home/HomeActions',
		component: HomeActions
	});
</script>

<Story name="Default" />
