import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';

import { checkLLMAvailability } from '$lib/server/llm/health';
import { ensureDbBootstrapped } from '$lib/server/db/bootstrap';

if (dev) {
	checkLLMAvailability()
		.then(() => {
			console.log('[startup] LLM health check passed');
		})
		.catch((error) => {
			const reason = error instanceof Error ? error.message : String(error);
			console.error(`\n[FATAL] LLM health check failed: ${reason}`);
			console.error('Set OPENAI_API_KEY or enable MOCK_LLM=1.\n');
			process.exit(1);
		});
}

let dbReady: Promise<void> | null = null;

export const handle: Handle = async ({ event, resolve }) => {
	// Bootstrap the DB schema on first request (serverless cold start).
	// If this fails, API routes return a 503 with a useful message instead of a generic 500.
	if (!dbReady) {
		dbReady = ensureDbBootstrapped();
	}

	try {
		await dbReady;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('[db] bootstrap failed:', message);

		if (event.url.pathname.startsWith('/api/')) {
			return json({ error: 'Service unavailable', message }, { status: 503 });
		}

		// Non-API routes can surface the normal SvelteKit error page.
		throw error;
	}

	return resolve(event);
};
