import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleApiError, jsonError } from '$lib/server/http';
import { generateBotResponse } from '$lib/server/llm/bot';
import { db } from '$lib/server/db';
import { games, turns } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

const schema = z.object({
	playerId: z.string().min(1),
	botPrompt: z.string().min(1)
});

export const POST: RequestHandler = async (event) => {
	try {
		const { gameId, turnId: turnIdStr } = event.params;
		const turnId = Number(turnIdStr);

		if (!Number.isFinite(turnId)) {
			return jsonError(400, 'Invalid turnId');
		}

		const body = await event.request.json();
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		// Verify game and turn exist
		const gameRows = await db
			.select({ id: games.id })
			.from(games)
			.where(eq(games.id, gameId));

		if (!gameRows.length) {
			return jsonError(404, 'Game not found');
		}

		const turnRows = await db
			.select({ prompt: turns.prompt })
			.from(turns)
			.where(and(eq(turns.gameId, gameId), eq(turns.id, turnId)));

		if (!turnRows.length) {
			return jsonError(404, 'Turn not found');
		}

		const turnPrompt = turnRows[0].prompt;
		const { botPrompt } = parsed.data;

		// Generate bot response
		const response = await generateBotResponse(turnPrompt, botPrompt);

		return json({ response });
	} catch (error) {
		return handleApiError(error);
	}
};
