import { json } from '@sveltejs/kit';

import { leaveGame } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

export const POST = async ({ params, request }) => {
	try {
		const body = await request.json();
		const playerId = body?.playerId;
		if (!playerId || typeof playerId !== 'string') {
			return jsonError(400, 'playerId is required');
		}

		const result = await leaveGame({ gameId: params.gameId, playerId });
		return json(result);
	} catch (error) {
		return handleApiError(error);
	}
};
