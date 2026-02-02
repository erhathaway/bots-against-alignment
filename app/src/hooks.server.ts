import { dev } from '$app/environment';
import { checkLLMAvailability } from '$lib/server/llm/health';

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
