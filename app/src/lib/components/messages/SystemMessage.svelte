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
		margin: 0.6rem;
		flex-direction: column;
	}

	.system {
		justify-content: center;
		align-items: center;
	}

	.message-part-bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.message-text {
		border-radius: 5px;
		font-size: 13px;
		margin-right: 0.4rem;
		margin-left: 0.4rem;
		padding: 0.3rem;
		background-color: #ecffe2;
		color: rgb(98, 98, 98);
	}
</style>
