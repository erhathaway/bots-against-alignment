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
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 4rem);
		max-width: 900px;
		display: flex;
		padding: 1.25rem 1.5rem;
		gap: 1rem;
		background: radial-gradient(
			ellipse at center,
			rgba(255, 255, 255, 0.7) 0%,
			rgba(255, 255, 255, 0.4) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		backdrop-filter: blur(12px);
		border-radius: var(--radius-lg);
		z-index: 120;
	}


	.message-input {
		flex: 1;
		padding: 0.875rem 1.25rem;
		border: 1px solid rgba(0, 0, 0, 0.4);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		background: #ffffff;
		outline: none;
		transition: all 220ms var(--ease);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.15),
			0 4px 12px rgba(0, 0, 0, 0.12),
			0 2px 4px rgba(0, 0, 0, 0.08);
	}

	.message-input:focus {
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.message-input::placeholder {
		color: var(--color-text-muted);
	}

	.send-button {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.875rem 2rem;
		border: 1px solid rgba(0, 0, 0, 0.5);
		background: #000000;
		color: #ffffff;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 220ms var(--ease);
		box-shadow:
			0 12px 48px rgba(0, 0, 0, 0.2),
			0 6px 16px rgba(0, 0, 0, 0.15),
			0 2px 6px rgba(0, 0, 0, 0.1);
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-width: 140px;
		justify-content: center;
	}

	/* Yellow indicator dot */
	.send-button::before {
		content: '';
		width: 6px;
		height: 6px;
		background: var(--color-accent);
		border-radius: 50%;
		box-shadow: 0 0 6px rgba(230, 200, 50, 0.6);
		transition: all 220ms var(--ease);
		flex-shrink: 0;
	}

	.send-button:hover {
		background: #ffffff;
		color: #000000;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.send-button:hover::before {
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.8);
		background: #f0d840;
	}

	.send-button:active {
		transform: scale(0.97);
		box-shadow: var(--glow-accent-strong);
	}

	p {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		text-align: center;
		padding: 1rem;
		letter-spacing: 0.03em;
	}
</style>
