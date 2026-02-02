<script lang="ts">
	type Props = {
		senderName: string;
		message: string;
		isMe?: boolean;
	};

	let { senderName, message, isMe = false }: Props = $props();
</script>

<div class="message status">
	<div class="message-status-container">
		<div class="message-text name" class:you={isMe}>
			{isMe ? 'You' : senderName}
		</div>
		<div class="message-text text">{message}</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.35rem 0.75rem;
	}

	.status {
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.message-status-container {
		display: inline-flex;
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-pill);
		padding: 0.2rem 0.75rem;
		gap: 0.35rem;
	}

	.name {
		font-weight: 600;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-secondary);
	}

	.name.you {
		color: var(--color-accent-text);
	}

	.text {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}
</style>
