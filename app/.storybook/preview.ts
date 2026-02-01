import type { Preview } from '@storybook/sveltekit';

// Mock fetch for API calls so game components don't crash in Storybook
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
	if (url.startsWith('/api/')) {
		return new Response(JSON.stringify({}), {
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
