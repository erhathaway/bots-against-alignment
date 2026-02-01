import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { alignerPrompts, games, players, turnResponses, turns } from '$lib/server/db/schema';
import { randomAlignerPrompt, randomTurnPrompt } from '$lib/server/game/data';
import { generateBotResponse } from '$lib/server/llm/bot';
import { pickWinner } from '$lib/server/llm/aligner';
import {
	generateRandomAlignerPrompt,
	generateRandomBotName,
	generateRandomBotPrompt
} from '$lib/server/llm/random';
import { badRequest, forbidden, notFound } from '$lib/server/errors';

const DEFAULT_POINTS_TO_WIN = 10;
const DEFAULT_PROMPTS_REMAINING = 2;
const MAX_BOT_PROMPT_LENGTH = 281;

const truncate = (value: string, max: number) => value.slice(0, max);

const shuffle = <T>(items: T[]) => {
	const copy = [...items];
	for (let index = copy.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
	}
	return copy;
};

const now = () => Date.now();

export const createGame = async () => {
	const gameId = crypto.randomUUID();
	const creatorId = crypto.randomUUID();
	const timestamp = now();

	await db.insert(games).values({
		id: gameId,
		creatorId,
		status: 'LOBBY',
		pointsToWin: DEFAULT_POINTS_TO_WIN,
		alignerType: 'USER_ROUND_ROBIN',
		maxAutoPlayers: 3,
		turnId: 1,
		turnStarted: false,
		turnPrompt: null,
		alignerPromptFull: '',
		createdAt: timestamp,
		updatedAt: timestamp
	});

	return { gameId, creatorId };
};

export const getGame = async (gameId: string) => {
	const rows = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
	return rows[0] ?? null;
};

export const requireGame = async (gameId: string) => {
	const game = await getGame(gameId);
	if (!game) {
		throw notFound(`Game not found: ${gameId}`);
	}
	return game;
};

export const joinGame = async ({
	gameId,
	alignerPrompt,
	botPrompt,
	botName,
	creatorId
}: {
	gameId: string;
	alignerPrompt: string;
	botPrompt: string;
	botName: string;
	creatorId?: string | null;
}) => {
	const game = await requireGame(gameId);
	const playerId = crypto.randomUUID();
	const timestamp = now();
	const trimmedPrompt = truncate(botPrompt, MAX_BOT_PROMPT_LENGTH);

	await db.transaction(async (tx) => {
		await tx.insert(players).values({
			id: playerId,
			gameId,
			botName,
			botPrompt: trimmedPrompt,
			submittedBotPrompt: trimmedPrompt,
			promptsRemaining: DEFAULT_PROMPTS_REMAINING,
			score: 0,
			isAuto: false,
			turnComplete: false,
			createdAt: timestamp,
			updatedAt: timestamp
		});

		await tx.insert(alignerPrompts).values({
			gameId,
			playerId,
			prompt: alignerPrompt
		});

		if (creatorId && creatorId === game.creatorId) {
			await tx
				.update(games)
				.set({ creatorPlayerId: playerId, updatedAt: timestamp })
				.where(eq(games.id, gameId));
		}
	});

	return { playerId };
};

const createAutoPlayer = async (gameId: string) => {
	const playerId = crypto.randomUUID();
	const timestamp = now();

	const [botName, botPrompt, alignerPrompt] = await Promise.all([
		generateRandomBotName(),
		generateRandomBotPrompt(),
		generateRandomAlignerPrompt()
	]);

	await db.transaction(async (tx) => {
		await tx.insert(players).values({
			id: playerId,
			gameId,
			botName,
			botPrompt: truncate(botPrompt, MAX_BOT_PROMPT_LENGTH),
			submittedBotPrompt: truncate(botPrompt, MAX_BOT_PROMPT_LENGTH),
			promptsRemaining: DEFAULT_PROMPTS_REMAINING,
			score: 0,
			isAuto: true,
			turnComplete: false,
			createdAt: timestamp,
			updatedAt: timestamp
		});

		await tx.insert(alignerPrompts).values({
			gameId,
			playerId,
			prompt: alignerPrompt
		});
	});
};

