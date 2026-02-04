/**
 * GET /api/game/[gameId]/messages
 * Poll for published messages (replaces old chat endpoint)
 */

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getPublishedMessages } from '$lib/server/messages/service';
import { handleApiError } from '$lib/server/http';

export const GET = async (event: RequestEvent) => {
	try {
		const gameId = event.params.gameId;
		if (!gameId) {
			return json({ error: 'Missing gameId parameter' }, { status: 400 });
		}

		const afterId = Number(event.url.searchParams.get('after') ?? 0);

		if (!Number.isFinite(afterId) || afterId < 0) {
			return json({ error: 'Invalid after parameter' }, { status: 400 });
		}

		const messages = await getPublishedMessages(gameId, afterId);

		return json({ messages });
	} catch (error) {
		return handleApiError(error);
	}
};
