import { z } from 'zod';
import { json } from '@sveltejs/kit';

import { postChatMessage, getChatMessages } from '$lib/server/chat/service';
import { handleApiError, jsonError } from '$lib/server/http';

const postSchema = z.object({
	message: z.string().min(1).max(500),
	senderName: z.string().min(1).max(30)
});

export const POST = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = postSchema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		const row = await postChatMessage({
			gameId: params.gameId,
			message: parsed.data.message,
			senderName: parsed.data.senderName,
			type: 'chat'
		});

		return json(row);
	} catch (error) {
		return handleApiError(error);
	}
};

export const GET = async ({ params, url }) => {
	try {
		const afterId = Number(url.searchParams.get('after') ?? '0');
		const messages = await getChatMessages(
			params.gameId,
			Number.isFinite(afterId) ? afterId : undefined
		);
		return json({ messages });
	} catch (error) {
		return handleApiError(error);
	}
};
