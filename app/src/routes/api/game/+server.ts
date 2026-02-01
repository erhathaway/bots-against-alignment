import { json } from '@sveltejs/kit';

import { createGame } from '$lib/server/game/service';
import { handleApiError } from '$lib/server/http';

export const POST = async () => {
	try {
		const payload = await createGame();
		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
