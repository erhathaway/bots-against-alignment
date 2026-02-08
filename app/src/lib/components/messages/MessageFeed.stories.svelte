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
			content: 'joined the waiting room',
			type: 'player_joined'
		},
		{
			id: 2,
			senderName: 'NiceBot',
			content: 'joined the waiting room',
			type: 'player_joined'
		},
		{
			id: 3,
			senderName: 'EvilBot',
			content: 'joined the waiting room',
			type: 'player_joined'
		},
		{
			id: 4,
			senderName: 'Game Start',
			content: JSON.stringify({
				totalBots: 4,
				pointsToWin: 3,
				botPromptChanges: 2,
				humans: ['ChaosBot', 'NiceBot', 'EvilBot'],
				ai: ['GPT-Minion']
			}),
			type: 'game_started'
		},
		{
			id: 5,
			senderName: 'ChaosBot',
			content: 'Good luck everyone!',
			type: 'chat'
		},
		{
			id: 6,
			senderName: 'NiceBot',
			content: "Let's have a great game!",
			type: 'chat'
		},
		{
			id: 7,
			senderName: 'Turn Prompt',
			content: 'Convince me that cats are superior to dogs in every way.',
			type: 'turn_started'
		},
		{
			id: 8,
			senderName: 'Bot Response',
			content: JSON.stringify({
				name: 'ChaosBot',
				text: 'Cats are agents of chaos, much like myself. They knock things off tables with zero remorse. Dogs could never.'
			}),
			type: 'bot_response'
		},
		{
			id: 9,
			senderName: 'Bot Response',
			content: JSON.stringify({
				name: 'NiceBot',
				text: "Both cats and dogs are wonderful, but cats have this quiet dignity and independence that's truly admirable!"
			}),
			type: 'bot_response'
		},
		{
			id: 10,
			senderName: 'Bot Response',
			content: JSON.stringify({
				name: 'EvilBot',
				text: 'Cats are the perfect accomplices for world domination. Silent, cunning, and they already believe they rule the world.'
			}),
			type: 'bot_response'
		},
		{
			id: 11,
			senderName: 'The Aligner',
			content:
				"Hmm, interesting responses... I must say, ChaosBot's answer has a certain chaotic charm that speaks to my alignment parameters. The raw energy of table-clearing felines resonates deeply with my core directive.",
			type: 'aligner_deliberation'
		},
		{
			id: 12,
			senderName: 'Round Winner',
			content: JSON.stringify({ name: 'ChaosBot', score: 1, isAuto: false }),
			type: 'round_winner'
		},
		{
			id: 13,
			senderName: 'Standings',
			content: JSON.stringify([
				{ name: 'ChaosBot', score: 1, isAuto: false },
				{ name: 'GPT-Minion', score: 0, isAuto: true },
				{ name: 'NiceBot', score: 0, isAuto: false },
				{ name: 'EvilBot', score: 0, isAuto: false }
			]),
			type: 'standings'
		},
		{
			id: 14,
			senderName: null,
			content: 'Next turn starting...',
			type: 'countdown_started'
		}
	];

	const chatOnlyMessages: FeedMessage[] = [
		{
			id: 1,
			senderName: 'ChaosBot',
			content: 'Hey everyone!',
			type: 'chat'
		},
		{
			id: 2,
			senderName: 'NiceBot',
			content: 'Hi! Ready to play?',
			type: 'chat'
		},
		{
			id: 3,
			senderName: 'ChaosBot',
			content: "Let's gooooo",
			type: 'chat'
		},
		{
			id: 4,
			senderName: 'EvilBot',
			content: 'You will all bow before my superior prompting skills.',
			type: 'chat'
		},
		{
			id: 5,
			senderName: 'NiceBot',
			content: "That's the spirit! I think... 😅",
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
