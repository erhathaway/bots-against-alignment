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
		gap: 0.4rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-text);
		background: #ffffff;
		border: 1.5px solid var(--color-border-light);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-sm);
		transition: all 150ms var(--ease);
		z-index: 100;
		text-decoration: none;
	}

	.storybook-link:hover {
		border-color: var(--color-border);
		box-shadow: var(--shadow-md);
	}

	svg {
		flex-shrink: 0;
		width: 16px;
		height: 16px;
	}
</style>
