<script lang="ts">
	type Props = {
		title: string;
		subtitle?: string;
	};

	let { title, subtitle }: Props = $props();
</script>

<div class="announcement">
	<div class="announcement-title">{title}</div>
	{#if subtitle}
		<div class="announcement-divider"></div>
		<div class="announcement-subtitle">{subtitle}</div>
	{/if}
</div>

<style>
	.announcement {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0.75rem;
	}

	.announcement-title {
		font-size: 3rem;
		font-weight: 900;
		color: #000000;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		font-family: 'Helvetica Neue', 'Arial Black', sans-serif;
		text-align: center;
		line-height: 1;
		position: relative;
		display: inline-block;
		padding: 0 1.5rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		z-index: 2;
	}

	.announcement-title::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translateX(-50%);
		width: 100vw;
		height: 2px;
		background: linear-gradient(
			to right,
			transparent 0%,
			rgba(0, 0, 0, 0.15) 20%,
			rgba(0, 0, 0, 0.15) 35%,
			transparent 45%,
			transparent 55%,
			rgba(0, 0, 0, 0.15) 65%,
			rgba(0, 0, 0, 0.15) 80%,
			transparent 100%
		);
		z-index: -1;
	}

	.announcement-divider {
		width: 80px;
		height: 3px;
		background: var(--color-accent);
		border-radius: 2px;
	}

	.announcement-subtitle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.95rem;
		color: rgba(0, 0, 0, 0.7);
		text-align: center;
		font-family: var(--font-sans);
		font-weight: 500;
		flex-wrap: wrap;
		justify-content: center;
	}

	.announcement-subtitle :global(strong) {
		color: #000000;
		font-weight: 700;
	}

	@media (max-width: 768px) {
		.announcement {
			margin: 1.5rem 0.75rem;
		}

		.announcement-title {
			font-size: 2.25rem;
		}

		.announcement-divider {
			width: 60px;
			height: 2px;
		}

		.announcement-subtitle {
			font-size: 0.85rem;
			gap: 0.5rem;
		}
	}
</style>
