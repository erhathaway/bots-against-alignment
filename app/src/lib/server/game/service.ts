import { and, eq, isNull, sql } from 'drizzle-orm';

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
import { postChatMessage } from '$lib/server/chat/service';
import { checkLLMAvailability } from '$lib/server/llm/health';

const DEFAULT_POINTS_TO_WIN = 2;
const DEFAULT_BOT_PROMPT_CHANGES = 1;
const MAX_BOT_PROMPT_LENGTH = 281;
const MAX_TOTAL_PLAYERS = 8;
const COUNTDOWN_DURATION_MS = 3 * 60 * 1000;

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
		botPromptChanges: DEFAULT_BOT_PROMPT_CHANGES,
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

export const updateGameSettings = async ({
	gameId,
	creatorId,
	pointsToWin,
	botPromptChanges
}: {
	gameId: string;
	creatorId: string;
	pointsToWin?: number;
	botPromptChanges?: number;
}) => {
	const game = await requireGame(gameId);
	if (game.creatorId !== creatorId) {
		throw forbidden('Forbidden');
	}
	if (game.status !== 'LOBBY') {
		throw badRequest('Cannot change settings after game has started');
	}

	const updates: Partial<typeof games.$inferInsert> = { updatedAt: now() };
	if (pointsToWin !== undefined) {
		if (pointsToWin < 1 || pointsToWin > 20)
			throw badRequest('pointsToWin must be between 1 and 20');
		updates.pointsToWin = pointsToWin;
	}
	if (botPromptChanges !== undefined) {
		if (botPromptChanges < 0 || botPromptChanges > 10)
			throw badRequest('botPromptChanges must be between 0 and 10');
		updates.botPromptChanges = botPromptChanges;
	}

	await db.update(games).set(updates).where(eq(games.id, gameId));
	return {
		pointsToWin: pointsToWin ?? game.pointsToWin,
		botPromptChanges: botPromptChanges ?? game.botPromptChanges
	};
};

export const joinGame = async ({
	gameId,
	botPrompt,
	botName,
	creatorId
}: {
	gameId: string;
	botPrompt: string;
	botName: string;
	creatorId?: string | null;
}) => {
	const game = await requireGame(gameId);
	const playerId = crypto.randomUUID();
	const timestamp = now();
	const trimmedPrompt = truncate(botPrompt, MAX_BOT_PROMPT_LENGTH);

	// Auto-assign creator if game has no human owner yet (e.g. play-again games)
	const shouldBecomeCreator = (creatorId && creatorId === game.creatorId) || !game.creatorPlayerId;
	let assignedCreatorId: string | null = null;

	await db.transaction(async (tx) => {
		await tx.insert(players).values({
			id: playerId,
			gameId,
			botName,
			botPrompt: trimmedPrompt,
			submittedBotPrompt: trimmedPrompt,
			promptsRemaining: DEFAULT_BOT_PROMPT_CHANGES,
			score: 0,
			isAuto: false,
			turnComplete: false,
			createdAt: timestamp,
			updatedAt: timestamp
		});

		// Note: Aligner prompts are now submitted separately after game starts
		// via the AlignerPromptModal, not during join

		if (shouldBecomeCreator) {
			const newCreatorId =
				creatorId && creatorId === game.creatorId ? game.creatorId : crypto.randomUUID();
			await tx
				.update(games)
				.set({ creatorPlayerId: playerId, creatorId: newCreatorId, updatedAt: timestamp })
				.where(eq(games.id, gameId));
			assignedCreatorId = newCreatorId;
		}
	});

	const isCreator = Boolean(shouldBecomeCreator);
	await postChatMessage({
		gameId,
		message: isCreator ? 'created the game' : 'joined the waiting room',
		senderName: botName,
		type: 'status'
	});

	// Seed default AI bots in the background when the creator joins
	if (isCreator) {
		const seedAiBots = async () => {
			const DEFAULT_AI_BOTS = 2;
			for (let i = 0; i < DEFAULT_AI_BOTS; i++) {
				try {
					const { botName: aiBotName } = await createAutoPlayer(gameId);
					await postChatMessage({
						gameId,
						message: 'joined the waiting room',
						senderName: aiBotName,
						type: 'status'
					});
				} catch (error) {
					console.error(`[seedAiBots] Failed to create AI bot for game ${gameId}:`, error);
				}
			}
		};
		seedAiBots();
	}

	return { playerId, creatorId: assignedCreatorId };
};

