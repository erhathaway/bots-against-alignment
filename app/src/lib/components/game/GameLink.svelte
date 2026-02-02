<script lang="ts">
	import { browser } from '$app/environment';
	import { globalState } from '$lib/state/store.svelte';

	let gameLink = $state('');

	$effect(() => {
		if (!browser) return;
		const currentGameId = globalState.game_id;
		if (!currentGameId) return;

		const url = new URL(window.location.href);
		if (!url.searchParams.get('game_id')) {
			url.searchParams.set('game_id', currentGameId);
		}
		gameLink = url.toString();
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function truncateGameId(id: string | null): string {
		if (!id) return '';
		if (id.length <= 12) return id;
		return `${id.slice(0, 6)}...${id.slice(-4)}`;
	}
</script>

<button type="button" class="game-link" onclick={() => copyToClipboard(gameLink)}>
	<h2>Game # {truncateGameId(globalState.game_id)}</h2>
	<div id="link-icon">
		<div id="link-vertical-rule"></div>
		<svg
			width="24px"
			height="24px"
			stroke-width="1.5"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			color="#000000"
			><path
				d="M14 11.998C14 9.506 11.683 7 8.857 7H7.143C4.303 7 2 9.238 2 11.998c0 2.378 1.71 4.368 4 4.873a5.3 5.3 0 001.143.124"
				stroke="#D4A843"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/><path
				d="M10 11.998c0 2.491 2.317 4.997 5.143 4.997h1.714c2.84 0 5.143-2.237 5.143-4.997 0-2.379-1.71-4.37-4-4.874A5.304 5.304 0 0016.857 7"
				stroke="#D4A843"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/></svg
		>
	</div>
</button>

<style>
	.game-link {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		border: 2px solid #000000;
		border-radius: var(--radius-lg);
		padding: 0.75rem 1.25rem;
		background: white;
		color: var(--color-text);
		font: inherit;
		cursor: pointer;
		box-shadow: var(--shadow-md);
		transition: all 220ms var(--ease);
		text-align: left;
	}

	.game-link:hover {
		background: #000000;
		border-color: var(--color-accent);
		box-shadow: var(--glow-accent-md);
	}

	.game-link:hover h2 {
		color: #ffffff;
	}

	.game-link:hover svg path {
		stroke: var(--color-accent);
	}

	.game-link:active {
		transform: scale(0.97);
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--font-mono);
		color: var(--color-text);
		letter-spacing: 0.02em;
		transition: color 220ms var(--ease);
	}

	#link-icon {
		display: flex;
		align-items: center;
	}

	#link-vertical-rule {
		width: 1.5px;
		height: 20px;
		background: var(--color-border);
		margin-right: 0.75rem;
	}

	svg path {
		transition: stroke 220ms var(--ease);
	}
</style>
