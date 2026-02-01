<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import HomeTitle from './HomeTitle.svelte';

	const { Story } = defineMeta({
		title: 'Home/HomeTitle',
		component: HomeTitle
	});
</script>

<Story name="Default" />

<Story name="Custom Text" args={{ title: 'Custom Title', subtitle: 'A custom subtitle here' }} />
