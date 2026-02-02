<script lang="ts">
	type Props = {
		title?: string;
		subtitle?: string;
	};

	let { title = 'Bots Against Alignment', subtitle = 'A turn-based multiplayer game' }: Props =
		$props();
</script>

<div class="text-container">
	<h1>{title}</h1>
	<h2>{subtitle}</h2>
</div>

<style>
	.text-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
	}

	h1 {
		font-size: clamp(2.5rem, 6vw, 5rem);
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #000000;
		margin: 0;
		font-family: system-ui, -apple-system, sans-serif;
		line-height: 1.1;
		text-align: center;
	}

	h2 {
		font-size: 1rem;
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
		margin: 1rem 0 0;
		text-align: center;
	}
</style>
