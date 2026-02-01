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
		margin: 0.6rem;
		flex-direction: column;
	}

	.status {
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.message-status-container {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		background-color: #e2f1ff;
		border-radius: 5px;
		padding: 0.3rem;
	}

	.name {
		font-weight: bold;
		font-size: 10px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
	}

	.name.you {
		color: #0066cc;
	}

	.text {
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
		color: rgb(98, 98, 98);
	}
</style>
