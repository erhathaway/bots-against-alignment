import { json } from '@sveltejs/kit';

import { getUserStatus } from '$lib/server/game/service';
import { handleApiError, jsonError } from '$lib/server/http';

export const GET = async ({ params, url }) => {
	try {
		const playerId = url.searchParams.get('playerId');
		if (!playerId) {
			return jsonError(400, 'playerId is required');
		}

		const payload = await getUserStatus(params.gameId, playerId);
		return json({
			points: payload.points,
			botPromptsRemaining: payload.promptsRemaining,
			submittedPrompts: payload.submittedPrompts,
			creatorId: payload.creatorId
		});
	} catch (error) {
		return handleApiError(error);
	}
};
