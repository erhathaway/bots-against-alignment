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
		padding: 0.75rem;
		gap: 0.5rem;
		border-top: 1.5px solid var(--color-border-light);
	}

	.message-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1.5px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		outline: none;
		transition: border-color 150ms;
	}

	.message-input:focus {
		border-color: var(--color-accent);
	}

	.send-button {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.5rem 1rem;
		border: 1.5px solid var(--color-border);
		background: var(--color-text);
		color: white;
		border-radius: var(--radius-pill);
		cursor: pointer;
		transition: all 150ms var(--ease);
	}

	.send-button:hover {
		background: white;
		color: var(--color-text);
	}

	p {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: center;
		padding: 1rem;
	}
</style>
