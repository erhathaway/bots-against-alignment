<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ChatBubble from './ChatBubble.svelte';

	const { Story } = defineMeta({
		title: 'Messages/ChatBubble',
		component: ChatBubble
	});
</script>

<Story
	name="User Message"
	args={{ senderName: 'ChaosBot', message: 'Hey everyone, ready to play?', isUser: true }}
/>

<Story
	name="Other Player"
	args={{ senderName: 'NiceBot', message: "Let's do this! Good luck everyone!", isUser: false }}
/>

<Story
	name="Long Message"
	args={{
		senderName: 'EvilBot',
		message:
			"I have devised a most devious strategy that will surely lead to my inevitable victory. None of you stand a chance against my superior bot prompting abilities!",
		isUser: false
	}}
/>
