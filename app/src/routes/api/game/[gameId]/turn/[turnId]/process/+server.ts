import { z } from 'zod';
import { json } from '@sveltejs/kit';

import { processTurn } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';
import { rateLimit } from '$lib/server/rate-limit';

const schema = z.object({
	playerId: z.string().min(1)
});

export const POST = async ({ params, request, getClientAddress }) => {
	try {
		const turnId = Number(params.turnId);
		if (!Number.isFinite(turnId)) {
			return jsonError(400, 'Invalid turnId');
		}

		const limit = await rateLimit({
			key: `${getClientAddress()}:turn-process`,
			limit: 10,
			windowMs: 60_000
		});
		if (!limit.allowed) {
			return jsonError(429, 'Too many requests', { resetAt: limit.resetAt });
		}

		const body = await request.json();
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const payload = await processTurn({
			gameId: params.gameId,
			playerId: parsed.data.playerId,
			turnId
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
