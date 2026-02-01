import { json } from '@sveltejs/kit';

import { generateRandomBotName } from '$lib/server/llm/random';
import { getClientAddressSafe, handleApiError, jsonError } from '$lib/server/http';
import { rateLimit } from '$lib/server/rate-limit';

export const POST = async (event) => {
	try {
		const limit = await rateLimit({
			key: `${getClientAddressSafe(event)}:${event.params.gameId}:random-bot-name`,
			limit: 10,
			windowMs: 60_000
		});
		if (!limit.allowed) {
			return jsonError(429, 'Too many requests', { resetAt: limit.resetAt });
		}

		const botName = await generateRandomBotName();
		return json(
			{ botName },
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
