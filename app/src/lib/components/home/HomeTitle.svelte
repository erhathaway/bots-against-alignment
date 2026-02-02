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
		padding: 4rem 3rem 2rem;
		position: relative;
		z-index: 1;
	}

	h1 {
		font-size: clamp(2.5rem, 6vw, 5rem);
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #000000;
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		line-height: 1.1;
		text-align: center;
	}

	h1::after {
		content: '';
		display: block;
		width: 3rem;
		height: 2px;
		background: var(--color-accent);
		margin: 1rem auto 0;
		border-radius: 1px;
		box-shadow: var(--glow-accent-soft);
	}

	h2 {
		font-size: 0.85rem;
		font-weight: 500;
		letter-spacing: 0.25em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 1.25rem 0 0;
		text-align: center;
		font-family: var(--font-mono);
	}
</style>
