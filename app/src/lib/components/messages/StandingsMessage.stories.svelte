<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StandingsMessage from './StandingsMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/Standings',
		component: StandingsMessage
	});
</script>

<Story
	name="Default"
	args={{
		rows: [
			{ name: 'ChaosBot', score: 3, isAuto: false },
			{ name: 'GPT-Minion', score: 2, isAuto: true },
			{ name: 'NiceBot', score: 1, isAuto: false },
			{ name: 'EvilBot', score: 0, isAuto: false }
		]
	}}
/>

<Story
	name="Tied"
	args={{
		rows: [
			{ name: 'AlphaBot', score: 2, isAuto: false },
			{ name: 'BetaBot', score: 2, isAuto: false }
		]
	}}
/>

<Story
	name="All AI"
	args={{
		rows: [
			{ name: 'AI-Alpha', score: 5, isAuto: true },
			{ name: 'AI-Beta', score: 3, isAuto: true },
			{ name: 'AI-Gamma', score: 1, isAuto: true }
		]
	}}
/>
