import { eq, gt, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { chatMessages } from '$lib/server/db/schema';

type MessageType = 'chat' | 'status' | 'system';

export const postChatMessage = async ({
	gameId,
	message,
	senderName,
	type
}: {
	gameId: string;
	message: string;
	senderName?: string | null;
	type: MessageType;
}) => {
	const [row] = await db
		.insert(chatMessages)
		.values({
			gameId,
			message,
			senderName: senderName ?? null,
			type,
			createdAt: Date.now()
		})
		.returning();
	return row;
};

export const getChatMessages = async (gameId: string, afterId?: number) => {
	if (afterId && afterId > 0) {
		return db
			.select()
			.from(chatMessages)
			.where(and(eq(chatMessages.gameId, gameId), gt(chatMessages.id, afterId)))
			.orderBy(chatMessages.id)
			.limit(200);
	}
	return db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.gameId, gameId))
		.orderBy(chatMessages.id)
		.limit(200);
};