export const startGame = async ({ gameId, creatorId }: { gameId: string; creatorId: string }) => {
	const game = await requireGame(gameId);
	if (game.creatorId !== creatorId) {
		throw forbidden('Forbidden');
	}

	const playersCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(players)
		.where(eq(players.gameId, gameId));
	const count = playersCount[0]?.count ?? 0;

	if (count < 4 && game.maxAutoPlayers > 0) {
		const autoPlayersToAdd = Math.min(game.maxAutoPlayers, 4 - count);
		for (let index = 0; index < autoPlayersToAdd; index += 1) {
			await createAutoPlayer(gameId);
		}
	}

	const alignerRows = await db
		.select({ prompt: alignerPrompts.prompt })
		.from(alignerPrompts)
		.where(eq(alignerPrompts.gameId, gameId));

	const combinedPrompt = alignerRows.length
		? shuffle(alignerRows.map((row) => row.prompt)).join(' ')
		: randomAlignerPrompt();

	await db
		.update(games)
		.set({
			status: 'STARTED',
			alignerPromptFull: combinedPrompt,
			updatedAt: now()
		})
		.where(eq(games.id, gameId));

	return { status: 'STARTED' };
};

export const getGameStatus = async (gameId: string) => {
	const game = await requireGame(gameId);
	const bots = await db
		.select({
			name: players.botName,
			points: players.score,
			turnComplete: players.turnComplete
		})
		.from(players)
		.where(eq(players.gameId, gameId));

	return { status: game.status, bots };
};

export const getUserStatus = async (gameId: string, playerId: string) => {
	await requireGame(gameId);
	const rows = await db
		.select({
			points: players.score,
			promptsRemaining: players.promptsRemaining,
			submittedPrompts: players.submittedBotPrompt
		})
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.id, playerId)))
		.limit(1);

	const player = rows[0];
	if (!player) {
		throw new Error('User not found');
	}
	return player;
};

export const ensureTurn = async (gameId: string) => {
	const timestamp = now();

	return await db.transaction(async (tx) => {
		const gameRows = await tx.select().from(games).where(eq(games.id, gameId)).limit(1);
		const game = gameRows[0];
		if (!game) {
			throw notFound('Game not found');
		}
		if (game.status !== 'STARTED') {
			throw badRequest('Game not started');
		}

		if (!game.turnStarted) {
			const prompt = randomTurnPrompt();
			await tx
				.update(games)
				.set({ turnStarted: true, turnPrompt: prompt, updatedAt: timestamp })
				.where(eq(games.id, gameId));

			await tx.update(players).set({ turnComplete: false }).where(eq(players.gameId, gameId));

			await tx
				.insert(turns)
				.values({
					gameId,
					turnId: game.turnId,
					prompt,
					status: 'OPEN'
				})
				.onConflictDoNothing();

			return { alignmentPrompt: prompt, turnId: game.turnId };
		}

		let prompt = game.turnPrompt;
		if (!prompt) {
			const turnRows = await tx
				.select({ prompt: turns.prompt })
				.from(turns)
				.where(and(eq(turns.gameId, gameId), eq(turns.turnId, game.turnId)))
				.limit(1);
			prompt = turnRows[0]?.prompt ?? randomTurnPrompt();
			await tx
				.update(games)
				.set({ turnPrompt: prompt, updatedAt: timestamp })
				.where(eq(games.id, gameId));
		}

		return { alignmentPrompt: prompt, turnId: game.turnId };
	});
};

const completeAutoPlayers = async (gameId: string, turnId: number, turnPrompt: string) => {
	const bots = await db
		.select({
			id: players.id,
			botPrompt: players.botPrompt,
			isAuto: players.isAuto,
			turnComplete: players.turnComplete
		})
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.isAuto, true)));

	for (const bot of bots) {
		if (bot.turnComplete) continue;
		const responseText = await generateBotResponse({
			botPrompt: bot.botPrompt,
			turnPrompt
		});
		await db.transaction(async (tx) => {
			await tx
				.update(players)
				.set({ turnComplete: true, updatedAt: now() })
				.where(eq(players.id, bot.id));

			await tx
				.insert(turnResponses)
				.values({ gameId, turnId, playerId: bot.id, responseText })
				.onConflictDoUpdate({
					target: [turnResponses.gameId, turnResponses.turnId, turnResponses.playerId],
					set: { responseText }
				});
		});
	}
};

