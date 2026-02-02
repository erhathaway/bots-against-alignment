import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { submitAlignerPrompt } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

const schema = z.object({
	playerId: z.string().min(1),
	prompt: z.string().min(1)
});

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const payload = await submitAlignerPrompt({
			gameId: params.gameId,
			playerId: parsed.data.playerId,
			prompt: parsed.data.prompt
		});
		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
