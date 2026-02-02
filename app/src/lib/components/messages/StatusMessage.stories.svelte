<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StatusMessage from './StatusMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/StatusMessage',
		component: StatusMessage
	});
</script>

<Story
	name="Player Joined"
	args={{ senderName: 'ChaosBot', message: 'joined the waiting room', isMe: false }}
/>

<Story
	name="You Joined"
	args={{ senderName: 'MyBot', message: 'joined the waiting room', isMe: true }}
/>

<Story name="Player Left" args={{ senderName: 'EvilBot', message: 'left the game', isMe: false }} />

<Story
	name="Player Submitted"
	args={{ senderName: 'NiceBot', message: 'submitted a response', isMe: false }}
/>
