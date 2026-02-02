<script lang="ts">
	type Props = {
		message: string;
	};

	let { message }: Props = $props();
</script>

<div class="message system">
	<div class="message-part-bottom">
		<div class="message-text">{message}</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.35rem 0.75rem;
	}

	.system {
		align-items: center;
	}

	.message-part-bottom {
		display: flex;
		align-items: center;
	}

	.message-text {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		padding: 0.25rem 0.75rem;
		background: transparent;
		border: none;
		font-style: italic;
	}
</style>
