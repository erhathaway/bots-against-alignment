<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AlignerTyping from './AlignerTyping.svelte';

	const { Story } = defineMeta({
		title: 'Messages/AlignerTyping',
		component: AlignerTyping
	});
</script>

<Story name="Default" />
