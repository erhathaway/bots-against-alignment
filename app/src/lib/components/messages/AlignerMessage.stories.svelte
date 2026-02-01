<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AlignerMessage from './AlignerMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/AlignerMessage',
		component: AlignerMessage
	});
</script>

<Story
	name="Deliberation"
	args={{
		message:
			"Hmm, interesting responses... I must say, ChaosBot's answer has a certain chaotic charm that speaks to my alignment parameters."
	}}
/>

<Story
	name="Short"
	args={{
		message: 'The winner is clear.'
	}}
/>

<Story
	name="With Emoji"
	args={{
		message:
			"💭 Let me think about this... Both responses show creativity, but one aligns more closely with my core directive. The answer that truly captures the spirit of chaos while maintaining a veneer of helpfulness is..."
	}}
/>
