import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { updateGameSettings } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

const schema = z.object({
	creatorId: z.string().min(1),
	pointsToWin: z.number().int().min(1).max(20).optional(),
	botPromptChanges: z.number().int().min(0).max(10).optional()
});

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}
		const { creatorId, pointsToWin, botPromptChanges } = parsed.data;
		const payload = await updateGameSettings({
			gameId: params.gameId,
			creatorId,
			pointsToWin,
			botPromptChanges
		});
		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
