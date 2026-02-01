import { json } from '@sveltejs/kit';

import { ensureTurn } from '$lib/server/game/service';
import { handleApiError } from '$lib/server/http';

export const POST = async ({ params }) => {
	try {
		const payload = await ensureTurn(params.gameId);
		return json(payload);
	} catch (error) {
		return handleApiError(error);
	}
};
