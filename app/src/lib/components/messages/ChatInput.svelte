<script lang="ts">
	type Props = {
		hasJoined?: boolean;
		onSend?: (message: string) => void;
	};

	let { hasJoined = true, onSend }: Props = $props();

	let inputText = $state('');

	function send() {
		if (inputText.trim() === '') return;
		onSend?.(inputText);
		inputText = '';
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			send();
		}
	}
</script>

{#if hasJoined}
	<div class="input-container">
		<input
			class="message-input"
			type="text"
			placeholder="Type your message..."
			bind:value={inputText}
			onkeydown={handleKeyPress}
		/>
		<button class="send-button" onclick={send}>Send</button>
	</div>
{:else}
	<div class="input-container">
		<p>Join the game to chat!</p>
	</div>
{/if}

<style>
	.input-container {
		display: flex;
		padding: 10px;
	}

	.message-input {
		flex: 1;
		padding: 5px 10px;
		margin-left: 1rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
		width: 100%;
	}

	.send-button {
		border-radius: 2rem;
		font-size: 1.5rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		margin: 0.5rem 0.5rem;
		cursor: pointer;
		border: 2px solid rgb(0, 0, 0);
		background-color: rgb(0, 0, 0);
		color: white;
		box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.send-button:hover {
		background-color: rgb(123, 255, 0);
		color: rgb(0, 0, 0);
		border: 2px solid black;
	}
</style>
