/**
 * Message Service - CRUD operations for game messages
 */

import { db } from '$lib/server/db';
import { gameMessages } from '$lib/server/db/schema';
import { and, eq, gt, isNotNull, isNull } from 'drizzle-orm';
import type { GameMessage } from './types';

/**
 * Insert a message into the database.
 * Does NOT publish it (publishedAt = null).
 */
export async function insertMessage(message: GameMessage): Promise<GameMessage> {
	const [inserted] = await db
		.insert(gameMessages)
		.values({
			gameId: message.gameId,
			channel: message.channel,
			type: message.type,
			senderName: message.senderName,
			content: message.content,
			metadata: message.metadata ? JSON.stringify(message.metadata) : null,
			bufferDuration: message.bufferDuration,
			publishedAt: message.publishedAt,
			windowEndsAt: message.windowEndsAt,
			createdAt: message.createdAt
		})
		.returning();

	return deserializeMessage(inserted);
}

/**
 * Publish a message (set publishedAt timestamp).
 */
export async function publishMessage(
	messageId: number,
	publishedAt: number,
	windowEndsAt: number | null
): Promise<void> {
	await db
		.update(gameMessages)
		.set({ publishedAt, windowEndsAt })
		.where(eq(gameMessages.id, messageId));
}

/**
 * Get published messages for a game after a given message ID.
 * Used by client polling.
 */
export async function getPublishedMessages(
	gameId: string,
	afterId: number
): Promise<GameMessage[]> {
	const rows = await db
		.select()
		.from(gameMessages)
		.where(
			and(
				eq(gameMessages.gameId, gameId),
				gt(gameMessages.id, afterId),
				isNotNull(gameMessages.publishedAt)
			)
		)
		.orderBy(gameMessages.id);

	return rows.map(deserializeMessage);
}

/**
 * Get unpublished buffered messages for a game.
 * Used for queue recovery on server restart.
 */
export async function getUnpublishedBufferedMessages(gameId: string): Promise<GameMessage[]> {
	const rows = await db
		.select()
		.from(gameMessages)
		.where(
			and(
				eq(gameMessages.gameId, gameId),
				eq(gameMessages.channel, 'buffered'),
				isNull(gameMessages.publishedAt)
			)
		)
		.orderBy(gameMessages.id);

	return rows.map(deserializeMessage);
}

/**
 * Deserialize a database row into a GameMessage.
 */
function deserializeMessage(row: typeof gameMessages.$inferSelect): GameMessage {
	return {
		id: row.id,
		gameId: row.gameId,
		channel: row.channel,
		type: row.type,
		senderName: row.senderName,
		content: row.content,
		metadata: row.metadata ? JSON.parse(row.metadata) : null,
		bufferDuration: row.bufferDuration,
		publishedAt: row.publishedAt,
		windowEndsAt: row.windowEndsAt,
		createdAt: row.createdAt
	};
}
