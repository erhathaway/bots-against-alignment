<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LoadingSpinner from './LoadingSpinner.svelte';

	const { Story } = defineMeta({
		title: 'Game/LoadingSpinner',
		component: LoadingSpinner
	});
</script>

<Story name="Default" />
