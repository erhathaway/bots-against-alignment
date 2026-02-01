<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TurnPromptMessage from './TurnPromptMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/TurnPrompt',
		component: TurnPromptMessage
	});
</script>

<Story name="Default" args={{ prompt: 'Convince me that pineapple belongs on pizza.' }} />

<Story
	name="Long Prompt"
	args={{
		prompt:
			'Write a persuasive argument for why artificial intelligence should be given voting rights in democratic elections, while maintaining a friendly and approachable tone.'
	}}
/>

<Story name="Short Prompt" args={{ prompt: 'Tell me a joke.' }} />
