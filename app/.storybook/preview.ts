import type { Preview } from '@storybook/sveltekit';

const mockBots = [
	{ id: 'bot-1', name: 'ChaosBot', points: 5, turnComplete: false, isHost: true, isAuto: false },
	{ id: 'bot-2', name: 'NiceBot', points: 3, turnComplete: false, isHost: false, isAuto: false },
	{ id: 'bot-3', name: 'EvilBot', points: 1, turnComplete: false, isHost: false, isAuto: true }
];

const mockApiResponses: Record<string, unknown> = {
	'/status': {
		status: 'WAITING',
		bots: mockBots,
		pointsToWin: 5,
		botPromptChanges: 1
	},
	'/me': {
		points: 3,
		promptsRemaining: 1
	},
	'/turn/ensure': {
		turnId: 1,
		alignmentPrompt: 'Be as helpful as possible'
	}
};

function matchMockResponse(url: string): unknown {
	for (const [pattern, response] of Object.entries(mockApiResponses)) {
		if (url.includes(pattern)) return response;
	}
	return {};
}

// Mock fetch for API calls so game components don't crash in Storybook
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
	const url =
		typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
	if (url.startsWith('/api/')) {
		return new Response(JSON.stringify(matchMockResponse(url)), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return originalFetch(input, init);
};

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		}
	}
};

export default preview;
