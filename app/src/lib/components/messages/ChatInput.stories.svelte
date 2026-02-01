<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ChatInput from './ChatInput.svelte';

	const { Story } = defineMeta({
		title: 'Messages/ChatInput',
		component: ChatInput
	});
</script>

<Story name="Joined" args={{ hasJoined: true }} />

<Story name="Not Joined" args={{ hasJoined: false }} />