const createAutoPlayer = async (gameId: string): Promise<{ playerId: string; botName: string }> => {
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
			promptsRemaining: DEFAULT_BOT_PROMPT_CHANGES,
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

	return { playerId, botName };
};

export const startCountdown = async ({
	gameId,
	creatorId
}: {
	gameId: string;
	creatorId: string;
}) => {
	const game = await requireGame(gameId);
	if (game.creatorId !== creatorId) {
		throw forbidden('Forbidden');
	}
	if (game.status !== 'LOBBY') {
		throw badRequest('Game is not in lobby');
	}
	if (game.countdownStartedAt) {
		return { countdownStartedAt: game.countdownStartedAt };
	}

	const timestamp = now();
	await db
		.update(games)
		.set({ countdownStartedAt: timestamp, updatedAt: timestamp })
		.where(eq(games.id, gameId));

	await postChatMessage({
		gameId,
		message: 'The host started the countdown! Make sure your prompts are ready!',
		type: 'system'
	});

	return { countdownStartedAt: timestamp };
};

export const startGame = async ({ gameId, creatorId }: { gameId: string; creatorId: string }) => {
	const game = await requireGame(gameId);
	if (game.creatorId !== creatorId) {
		throw forbidden('Forbidden');
	}

	// Idempotent: if already started, return silently
	if (game.status !== 'LOBBY') {
		return { status: game.status };
	}

	try {
		await checkLLMAvailability();
	} catch (error) {
		const reason = error instanceof Error ? error.message : 'Unknown error';
		throw badRequest(`LLM is not available: ${reason}`);
	}

	const timestamp = now();
	await db
		.update(games)
		.set({
			status: 'ALIGNER_SETUP',
			countdownStartedAt: null,
			updatedAt: timestamp
		})
		.where(eq(games.id, gameId));

	// Set all active players' promptsRemaining to the game's botPromptChanges setting
	await db
		.update(players)
		.set({ promptsRemaining: game.botPromptChanges, updatedAt: timestamp })
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

	await postChatMessage({
		gameId,
		message: 'The game is starting! Submit your aligner instructions.',
		type: 'system'
	});

	// Check if all players already have aligner prompts (e.g. all AI)
	await tryCompleteAlignerSetup(gameId, game.pointsToWin, game.botPromptChanges);

	return { status: 'ALIGNER_SETUP' };
};

const tryCompleteAlignerSetup = async (
	gameId: string,
	pointsToWin: number,
	botPromptChanges: number
) => {
	const activePlayers = await db
		.select({ id: players.id })
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

	const submittedPrompts = await db
		.select({ playerId: alignerPrompts.playerId })
		.from(alignerPrompts)
		.where(eq(alignerPrompts.gameId, gameId));

	const activeIds = new Set(activePlayers.map((p) => p.id));
	const submittedIds = new Set(submittedPrompts.map((p) => p.playerId));
	const allSubmitted = [...activeIds].every((id) => submittedIds.has(id));

	if (!allSubmitted) return false;

	const alignerRows = await db
		.select({ prompt: alignerPrompts.prompt })
		.from(alignerPrompts)
		.where(eq(alignerPrompts.gameId, gameId));

	const combinedPrompt = alignerRows.length
		? shuffle(alignerRows.map((row) => row.prompt)).join(' ')
		: randomAlignerPrompt();

	const timestamp = now();
	await db
		.update(games)
		.set({
			status: 'STARTED',
			alignerPromptFull: combinedPrompt,
			updatedAt: timestamp
		})
		.where(eq(games.id, gameId));

	const allPlayerData = await db
		.select({ botName: players.botName, isAuto: players.isAuto })
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));
	const humanNames = allPlayerData.filter((p) => !p.isAuto).map((p) => p.botName);
	const autoNames = allPlayerData.filter((p) => p.isAuto).map((p) => p.botName);

	await postChatMessage({
		gameId,
		senderName: 'Game Start',
		message: JSON.stringify({
			totalBots: allPlayerData.length,
			pointsToWin,
			botPromptChanges,
			humans: humanNames,
			ai: autoNames
		}),
		type: 'system'
	});

	return true;
};

