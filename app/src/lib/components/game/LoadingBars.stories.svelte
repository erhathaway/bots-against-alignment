<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LoadingBars from './LoadingBars.svelte';

	const { Story } = defineMeta({
		title: 'Game/LoadingBars',
		component: LoadingBars
	});
</script>

<Story name="Default" />
