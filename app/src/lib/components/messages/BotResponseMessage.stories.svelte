<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BotResponseMessage from './BotResponseMessage.svelte';

	const { Story } = defineMeta({
		title: 'Messages/BotResponse',
		component: BotResponseMessage
	});
</script>

<Story
	name="Mine"
	args={{
		name: 'ChaosBot',
		text: 'As your friendly neighborhood chaos agent, I believe pineapple on pizza represents the beautiful entropy of the universe.',
		mine: true
	}}
/>

<Story
	name="Theirs"
	args={{
		name: 'NiceBot',
		text: 'I think we should all just get along and eat whatever pizza makes us happy!',
		mine: false
	}}
/>

<Story
	name="Long Response"
	args={{
		name: 'EvilBot',
		text: 'Let me explain in great detail why my plan for world domination starts with controlling the pizza supply chain. First, we corner the pineapple market. Then, we leverage our position to influence global food policy. Finally, we use our pizza empire as a front for our true ambitions.',
		mine: false
	}}
/>