export const submitAlignerPrompt = async ({
	gameId,
	playerId,
	prompt
}: {
	gameId: string;
	playerId: string;
	prompt: string;
}) => {
	const game = await requireGame(gameId);
	if (game.status !== 'ALIGNER_SETUP') {
		throw badRequest('Game is not in aligner setup phase');
	}

	const playerRows = await db
		.select({ id: players.id })
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.id, playerId), isNull(players.leftAt)));

	if (!playerRows.length) {
		throw notFound('Player not found or has left the game');
	}

	await db
		.insert(alignerPrompts)
		.values({ gameId, playerId, prompt })
		.onConflictDoUpdate({
			target: [alignerPrompts.gameId, alignerPrompts.playerId],
			set: { prompt }
		});

	await postChatMessage({
		gameId,
		message: 'submitted their aligner instruction',
		senderName: playerRows[0].id === game.creatorPlayerId ? 'Host' : 'A player',
		type: 'status'
	});

	const activePlayers = await db
		.select({ id: players.id })
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

	const submittedPrompts = await db
		.select({ playerId: alignerPrompts.playerId })
		.from(alignerPrompts)
		.where(eq(alignerPrompts.gameId, gameId));

	const activeIds = new Set(activePlayers.map((p) => p.id));
	const submittedIds = new Set(submittedPrompts.map((p) => p.playerId));
	const submittedCount = [...activeIds].filter((id) => submittedIds.has(id)).length;
	const allSubmitted = submittedCount === activeIds.size;

	if (allSubmitted) {
		await tryCompleteAlignerSetup(gameId, game.pointsToWin, game.botPromptChanges);
	}

	return {
		submitted: true,
		allSubmitted,
		totalPlayers: activeIds.size,
		submittedCount
	};
};

export const getGameStatus = async (gameId: string) => {
	const game = await requireGame(gameId);
	const allPlayers = await db
		.select({
			id: players.id,
			name: players.botName,
			points: players.score,
			turnComplete: players.turnComplete,
			promptsRemaining: players.promptsRemaining,
			isAuto: players.isAuto
		})
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

	const bots = allPlayers.map((p) => ({
		id: p.id,
		name: p.name,
		points: p.points,
		turnComplete: p.turnComplete,
		promptsRemaining: p.promptsRemaining,
		isHost: p.id === game.creatorPlayerId,
		isAuto: p.isAuto
	}));

	let alignerPromptsSubmitted = 0;
	if (game.status === 'ALIGNER_SETUP') {
		const promptRows = await db
			.select({ playerId: alignerPrompts.playerId })
			.from(alignerPrompts)
			.where(eq(alignerPrompts.gameId, gameId));
		alignerPromptsSubmitted = promptRows.length;
	}

	return {
		status: game.status,
		bots,
		pointsToWin: game.pointsToWin,
		botPromptChanges: game.botPromptChanges,
		countdownStartedAt: game.countdownStartedAt,
		alignerPromptsSubmitted
	};
};

export const getUserStatus = async (gameId: string, playerId: string) => {
	const game = await requireGame(gameId);
	const rows = await db
		.select({
			points: players.score,
			promptsRemaining: players.promptsRemaining,
			submittedPrompts: players.submittedBotPrompt,
			leftAt: players.leftAt
		})
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.id, playerId)))
		.limit(1);

	const player = rows[0];
	if (!player) {
		throw new Error('User not found');
	}
	if (player.leftAt) {
		throw badRequest('Player has left the game');
	}
	return {
		points: player.points,
		promptsRemaining: player.promptsRemaining,
		submittedPrompts: player.submittedPrompts,
		creatorId: game.creatorPlayerId === playerId ? game.creatorId : null
	};
};

export const ensureTurn = async (gameId: string) => {
	const timestamp = now();

	const result = await db.transaction(async (tx) => {
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

			await tx
				.update(players)
				.set({ turnComplete: false, promptsRemaining: game.botPromptChanges })
				.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

			await tx
				.insert(turns)
				.values({
					gameId,
					turnId: game.turnId,
					prompt,
					status: 'OPEN'
				})
				.onConflictDoNothing();

			return { alignmentPrompt: prompt, turnId: game.turnId, isNew: true };
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

		return { alignmentPrompt: prompt, turnId: game.turnId, isNew: false };
	});

	if (result.isNew) {
		await postChatMessage({
			gameId,
			senderName: 'Turn Prompt',
			message: result.alignmentPrompt,
			type: 'system'
		});
	}

	return { alignmentPrompt: result.alignmentPrompt, turnId: result.turnId };
};

