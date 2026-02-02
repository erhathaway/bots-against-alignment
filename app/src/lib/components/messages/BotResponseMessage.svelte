<script lang="ts">
	import { getNameColor } from './utils';

	type Props = {
		name: string;
		text: string;
		mine?: boolean;
	};

	let { name, text, mine = false }: Props = $props();
</script>

<div class="message bot-response" class:mine class:theirs={!mine}>
	{#if mine}
		<div class="bot-avatar" style="background-color: {getNameColor(name)};">
			<span class="bot-avatar-face">&#x1F916;</span>
		</div>
		<div class="bot-response-body">
			<div class="bot-response-name">You</div>
			<div class="bot-response-text">{text}</div>
		</div>
	{:else}
		<div class="bot-response-body">
			<div class="bot-response-name">{name}</div>
			<div class="bot-response-text">{text}</div>
		</div>
		<div class="bot-avatar" style="background-color: {getNameColor(name)};">
			<span class="bot-avatar-face">&#x1F916;</span>
		</div>
	{/if}
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		margin: 0.35rem 0.75rem;
	}

	.bot-response {
		flex-direction: row;
		align-items: flex-start;
		gap: 0.35rem;
	}

	.bot-response.mine {
		justify-content: flex-start;
	}

	.bot-response.theirs {
		justify-content: flex-end;
	}

	.bot-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bot-avatar-face {
		font-size: 14px;
		line-height: 1;
	}

	.bot-response-body {
		display: flex;
		flex-direction: column;
		max-width: 65%;
	}

	.bot-response-name {
		font-size: 0.6rem;
		font-weight: 600;
		margin-bottom: 2px;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.bot-response.mine .bot-response-name {
		color: var(--color-accent-text);
	}

	.bot-response.theirs .bot-response-name {
		text-align: right;
	}

	.bot-response-text {
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		line-height: 1.5;
		border: 1px solid var(--color-border-light);
	}

	.bot-response.mine .bot-response-text {
		border-top-left-radius: 3px;
		background: var(--color-accent-light);
		border-color: var(--color-accent);
	}

	.bot-response.theirs .bot-response-text {
		border-top-right-radius: 3px;
		background: var(--color-surface);
	}
</style>
