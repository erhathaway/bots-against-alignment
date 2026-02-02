import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getGame } from '$lib/server/game/service';
import { jsonError, handleApiError } from '$lib/server/http';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const game = await getGame(params.gameId);
		if (!game) {
			return jsonError(404, 'Game not found');
		}
		return json({ gameId: game.id });
	} catch (error) {
		return handleApiError(error);
	}
};
