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
		margin: 0.6rem;
		flex-direction: column;
	}

	.bot-response {
		flex-direction: row;
		align-items: flex-start;
		gap: 0.4rem;
	}

	.bot-response.mine {
		justify-content: flex-start;
	}

	.bot-response.theirs {
		justify-content: flex-end;
	}

	.bot-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.bot-avatar-face {
		font-size: 16px;
		line-height: 1;
	}

	.bot-response-body {
		display: flex;
		flex-direction: column;
		max-width: 70%;
	}

	.bot-response-name {
		font-size: 10px;
		font-weight: bold;
		margin-bottom: 2px;
		color: #555;
	}

	.bot-response.mine .bot-response-name {
		color: #0066cc;
	}

	.bot-response.theirs .bot-response-name {
		text-align: right;
	}

	.bot-response-text {
		padding: 0.5rem 0.75rem;
		border-radius: 12px;
		font-size: 13px;
		line-height: 1.4;
		background: #f0f0f0;
		color: #222;
	}

	.bot-response.mine .bot-response-text {
		border-top-left-radius: 4px;
		background: #e8f5e9;
	}

	.bot-response.theirs .bot-response-text {
		border-top-right-radius: 4px;
		background: #f0f0f0;
	}
</style>
