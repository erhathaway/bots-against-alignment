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
		margin: 0.6rem;
		flex-direction: column;
	}

	.aligner {
		flex-direction: row;
		justify-content: flex-start;
		align-items: flex-start;
	}

	.message-aligner-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background-color: #ffe2f5;
		border-radius: 5px;
		padding: 0.5rem;
		border-left: 3px solid #ff00aa;
		max-width: 85%;
	}

	.typing-dots {
		display: flex;
		gap: 4px;
		padding: 6px 10px;
		align-items: center;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #ff00aa;
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
