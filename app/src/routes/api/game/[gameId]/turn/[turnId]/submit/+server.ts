import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { submitTurn } from '$lib/server/game/service';
import { getClientAddressSafe, handleApiError, jsonError } from '$lib/server/http';
import { rateLimit } from '$lib/server/rate-limit';

const schema = z.object({
	playerId: z.string().min(1),
	suggestion: z.string().optional().default(''),
	responseText: z.string().min(1)
});

export const POST: RequestHandler = async (event) => {
	try {
		const turnId = Number(event.params.turnId);
		if (!Number.isFinite(turnId)) {
			return jsonError(400, 'Invalid turnId');
		}

		const limit = await rateLimit({
			key: `${getClientAddressSafe(event)}:${event.params.gameId}:turn-submit`,
			limit: 10,
			windowMs: 60_000
		});
		if (!limit.allowed) {
			return jsonError(429, 'Too many requests', {
				resetAt: limit.resetAt
			});
		}

		const body = await event.request.json();
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const payload = await submitTurn({
			gameId: event.params.gameId,
			playerId: parsed.data.playerId,
			turnId,
			suggestion: parsed.data.suggestion ?? '',
			responseText: parsed.data.responseText
		});

		return json(payload, {
			headers: {
				'X-RateLimit-Remaining': String(limit.remaining),
				'X-RateLimit-Reset': String(limit.resetAt)
			}
		});
	} catch (error) {
		return handleApiError(error);
	}
};
