<script lang="ts">
	import { getNameColor } from './utils';

	type Props = {
		senderName: string;
		message: string;
		isUser?: boolean;
	};

	let { senderName, message, isUser = false }: Props = $props();
</script>

<div class="message" class:user={isUser} class:other={!isUser}>
	<div class="message-part-top">{isUser ? 'You' : senderName}</div>
	<div class="message-part-bottom">
		<div class="message-icon" style="background-color: {getNameColor(senderName)};"></div>
		<div class="message-text">{message}</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.35rem 0.75rem;
	}

	.message-icon {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.message-part-top {
		font-size: 0.65rem;
		font-weight: 500;
		color: var(--color-text-muted);
		margin-bottom: 3px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.message-part-bottom {
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		gap: 0.4rem;
	}

	.message-text {
		padding: 0.5rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		line-height: 1.5;
		max-width: 280px;
	}

	.user {
		align-items: flex-start;
	}

	.other {
		align-items: flex-end;
	}

	.other .message-part-top {
		text-align: right;
	}

	.other .message-part-bottom {
		flex-direction: row-reverse;
	}
</style>
