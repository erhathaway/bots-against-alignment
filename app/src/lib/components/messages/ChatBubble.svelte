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
		margin: 0.6rem;
		flex-direction: column;
	}

	.message-icon {
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.message-part-top {
		margin-bottom: 5px;
		font-size: 10px;
	}

	.message-part-bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.message-text {
		padding: 10px;
		background-color: #eee;
		border-radius: 5px;
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
	}

	.user {
		justify-content: flex-start;
	}

	.other {
		justify-content: flex-end;
	}

	.other .message-part-top {
		text-align: right;
	}

	.other .message-part-bottom {
		flex-direction: row-reverse;
	}
</style>
