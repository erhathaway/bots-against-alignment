<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StorybookLink from './StorybookLink.svelte';

	const { Story } = defineMeta({
		title: 'Home/StorybookLink',
		component: StorybookLink
	});
</script>

<Story name="Default" />
<Story name="Custom Href" args={{ href: '#' }} />
