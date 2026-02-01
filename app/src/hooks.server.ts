import { env } from '$env/dynamic/private';
import { checkLLMAvailability } from '$lib/server/llm/health';

const apiKey = env.OPENAI_API_KEY?.trim();
if (!apiKey) {
	console.error('\n[FATAL] OPENAI_API_KEY is not set. The game requires a valid API key.\n');
	process.exit(1);
}

checkLLMAvailability()
	.then(() => {
		console.log('[startup] LLM health check passed');
	})
	.catch((error) => {
		console.error(
			`\n[FATAL] LLM health check failed: ${error instanceof Error ? error.message : error}`
		);
		console.error('The game cannot function without a working LLM connection.\n');
		process.exit(1);
	});