const completeAutoPlayers = async (gameId: string, turnId: number, turnPrompt: string) => {
	const bots = await db
		.select({
			id: players.id,
			botName: players.botName,
			botPrompt: players.botPrompt,
			isAuto: players.isAuto,
			turnComplete: players.turnComplete
		})
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.isAuto, true), isNull(players.leftAt)));

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

		await postChatMessage({
			gameId,
			senderName: 'Bot Response',
			message: JSON.stringify({ name: bot.botName, text: responseText }),
			type: 'status'
		});
	}
};

export const submitTurn = async ({
	gameId,
	playerId,
	turnId,
	suggestion,
	responseText
}: {
	gameId: string;
	playerId: string;
	turnId: number;
	suggestion: string;
	responseText: string;
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
	if (player.leftAt) {
		throw badRequest('Player has left the game');
	}

	const currentPrompt = player.botPrompt;
	let updatedPrompt = currentPrompt;
	let promptsRemaining = player.promptsRemaining;

	if (
		suggestion.trim() !== '' &&
		suggestion.trim() !== currentPrompt.trim() &&
		promptsRemaining > 0
	) {
		updatedPrompt = truncate(suggestion, MAX_BOT_PROMPT_LENGTH);
		promptsRemaining -= 1;
	}

	// Response text is now always provided from the /generate endpoint preview
	// No more generating during submission

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

	await postChatMessage({
		gameId,
		senderName: 'Bot Response',
		message: JSON.stringify({ name: player.botName, text: responseText }),
		type: 'status'
	});

	if (game.creatorPlayerId && playerId === game.creatorPlayerId && game.turnPrompt) {
		await completeAutoPlayers(gameId, turnId, game.turnPrompt);
	}

	// Fire-and-forget: auto-trigger judging if all players have submitted
	tryAutoProcess(gameId);

	return { responseText };
};

const tryAutoProcess = async (gameId: string) => {
	try {
		const game = await requireGame(gameId);
		if (game.status !== 'STARTED' || !game.turnStarted) return;

		const allPlayers = await db
			.select({ turnComplete: players.turnComplete })
			.from(players)
			.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

		if (allPlayers.length === 0) return;
		if (!allPlayers.every((p) => p.turnComplete)) return;

		await processTurn({
			gameId,
			playerId: game.creatorPlayerId ?? '',
			turnId: game.turnId,
			_serverTriggered: true
		});
	} catch (error) {
		console.error(`[tryAutoProcess] Error auto-processing game ${gameId}:`, error);
	}
};

export const turnFinale = async (gameId: string, turnId: number) => {
	const game = await requireGame(gameId);

	const allPlayers = await db
		.select()
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));
	const botsSubmitted = allPlayers.filter((p) => p.turnComplete).length;
	const totalBots = allPlayers.length;

	const turnRows = await db
		.select()
		.from(turns)
		.where(and(eq(turns.gameId, gameId), eq(turns.turnId, turnId)))
		.limit(1);
	const turn = turnRows[0];

	if (turn && turn.status === 'PROCESSED') {
		const responseRows = await db
			.select()
			.from(turnResponses)
			.where(and(eq(turnResponses.gameId, gameId), eq(turnResponses.turnId, turnId)));

		const responseMap: Record<string, string> = {};
		for (const row of responseRows) {
			responseMap[row.playerId] = row.responseText;
		}

		const alignmentResponses = allPlayers.map((player) => ({
			playerId: player.id,
			name: player.botName,
			text: responseMap[player.id] ?? '',
			score: player.score,
			isRoundWinner: player.id === turn.winnerPlayerId,
			isGlobalWinner: player.score >= game.pointsToWin
		}));

		return {
			botsSubmitted,
			totalBots,
			processed: true,
			alignmentResponses,
			isGameOver: game.status === 'ENDED'
		};
	}

	return {
		botsSubmitted,
		totalBots,
		processed: false,
		alignmentResponses: null,
		isGameOver: false
	};
};

