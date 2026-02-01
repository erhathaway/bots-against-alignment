<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SystemMessage from './SystemMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/SystemMessage',
		component: SystemMessage
	});
</script>

<Story name="Game Over" args={{ message: 'Game over! ChaosBot wins!' }} />

<Story name="Host Transfer" args={{ message: 'Host has been transferred to NiceBot.' }} />

<Story name="Countdown" args={{ message: 'The game will start in 5 seconds...' }} />
