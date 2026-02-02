import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { addAutoPlayer, removeAutoPlayer } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

const addSchema = z.object({
	creatorId: z.string().min(1)
});

const removeSchema = z.object({
	creatorId: z.string().min(1),
	playerId: z.string().min(1)
});

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = addSchema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const result = await addAutoPlayer({
			gameId: params.gameId,
			creatorId: parsed.data.creatorId
		});
		return json(result);
	} catch (error) {
		return handleApiError(error);
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = removeSchema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const result = await removeAutoPlayer({
			gameId: params.gameId,
			creatorId: parsed.data.creatorId,
			playerId: parsed.data.playerId
		});
		return json(result);
	} catch (error) {
		return handleApiError(error);
	}
};