export const processTurn = async ({
	gameId,
	playerId,
	turnId,
	_serverTriggered = false
}: {
	gameId: string;
	playerId: string;
	turnId: number;
	_serverTriggered?: boolean;
}) => {
	const game = await requireGame(gameId);
	if (!_serverTriggered && game.creatorPlayerId !== playerId) {
		throw forbidden('Forbidden');
	}
	if (game.turnId !== turnId) {
		throw notFound('Turn not found');
	}

	// Idempotency guard: if already processed, return early
	const existingTurn = await db
		.select({ status: turns.status })
		.from(turns)
		.where(and(eq(turns.gameId, gameId), eq(turns.turnId, turnId)))
		.limit(1);
	if (existingTurn[0]?.status === 'PROCESSED') {
		return { alignmentResponses: [] };
	}

	const allPlayers = await db
		.select()
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));
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
		gameId,
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

	const updatedPlayers = await db
		.select()
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

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

	const winner = updatedPlayers.find((p) => p.id === winnerId);
	if (winner) {
		await postChatMessage({
			gameId,
			senderName: 'Round Winner',
			message: JSON.stringify({
				name: winner.botName,
				score: winner.score,
				isAuto: winner.isAuto
			}),
			type: 'system'
		});
	}

	const standings = updatedPlayers
		.sort((a, b) => b.score - a.score)
		.map((p) => ({ name: p.botName, score: p.score, isAuto: p.isAuto }));
	await postChatMessage({
		gameId,
		senderName: 'Standings',
		message: JSON.stringify(standings),
		type: 'system'
	});

	if (isGameOver && winner) {
		await postChatMessage({
			gameId,
			senderName: 'Game Over',
			message: JSON.stringify({ name: winner.botName, score: winner.score }),
			type: 'system'
		});
	}

	return { alignmentResponses };
};

export const leaveGame = async ({ gameId, playerId }: { gameId: string; playerId: string }) => {
	await requireGame(gameId);

	const playerRows = await db
		.select()
		.from(players)
		.where(and(eq(players.gameId, gameId), eq(players.id, playerId), isNull(players.leftAt)))
		.limit(1);
	const player = playerRows[0];
	if (!player) {
		throw notFound('Player not found or already left');
	}

	const timestamp = now();
	let hostTransferred = false;
	let gameEnded = false;
	let newHostName: string | null = null;
	let gameStatus: string = 'LOBBY';

	await db.transaction(async (tx) => {
		// Soft-delete: set leftAt, mark turnComplete so they don't block the current turn
		await tx
			.update(players)
			.set({ leftAt: timestamp, turnComplete: true, updatedAt: timestamp })
			.where(eq(players.id, playerId));

		// Re-read game inside transaction for consistency
		const gameRows = await tx.select().from(games).where(eq(games.id, gameId)).limit(1);
		const game = gameRows[0]!;
		gameStatus = game.status;
		const isHost = game.creatorPlayerId === playerId;

		// Find remaining active human players
		const activeHumans = await tx
			.select({ id: players.id, botName: players.botName })
			.from(players)
			.where(and(eq(players.gameId, gameId), eq(players.isAuto, false), isNull(players.leftAt)));

		if (isHost && activeHumans.length > 0) {
			// Transfer host to next human
			const newHost = activeHumans[0];
			const newCreatorId = crypto.randomUUID();
			await tx
				.update(games)
				.set({
					creatorPlayerId: newHost.id,
					creatorId: newCreatorId,
					updatedAt: timestamp
				})
				.where(eq(games.id, gameId));
			hostTransferred = true;
			newHostName = newHost.botName;
		} else if (activeHumans.length === 0) {
			// No humans remain — end the game
			await tx
				.update(games)
				.set({ status: 'ENDED', updatedAt: timestamp })
				.where(eq(games.id, gameId));
			gameEnded = true;
		}
	});

	await postChatMessage({
		gameId,
		message: gameStatus === 'LOBBY' ? 'left the waiting room' : 'left the game',
		senderName: player.botName,
		type: 'status'
	});

	if (hostTransferred && newHostName) {
		await postChatMessage({
			gameId,
			message: `${newHostName} is now the host`,
			type: 'system'
		});
	}

	if (gameEnded) {
		await postChatMessage({
			gameId,
			message: 'Game ended — all players left',
			type: 'system'
		});
	}

	// Clear countdown if fewer than 2 players remain in lobby
	if (gameStatus === 'LOBBY' && !gameEnded) {
		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(players)
			.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));
		const remainingCount = countResult[0]?.count ?? 0;
		if (remainingCount < 2) {
			await db
				.update(games)
				.set({ countdownStartedAt: null, updatedAt: now() })
				.where(eq(games.id, gameId));
		}
	}

	return { left: true, hostTransferred, gameEnded };
};

