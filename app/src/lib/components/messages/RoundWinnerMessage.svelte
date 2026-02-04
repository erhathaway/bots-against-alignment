<script lang="ts">
	import AnnouncementTitle from './AnnouncementTitle.svelte';

	type Props = {
		name: string;
		score: number;
	};

	let { name, score }: Props = $props();

	const subtitle = `${name} • ${score} point${score === 1 ? '' : 's'}`;
</script>

<AnnouncementTitle title="Round Winner!" {subtitle} />