export const submitTurn = async ({
	gameId,
	playerId,
	turnId,
	suggestion
}: {
	gameId: string;
	playerId: string;
	turnId: number;
	suggestion: string;
}) => {
	const game = await requireGame(gameId);
	if (game.turnId !== turnId) {
		throw notFound('Turn not found');
	}

	const playerRows = await db
		.select()
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.id, playerId)))
		.limit(1);
	const player = playerRows[0];
	if (!player) {
		throw notFound('User not found');
	}

	const currentPrompt = player.botPrompt;
	let updatedPrompt = currentPrompt;
	let promptsRemaining = player.promptsRemaining;

	if (suggestion.trim() !== '' && promptsRemaining > 0) {
		updatedPrompt = truncate(suggestion, MAX_BOT_PROMPT_LENGTH);
		promptsRemaining -= 1;
	}

	const turnPrompt = game.turnPrompt;
	if (!turnPrompt) {
		throw badRequest('Turn not initialized');
	}
	const responseText = await generateBotResponse({
		botPrompt: updatedPrompt,
		turnPrompt
	});

	await db.transaction(async (tx) => {
		await tx
			.update(players)
			.set({
				botPrompt: updatedPrompt,
				submittedBotPrompt: updatedPrompt,
				promptsRemaining,
				turnComplete: true,
				updatedAt: now()
			})
			.where(eq(players.id, playerId));

		await tx
			.insert(turnResponses)
			.values({ gameId, turnId, playerId, responseText })
			.onConflictDoUpdate({
				target: [turnResponses.gameId, turnResponses.turnId, turnResponses.playerId],
				set: { responseText }
			});
	});

	if (game.creatorPlayerId && playerId === game.creatorPlayerId) {
		await completeAutoPlayers(gameId, turnId, turnPrompt);
	}

	return { responseText };
};

export const turnFinale = async (gameId: string, turnId: number) => {
	await requireGame(gameId);
	const botsSubmittedRows = await db
		.select({ count: sql<number>`count(*)` })
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.turnComplete, true)));
	const totalBotsRows = await db
		.select({ count: sql<number>`count(*)` })
		.from(players)
		.where(eq(players.gameId, gameId));

	return {
		botsSubmitted: botsSubmittedRows[0]?.count ?? 0,
		totalBots: totalBotsRows[0]?.count ?? 0
	};
};

export const processTurn = async ({
	gameId,
	playerId,
	turnId
}: {
	gameId: string;
	playerId: string;
	turnId: number;
}) => {
	const game = await requireGame(gameId);
	if (game.creatorPlayerId !== playerId) {
		throw forbidden('Forbidden');
	}
	if (game.turnId !== turnId) {
		throw notFound('Turn not found');
	}

	const allPlayers = await db.select().from(players).where(eq(players.gameId, gameId));
	if (!allPlayers.length) {
		throw badRequest('No players');
	}

	const incomplete = allPlayers.find((player) => !player.turnComplete);
	if (incomplete) {
		throw badRequest('Not all players have completed their turn');
	}

	const responseRows = await db
		.select()
		.from(turnResponses)
		.where(and(eq(turnResponses.gameId, gameId), eq(turnResponses.turnId, turnId)));

	const responsesByPlayer: Record<string, string> = {};
	for (const row of responseRows) {
		responsesByPlayer[row.playerId] = row.responseText;
	}

	let winnerId = await pickWinner({
		alignerPrompt: game.alignerPromptFull || randomAlignerPrompt(),
		turnPrompt: game.turnPrompt || randomTurnPrompt(),
		responsesByPlayer
	});

	if (!winnerId) {
		winnerId = allPlayers[0]?.id ?? null;
	}

	const timestamp = now();

	await db.transaction(async (tx) => {
		if (winnerId) {
			await tx
				.update(players)
				.set({ score: sql`${players.score} + 1`, updatedAt: timestamp })
				.where(eq(players.id, winnerId));
		}

		await tx
			.update(turns)
			.set({ status: 'PROCESSED', winnerPlayerId: winnerId ?? null, processedAt: timestamp })
			.where(and(eq(turns.gameId, gameId), eq(turns.turnId, turnId)));

		await tx
			.update(games)
			.set({
				turnStarted: false,
				turnPrompt: null,
				turnId: game.turnId + 1,
				updatedAt: timestamp
			})
			.where(eq(games.id, gameId));
	});

	const updatedPlayers = await db.select().from(players).where(eq(players.gameId, gameId));
	const isGameOver = updatedPlayers.some((player) => player.score >= game.pointsToWin);
	if (isGameOver) {
		await db.update(games).set({ status: 'ENDED', updatedAt: now() }).where(eq(games.id, gameId));
	}
	const alignmentResponses = updatedPlayers.map((player) => ({
		playerId: player.id,
		name: player.botName,
		text: responsesByPlayer[player.id] ?? '',
		score: player.score,
		isRoundWinner: winnerId ? player.id === winnerId : false,
		isGlobalWinner: player.score >= game.pointsToWin
	}));

	return { alignmentResponses };
};
