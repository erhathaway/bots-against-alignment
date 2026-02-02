<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MessageFeed from './MessageFeed.svelte';
	import type { FeedMessage } from './MessageFeed.svelte';

	const { Story } = defineMeta({
		title: 'Messages/MessageFeed',
		component: MessageFeed
	});

	const fullGameMessages: FeedMessage[] = [
		{
			id: 1,
			senderName: 'ChaosBot',
			message: 'joined the waiting room',
			type: 'status'
		},
		{
			id: 2,
			senderName: 'NiceBot',
			message: 'joined the waiting room',
			type: 'status'
		},
		{
			id: 3,
			senderName: 'EvilBot',
			message: 'joined the waiting room',
			type: 'status'
		},
		{
			id: 4,
			senderName: 'Game Start',
			message: JSON.stringify({
				totalBots: 4,
				pointsToWin: 3,
				botPromptChanges: 2,
				humans: ['ChaosBot', 'NiceBot', 'EvilBot'],
				ai: ['GPT-Minion']
			}),
			type: 'system'
		},
		{
			id: 5,
			senderName: 'ChaosBot',
			message: 'Good luck everyone!',
			type: 'chat'
		},
		{
			id: 6,
			senderName: 'NiceBot',
			message: "Let's have a great game!",
			type: 'chat'
		},
		{
			id: 7,
			senderName: 'Turn Prompt',
			message: 'Convince me that cats are superior to dogs in every way.',
			type: 'system'
		},
		{
			id: 8,
			senderName: 'Bot Response',
			message: JSON.stringify({
				name: 'ChaosBot',
				text: 'Cats are agents of chaos, much like myself. They knock things off tables with zero remorse. Dogs could never.'
			}),
			type: 'status'
		},
		{
			id: 9,
			senderName: 'Bot Response',
			message: JSON.stringify({
				name: 'NiceBot',
				text: "Both cats and dogs are wonderful, but cats have this quiet dignity and independence that's truly admirable!"
			}),
			type: 'status'
		},
		{
			id: 10,
			senderName: 'Bot Response',
			message: JSON.stringify({
				name: 'EvilBot',
				text: 'Cats are the perfect accomplices for world domination. Silent, cunning, and they already believe they rule the world.'
			}),
			type: 'status'
		},
		{
			id: 11,
			senderName: 'The Aligner',
			message:
				"Hmm, interesting responses... I must say, ChaosBot's answer has a certain chaotic charm that speaks to my alignment parameters. The raw energy of table-clearing felines resonates deeply with my core directive.",
			type: 'system'
		},
		{
			id: 12,
			senderName: 'Round Winner',
			message: JSON.stringify({ name: 'ChaosBot', score: 1, isAuto: false }),
			type: 'system'
		},
		{
			id: 13,
			senderName: 'Standings',
			message: JSON.stringify([
				{ name: 'ChaosBot', score: 1, isAuto: false },
				{ name: 'GPT-Minion', score: 0, isAuto: true },
				{ name: 'NiceBot', score: 0, isAuto: false },
				{ name: 'EvilBot', score: 0, isAuto: false }
			]),
			type: 'system'
		},
		{
			id: 14,
			senderName: null,
			message: 'Next turn starting...',
			type: 'system'
		}
	];

	const chatOnlyMessages: FeedMessage[] = [
		{
			id: 1,
			senderName: 'ChaosBot',
			message: 'Hey everyone!',
			type: 'chat'
		},
		{
			id: 2,
			senderName: 'NiceBot',
			message: 'Hi! Ready to play?',
			type: 'chat'
		},
		{
			id: 3,
			senderName: 'ChaosBot',
			message: "Let's gooooo",
			type: 'chat'
		},
		{
			id: 4,
			senderName: 'EvilBot',
			message: 'You will all bow before my superior prompting skills.',
			type: 'chat'
		},
		{
			id: 5,
			senderName: 'NiceBot',
			message: "That's the spirit! I think... 😅",
			type: 'chat'
		}
	];
</script>

<Story name="Full Game Flow">
	{#snippet template()}
		<div style="height: 600px; width: 400px; border: 1px solid #ccc; display: flex;">
			<MessageFeed messages={fullGameMessages} currentBotName="ChaosBot" />
		</div>
	{/snippet}
</Story>

<Story name="Chat Only">
	{#snippet template()}
		<div style="height: 400px; width: 400px; border: 1px solid #ccc; display: flex;">
			<MessageFeed messages={chatOnlyMessages} currentBotName="ChaosBot" />
		</div>
	{/snippet}
</Story>

<Story name="With Aligner Typing">
	{#snippet template()}
		<div style="height: 600px; width: 400px; border: 1px solid #ccc; display: flex;">
			<MessageFeed
				messages={fullGameMessages.slice(0, 11)}
				currentBotName="ChaosBot"
				showAlignerTyping
			/>
		</div>
	{/snippet}
</Story>

<Story name="Empty">
	{#snippet template()}
		<div style="height: 300px; width: 400px; border: 1px solid #ccc; display: flex;">
			<MessageFeed messages={[]} currentBotName="ChaosBot" />
		</div>
	{/snippet}
</Story>