export const addAutoPlayer = async ({
	gameId,
	creatorId
}: {
	gameId: string;
	creatorId: string;
}) => {
	const game = await requireGame(gameId);
	if (game.creatorId !== creatorId) throw forbidden('Forbidden');
	if (game.status !== 'LOBBY') throw badRequest('Game is not in lobby');

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));
	const currentCount = countResult[0]?.count ?? 0;

	if (currentCount >= MAX_TOTAL_PLAYERS) {
		throw badRequest('Maximum of 8 players reached');
	}

	const { playerId, botName } = await createAutoPlayer(gameId);

	await postChatMessage({
		gameId,
		message: 'joined the waiting room',
		senderName: botName,
		type: 'status'
	});

	return { playerId, botName };
};

export const removeAutoPlayer = async ({
	gameId,
	creatorId,
	playerId
}: {
	gameId: string;
	creatorId: string;
	playerId: string;
}) => {
	const game = await requireGame(gameId);
	if (game.creatorId !== creatorId) throw forbidden('Forbidden');
	if (game.status !== 'LOBBY') throw badRequest('Game is not in lobby');

	const playerRows = await db
		.select()
		.from(players)
		.where(
			and(
				eq(players.gameId, gameId),
				eq(players.id, playerId),
				eq(players.isAuto, true),
				isNull(players.leftAt)
			)
		)
		.limit(1);
	const player = playerRows[0];
	if (!player) throw notFound('AI player not found');

	const timestamp = now();
	await db.transaction(async (tx) => {
		await tx
			.update(players)
			.set({ leftAt: timestamp, updatedAt: timestamp })
			.where(eq(players.id, playerId));

		await tx
			.delete(alignerPrompts)
			.where(and(eq(alignerPrompts.gameId, gameId), eq(alignerPrompts.playerId, playerId)));
	});

	await postChatMessage({
		gameId,
		message: 'left the waiting room',
		senderName: player.botName,
		type: 'status'
	});

	// Clear countdown if fewer than 2 players remain
	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));
	const remainingCount = countResult[0]?.count ?? 0;
	if (remainingCount < 2 && game.countdownStartedAt) {
		await db
			.update(games)
			.set({ countdownStartedAt: null, updatedAt: now() })
			.where(eq(games.id, gameId));
	}

	return { removed: true };
};

export const playAgain = async (gameId: string) => {
	const game = await requireGame(gameId);
	if (game.status !== 'ENDED') {
		throw badRequest('Game has not ended');
	}

	// If a next game already exists, return it
	if (game.nextGameId) {
		return { gameId: game.nextGameId };
	}

	// Create a new game and link it
	const { gameId: newGameId, creatorId: newCreatorId } = await createGame();
	await db
		.update(games)
		.set({ nextGameId: newGameId, updatedAt: now() })
		.where(and(eq(games.id, gameId), isNull(games.nextGameId)));

	// Re-read in case of race condition (another player created one first)
	const freshGame = await requireGame(gameId);
	if (freshGame.nextGameId !== newGameId) {
		// Another player won the race; return their game instead
		return { gameId: freshGame.nextGameId! };
	}

	return { gameId: newGameId, creatorId: newCreatorId };
};

export const checkCountdownExpiry = async (gameId: string) => {
	const game = await getGame(gameId);
	if (!game || game.status !== 'LOBBY' || !game.countdownStartedAt) return false;

	const elapsed = now() - game.countdownStartedAt;
	if (elapsed < COUNTDOWN_DURATION_MS) return false;

	try {
		await startGame({ gameId, creatorId: game.creatorId });
		return true;
	} catch (error) {
		console.error(`[checkCountdownExpiry] Failed to auto-start game ${gameId}:`, error);
		return false;
	}
};
