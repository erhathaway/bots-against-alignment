<div class="message aligner">
	<div class="message-aligner-container">
		<div class="typing-dots">
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
		</div>
	</div>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.35rem 0.75rem;
	}

	.aligner {
		flex-direction: row;
		justify-content: flex-start;
	}

	.message-aligner-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background: var(--color-accent-light);
		border-radius: var(--radius-md);
		padding: 0.5rem 0.75rem;
		border-left: 3px solid var(--color-accent);
		max-width: 85%;
	}

	.typing-dots {
		display: flex;
		gap: 5px;
		padding: 4px 8px;
		align-items: center;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-accent);
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.dot:nth-child(1) {
		animation-delay: 0s;
	}
	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0.4);
			opacity: 0.3;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
