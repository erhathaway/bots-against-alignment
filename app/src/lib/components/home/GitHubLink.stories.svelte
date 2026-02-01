<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GitHubLink from './GitHubLink.svelte';

	const { Story } = defineMeta({
		title: 'Home/GitHubLink',
		component: GitHubLink
	});
</script>

<Story name="Default" />
<Story name="Custom Href" args={{ href: '#' }} />
