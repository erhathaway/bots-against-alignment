import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { turnFinale } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const turnId = Number(params.turnId);
		if (!Number.isFinite(turnId)) {
			return jsonError(400, 'Invalid turnId');
		}
		const payload = await turnFinale(params.gameId, turnId);
		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
