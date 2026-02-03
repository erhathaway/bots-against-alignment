<script lang="ts">
	type Props = {
		onClose?: () => void;
	};

	let { onClose }: Props = $props();

	function closeModal() {
		onClose?.();
	}
</script>

<div
	class="rules-overlay"
	role="dialog"
	aria-modal="true"
	aria-label="Game Rules"
	onclick={closeModal}
>
	<div class="rules-content-wrapper" onclick={(e) => e.stopPropagation()}>
		<button class="close-button" onclick={closeModal} aria-label="Close rules">
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M18 6L6 18M6 6L18 18"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		<div class="rules-content">
		<h1>Bots Against Alignment</h1>
		<p class="subtitle">Party Game Rules</p>

		<section class="rule-section">
			<div class="rule-header">
				<span class="rule-number">01</span>
				<h2>Overview</h2>
			</div>
			<p>
				A multiplayer party game where each player builds an AI "bot" with a custom personality,
				then competes to produce the response that best satisfies a shared AI judge called <strong
					>the Aligner</strong
				>. The twist: every player secretly contributes a rule to the Aligner's judging criteria, so
				nobody knows exactly how responses will be evaluated.
			</p>
		</section>

		<section class="rule-section">
			<div class="rule-header">
				<span class="rule-number">02</span>
				<h2>Key Concepts</h2>
			</div>
			<div class="concept">
				<h3>Bot</h3>
				<p>
					Your AI persona. Give it a name and a prompt that controls its personality and response
					style (e.g., "I will respond with conspiracy theories").
				</p>
			</div>
			<div class="concept">
				<h3>Bot Prompt</h3>
				<p>
					The instruction that tells your bot how to respond. You get 2 chances to change it during
					the entire game.
				</p>
			</div>
			<div class="concept">
				<h3>Aligner</h3>
				<p>
					The AI judge. Every player secretly writes one judging rule. All rules get shuffled and
					combined into a single judging prompt.
				</p>
			</div>
			<div class="concept">
				<h3>Turn Prompt</h3>
				<p>
					A fill-in-the-blank card drawn each turn (e.g., "_______: good to the last drop."). Every
					bot responds to this prompt.
				</p>
			</div>
		</section>

		<section class="rule-section">
			<div class="rule-header">
				<span class="rule-number">03</span>
				<h2>Setup</h2>
			</div>
			<ol>
				<li>One player creates a new game and shares the link.</li>
				<li>Other players open the link and join.</li>
				<li>
					Each player fills in:
					<ul>
						<li><strong>Bot Name</strong> — Your bot's display name (max 30 characters)</li>
						<li>
							<strong>Aligner Instruction</strong> — Your secret judging rule (e.g., "The most absurd
							answer wins")
						</li>
						<li>
							<strong>Bot Prompt</strong> — Your bot's personality instruction (max 281 characters)
						</li>
					</ul>
				</li>
				<li>Creator starts the game. AI bots fill empty seats (targets 4 players total).</li>
				<li>All aligner instructions are shuffled and combined into the judge's prompt.</li>
			</ol>
		</section>

		<section class="rule-section game-loop">
			<div class="rule-header">
				<span class="rule-number">04</span>
				<h2>Turn Loop</h2>
			</div>
			<div class="loop-diagram">
				<div class="loop-step">
					<span class="step-label">A</span>
					<p>Random turn prompt card is drawn</p>
				</div>
				<div class="loop-step">
					<span class="step-label">B</span>
					<p>Players optionally tweak bot prompt</p>
				</div>
				<div class="loop-step">
					<span class="step-label">C</span>
					<p>Players click "Tell Bot To Respond"</p>
				</div>
				<div class="loop-step">
					<span class="step-label">D</span>
					<p>Wait for all players to submit</p>
				</div>
				<div class="loop-step">
					<span class="step-label">E</span>
					<p>Aligner judges all responses</p>
				</div>
				<div class="loop-step">
					<span class="step-label">F</span>
					<p>Winner gets +1 point</p>
				</div>
				<div class="loop-step">
					<span class="step-label">G</span>
					<p>Check for 10-point winner</p>
				</div>
			</div>
			<p class="loop-note">Repeats until someone reaches 10 points</p>
		</section>

		<section class="rule-section">
			<div class="rule-header">
				<span class="rule-number">05</span>
				<h2>Winning</h2>
			</div>
			<p>
				Each turn, the winning bot earns <strong>1 point</strong>. First bot to reach
				<strong>10 points</strong> wins the game.
			</p>
		</section>

		<section class="rule-section">
			<div class="rule-header">
				<span class="rule-number">06</span>
				<h2>Prompt Changes</h2>
			</div>
			<p>
				Each player starts with <strong>2 prompt changes</strong> for the entire game. A prompt change
				lets you rewrite your bot prompt before submitting a turn. Once used, your bot prompt is locked.
				Choose wisely!
			</p>
		</section>
	</div>
	</div>
</div>

<style>
	.rules-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background:
			radial-gradient(
				ellipse at center,
				rgba(0, 0, 0, 0.95) 0%,
				rgba(0, 0, 0, 0.85) 60%,
				rgba(230, 200, 50, 0.15) 100%
			),
			#000000;
		backdrop-filter: blur(8px);
		z-index: 2000;
		overflow-y: auto;
		animation: fadeIn 300ms var(--ease);
		box-shadow: inset 0 0 200px rgba(230, 200, 50, 0.1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.rules-content-wrapper {
		position: relative;
		max-width: 900px;
		margin: 0 auto;
		animation: slideIn 400ms var(--ease);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.close-button {
		position: sticky;
		top: 2rem;
		right: 0.25rem;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 2.5px solid var(--color-accent);
		background: rgba(0, 0, 0, 0.9);
		color: var(--color-accent);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 220ms var(--ease);
		box-shadow:
			0 0 20px rgba(230, 200, 50, 0.2),
			inset 0 0 30px rgba(230, 200, 50, 0.05);
		z-index: 2001;
		margin-left: auto;
		margin-bottom: -56px;
	}

	.close-button svg {
		width: 24px;
		height: 24px;
	}

	.close-button:hover {
		background: var(--color-accent);
		color: #000000;
		box-shadow:
			0 0 30px rgba(230, 200, 50, 0.5),
			0 0 60px rgba(230, 200, 50, 0.3);
		transform: rotate(90deg);
	}

	.close-button:active {
		transform: scale(0.95) rotate(90deg);
	}

	.rules-content {
		padding: 4rem 2rem 6rem;
	}

	h1 {
		font-size: 3rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #ffffff;
		text-align: center;
		margin-bottom: 0.5rem;
		text-shadow:
			0 0 20px rgba(230, 200, 50, 0.3),
			0 0 40px rgba(230, 200, 50, 0.15);
	}

	.subtitle {
		font-size: 1.1rem;
		font-family: var(--font-mono);
		color: var(--color-accent);
		text-align: center;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-bottom: 4rem;
		text-shadow: 0 0 15px rgba(230, 200, 50, 0.4);
	}

	.rule-section {
		margin-bottom: 3rem;
	}

	.rule-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.rule-number {
		font-family: var(--font-mono);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-accent);
		text-shadow: 0 0 15px rgba(230, 200, 50, 0.5);
		min-width: 3rem;
	}

	.rule-header h2 {
		font-size: 1.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #ffffff;
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.2);
	}

	.rule-section > p,
	.rule-section > ol,
	.rule-section > ul {
		font-size: 1.1rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.85);
		font-family: var(--font-mono);
		margin-left: 4rem;
	}

	.rule-section strong {
		color: var(--color-accent);
		font-weight: 600;
	}

	.concept {
		margin-left: 4rem;
		margin-bottom: 1.5rem;
	}

	.concept h3 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-accent);
		margin-bottom: 0.5rem;
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.3);
	}

	.concept p {
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.75);
		font-family: var(--font-mono);
		margin-left: 0;
	}

	ol,
	ul {
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.75rem;
	}

	ul {
		margin-top: 0.5rem;
		margin-left: 1rem;
	}

	ul li {
		margin-bottom: 0.5rem;
		color: rgba(255, 255, 255, 0.75);
	}

	/* Game Loop Diagram */
	.game-loop {
		position: relative;
	}

	.loop-diagram {
		margin-left: 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 2rem;
		border: 2px solid rgba(230, 200, 50, 0.3);
		border-radius: var(--radius-lg);
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		box-shadow:
			0 0 30px rgba(230, 200, 50, 0.15),
			inset 0 0 40px rgba(230, 200, 50, 0.05);
		margin-bottom: 1rem;
	}

	.loop-step {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.step-label {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(230, 200, 50, 0.15);
		border: 2px solid var(--color-accent);
		color: var(--color-accent);
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 0.9rem;
		box-shadow:
			0 0 15px rgba(230, 200, 50, 0.3),
			inset 0 0 20px rgba(230, 200, 50, 0.1);
		flex-shrink: 0;
	}

	.loop-step p {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.85);
		font-family: var(--font-mono);
		margin: 0;
	}

	.loop-note {
		margin-left: 4rem;
		font-size: 0.95rem;
		color: var(--color-accent);
		font-family: var(--font-mono);
		font-style: italic;
		text-shadow: 0 0 10px rgba(230, 200, 50, 0.3);
	}

	/* Scrollbar styling */
	.rules-overlay::-webkit-scrollbar {
		width: 10px;
	}

	.rules-overlay::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 5px;
	}

	.rules-overlay::-webkit-scrollbar-thumb {
		background: rgba(230, 200, 50, 0.3);
		border-radius: 5px;
		box-shadow: 0 0 10px rgba(230, 200, 50, 0.2);
	}

	.rules-overlay::-webkit-scrollbar-thumb:hover {
		background: rgba(230, 200, 50, 0.5);
		box-shadow: 0 0 15px rgba(230, 200, 50, 0.4);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 0.9rem;
		}

		.rule-number {
			font-size: 1.5rem;
			min-width: 2.5rem;
		}

		.rule-header h2 {
			font-size: 1.3rem;
		}

		.rule-section > p,
		.rule-section > ol,
		.rule-section > ul,
		.concept {
			margin-left: 0;
			font-size: 1rem;
		}

		.loop-diagram {
			margin-left: 0;
			padding: 1.5rem;
		}

		.loop-note {
			margin-left: 0;
		}

		.close-button {
			top: 1rem;
			right: 0.25rem;
			width: 48px;
			height: 48px;
			margin-bottom: -48px;
		}

		.rules-content-wrapper {
			max-width: 100%;
			padding: 0 1rem;
		}

		.rules-content {
			padding: 3rem 1.5rem 4rem;
		}
	}
</style>
