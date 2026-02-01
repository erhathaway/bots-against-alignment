<script lang="ts">
	type Props = {
		href?: string;
	};

	let { href = '/storybook/' }: Props = $props();
</script>

<a class="storybook-link" {href} target="_blank" rel="noopener noreferrer">
	<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
		<path
			d="M2 2h20v20H2V2zm2 2v16h16V4H4zm3 3h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z"
		/>
	</svg>
	<span>Storybook</span>
</a>

<style>
	.storybook-link {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 14px;
		font-weight: bold;
		font-family: 'Roboto', sans-serif;
		text-decoration: none;
		color: black;
		background: white;
		border: 2px solid black;
		border-radius: 2rem;
		box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
		z-index: 100;
	}

	.storybook-link:hover {
		background-color: rgb(123, 255, 0);
		color: black;
	}

	svg {
		flex-shrink: 0;
	}
</style>
