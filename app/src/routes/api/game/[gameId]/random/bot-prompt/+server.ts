import { json } from '@sveltejs/kit';

import { generateRandomBotPrompt } from '$lib/server/llm/random';
import { handleApiError, jsonError } from '$lib/server/http';
import { rateLimit } from '$lib/server/rate-limit';

export const POST = async ({ getClientAddress }) => {
	try {
		const limit = await rateLimit({
			key: `${getClientAddress()}:random-bot-prompt`,
			limit: 10,
			windowMs: 60_000
		});
		if (!limit.allowed) {
			return jsonError(429, 'Too many requests', { resetAt: limit.resetAt });
		}

		const botPrompt = await generateRandomBotPrompt();
		return json(
			{ botPrompt },
			{
				headers: {
					'X-RateLimit-Remaining': String(limit.remaining),
					'X-RateLimit-Reset': String(limit.resetAt)
				}
			}
		);
	} catch (error) {
		return handleApiError(error);
	}
};
