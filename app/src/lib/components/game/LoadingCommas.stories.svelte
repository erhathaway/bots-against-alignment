<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LoadingCommas from './LoadingCommas.svelte';

	const { Story } = defineMeta({
		title: 'Game/LoadingCommas',
		component: LoadingCommas
	});
</script>

<Story name="Default" />
