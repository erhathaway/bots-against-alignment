import { json } from '@sveltejs/kit';

import { checkCountdownExpiry, getGameStatus } from '$lib/server/game/service';
import { handleApiError } from '$lib/server/http';

export const GET = async ({ params }) => {
	try {
		await checkCountdownExpiry(params.gameId);
		const payload = await getGameStatus(params.gameId);
		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
