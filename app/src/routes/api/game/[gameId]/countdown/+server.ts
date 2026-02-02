import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { startCountdown } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

const schema = z.object({
	creatorId: z.string().min(1)
});

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const payload = await startCountdown({
			gameId: params.gameId,
			creatorId: parsed.data.creatorId
		});
		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
