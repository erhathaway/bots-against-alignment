<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GameStartMessage from './GameStartMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/GameStart',
		component: GameStartMessage
	});
</script>

<Story
	name="Default"
	args={{
		pointsToWin: 3,
		botPromptChanges: 2,
		humans: ['ChaosBot', 'NiceBot', 'EvilBot'],
		ai: ['GPT-Minion']
	}}
/>

<Story
	name="All Humans"
	args={{
		pointsToWin: 5,
		botPromptChanges: 1,
		humans: ['AlphaBot', 'BetaBot'],
		ai: []
	}}
/>

<Story
	name="Many Players"
	args={{
		pointsToWin: 10,
		botPromptChanges: 3,
		humans: ['Bot-A', 'Bot-B', 'Bot-C'],
		ai: ['AI-1', 'AI-2', 'AI-3']
	}}
/>
