import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { joinGame } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

const schema = z.object({
	botPrompt: z.string().min(1),
	botName: z.string().min(1),
	creatorId: z.string().optional().nullable()
});

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const { botPrompt, botName, creatorId } = parsed.data;
		const payload = await joinGame({
			gameId: params.gameId,
			botPrompt,
			botName,
			creatorId
		});

		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
