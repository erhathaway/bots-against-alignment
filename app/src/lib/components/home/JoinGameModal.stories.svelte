<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import JoinGameModal from './JoinGameModal.svelte';

	const { Story } = defineMeta({
		title: 'Home/JoinGameModal',
		component: JoinGameModal
	});
</script>

<Story name="Default" />
