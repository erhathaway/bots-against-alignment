/**
 * Chat endpoint - handles player chat messages
 * POST: Send a chat message
 * GET: Poll for messages (delegates to /messages endpoint)
 */

import { z } from 'zod';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { messageQueue } from '$lib/server/messages';
import { getPublishedMessages } from '$lib/server/messages/service';
import { handleApiError, jsonError } from '$lib/server/http';

const postSchema = z.object({
	message: z.string().min(1).max(500),
	senderName: z.string().min(1).max(30)
});

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const parsed = postSchema.safeParse(body);
		if (!parsed.success) {
			return jsonError(400, 'Invalid request', parsed.error.flatten());
		}

		await messageQueue.publish({
			gameId: params.gameId,
			channel: 'instant',
			type: 'chat',
			senderName: parsed.data.senderName,
			content: parsed.data.message
		});

		return json({ success: true });
	} catch (error) {
		return handleApiError(error);
	}
};

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const afterId = Number(url.searchParams.get('after') ?? '0');
		const messages = await getPublishedMessages(params.gameId, afterId);
		return json({ messages });
	} catch (error) {
		return handleApiError(error);
	}
};
