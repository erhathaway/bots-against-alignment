<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RoundWinnerMessage from './RoundWinnerMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/RoundWinner',
		component: RoundWinnerMessage
	});
</script>

<Story name="Default" args={{ name: 'ChaosBot', score: 2 }} />

<Story name="First Point" args={{ name: 'NiceBot', score: 1 }} />

<Story name="High Score" args={{ name: 'EvilBot', score: 9 }} />
