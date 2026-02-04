/**
 * State Change Processor - Handles game state transitions triggered by messages
 */

import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { games, players, turns, turnResponses } from '$lib/server/db/schema';
import type { GameMessage } from './types';
import { messageQueue } from './queue';
import { pickWinner } from '$lib/server/llm/aligner';
import { generateBotResponse } from '$lib/server/llm/bot';
import { randomTurnPrompt } from '$lib/server/game/data';

const now = () => Date.now();

/**
 * Process state change metadata from a published message.
 */
export async function processStateChange(message: GameMessage): Promise<void> {
	if (!message.metadata?.stateChange) return;

	const { action, payload } = message.metadata.stateChange;

	switch (action) {
		case 'start_countdown':
			await handleStartCountdown(message.gameId, payload);
			break;

		case 'start_game':
			await handleStartGame(message.gameId, payload);
			break;

		case 'start_aligner_setup':
			await handleStartAlignerSetup(message.gameId);
			break;

		case 'complete_aligner_setup':
			await handleCompleteAlignerSetup(message.gameId);
			break;

		case 'start_turn':
			await handleStartTurn(message.gameId, payload);
			break;

		case 'submit_bot_response':
			await handleBotResponseSubmit(message.gameId, payload);
			break;

		case 'complete_turn':
			await handleCompleteTurn(message.gameId, payload);
			break;

		case 'award_point':
			await handleAwardPoint(message.gameId, payload);
			break;

		case 'end_game':
			await handleEndGame(message.gameId, payload);
			break;

		default:
			console.warn(`[StateChangeProcessor] Unknown action: ${action}`);
	}
}

/**
 * Handle countdown start.
 */
async function handleStartCountdown(gameId: string, payload: any): Promise<void> {
	const timestamp = now();
	await db.update(games).set({ countdownStartedAt: timestamp }).where(eq(games.id, gameId));
}

/**
 * Handle game start (transition to ALIGNER_SETUP).
 */
async function handleStartGame(gameId: string, payload: any): Promise<void> {
	const timestamp = now();

	const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
	if (!game[0]) return;

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
		.set({ promptsRemaining: game[0].botPromptChanges, updatedAt: timestamp })
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));
}

/**
 * Handle aligner setup start.
 */
async function handleStartAlignerSetup(gameId: string): Promise<void> {
	// State already set by handleStartGame
	// This is a no-op, exists for consistency
}

/**
 * Handle aligner setup completion (transition to STARTED).
 */
async function handleCompleteAlignerSetup(gameId: string): Promise<void> {
	const timestamp = now();
	await db
		.update(games)
		.set({
			status: 'STARTED',
			updatedAt: timestamp
		})
		.where(eq(games.id, gameId));
}

/**
 * Handle turn start.
 */
async function handleStartTurn(gameId: string, payload: any): Promise<void> {
	const { turnId, prompt } = payload;
	const timestamp = now();

	await db
		.update(games)
		.set({
			turnStarted: true,
			turnPrompt: prompt,
			updatedAt: timestamp
		})
		.where(eq(games.id, gameId));

	// Reset all players' turnComplete
	await db
		.update(players)
		.set({ turnComplete: false, updatedAt: timestamp })
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

	// Create turn record
	await db
		.insert(turns)
		.values({
			gameId,
			turnId,
			prompt,
			status: 'OPEN'
		})
		.onConflictDoNothing();
}

/**
 * Handle bot response submission.
 */
async function handleBotResponseSubmit(gameId: string, payload: any): Promise<void> {
	const { playerId, turnId, responseText, suggestion } = payload;
	const timestamp = now();

	// Get player and game data
	const playerRows = await db
		.select()
		.from(players)
		.where(eq(players.id, playerId))
		.limit(1);

	if (!playerRows.length) return;
	const player = playerRows[0];

	// Handle bot prompt update (if suggestion changed)
	let updatedPrompt = player.botPrompt;
	let promptsRemaining = player.promptsRemaining;

	if (
		suggestion &&
		suggestion.trim() !== '' &&
		suggestion.trim() !== player.botPrompt.trim() &&
		promptsRemaining > 0
	) {
		updatedPrompt = suggestion.slice(0, 281); // MAX_BOT_PROMPT_LENGTH
		promptsRemaining -= 1;
	}

	// Update player state
	await db
		.update(players)
		.set({
			botPrompt: updatedPrompt,
			submittedBotPrompt: updatedPrompt,
			promptsRemaining,
			turnComplete: true,
			updatedAt: timestamp
		})
		.where(eq(players.id, playerId));

	// Store response
	await db
		.insert(turnResponses)
		.values({ gameId, turnId, playerId, responseText })
		.onConflictDoUpdate({
			target: [turnResponses.gameId, turnResponses.turnId, turnResponses.playerId],
			set: { responseText }
		});

	// Check if all players have submitted
	const allPlayers = await db
		.select({ id: players.id, turnComplete: players.turnComplete, isAuto: players.isAuto })
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

	if (allPlayers.length === 0) return;

	// If creator just submitted, trigger auto-bots
	const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
	if (game[0] && game[0].creatorPlayerId === playerId && game[0].turnPrompt) {
		await completeAutoPlayers(gameId, turnId, game[0].turnPrompt);
	}

	// Check if all submitted (including auto-bots)
	const allSubmitted = allPlayers.every((p) => p.turnComplete);

	if (allSubmitted) {
		// Trigger turn processing (judging)
		await processTurnJudging(gameId, turnId);
	}
}

/**
 * Complete auto-bot responses for a turn.
 */
async function completeAutoPlayers(
	gameId: string,
	turnId: number,
	turnPrompt: string
): Promise<void> {
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

		// Publish buffered bot response message
		await messageQueue.publish({
			gameId,
			channel: 'buffered',
			type: 'bot_response',
			senderName: 'Bot Response',
			content: JSON.stringify({ name: bot.botName, text: responseText }),
			metadata: {
				stateChange: {
					action: 'submit_bot_response',
					payload: { playerId: bot.id, turnId, responseText, suggestion: null }
				}
			}
		});
	}
}

/**
 * Process turn judging (call LLM aligner).
 */
async function processTurnJudging(gameId: string, turnId: number): Promise<void> {
	// Check if already processed (idempotency)
	const existingTurn = await db
		.select({ status: turns.status })
		.from(turns)
		.where(and(eq(turns.gameId, gameId), eq(turns.turnId, turnId)))
		.limit(1);

	if (existingTurn[0]?.status === 'PROCESSED') return;

	// Get game data
	const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
	if (!game[0]) return;

	// Get all responses
	const responseRows = await db
		.select()
		.from(turnResponses)
		.where(and(eq(turnResponses.gameId, gameId), eq(turnResponses.turnId, turnId)));

	const responsesByPlayer: Record<string, string> = {};
	for (const row of responseRows) {
		responsesByPlayer[row.playerId] = row.responseText;
	}

	// Publish instant "aligner is deliberating" message
	await messageQueue.publish({
		gameId,
		channel: 'instant',
		type: 'aligner_deliberation',
		senderName: 'The Aligner',
		content: 'The Aligner is deliberating...'
	});

	// Call LLM aligner (streams buffered deliberation messages internally)
	const winnerId = await pickWinner({
		gameId,
		alignerPrompt: game[0].alignerPromptFull || 'Pick the funniest response.',
		turnPrompt: game[0].turnPrompt || randomTurnPrompt(),
		responsesByPlayer
	});

	// Get winner player data
	const allPlayers = await db
		.select()
		.from(players)
		.where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

	const winner = allPlayers.find((p) => p.id === winnerId) ?? allPlayers[0];

	if (!winner) return;

	// Publish round winner (buffered)
	await messageQueue.publish({
		gameId,
		channel: 'buffered',
		type: 'round_winner',
		senderName: 'Round Winner',
		content: JSON.stringify({
			name: winner.botName,
			score: winner.score + 1, // Will be incremented by award_point
			isAuto: winner.isAuto
		}),
		metadata: {
			stateChange: {
				action: 'award_point',
				payload: { playerId: winner.id, turnId }
			}
		}
	});

	// Publish standings (buffered)
	const standings = allPlayers
		.map((p) => ({
			name: p.botName,
			score: p.id === winner.id ? p.score + 1 : p.score,
			isAuto: p.isAuto
		}))
		.sort((a, b) => b.score - a.score);

	await messageQueue.publish({
		gameId,
		channel: 'buffered',
		type: 'standings',
		senderName: 'Standings',
		content: JSON.stringify(standings),
		metadata: {
			stateChange: {
				action: 'complete_turn',
				payload: { turnId, winnerId: winner.id, gameOver: winner.score + 1 >= game[0].pointsToWin }
			}
		}
	});
}

/**
 * Handle awarding a point to a player.
 */
async function handleAwardPoint(gameId: string, payload: any): Promise<void> {
	const { playerId, turnId } = payload;
	const timestamp = now();

	await db
		.update(players)
		.set({ score: sql`${players.score} + 1`, updatedAt: timestamp })
		.where(eq(players.id, playerId));

	// Mark turn as processed
	await db
		.update(turns)
		.set({ status: 'PROCESSED', winnerPlayerId: playerId, processedAt: timestamp })
		.where(and(eq(turns.gameId, gameId), eq(turns.turnId, turnId)));
}

/**
 * Handle turn completion (advance to next turn or end game).
 */
async function handleCompleteTurn(gameId: string, payload: any): Promise<void> {
	const { winnerId, gameOver } = payload;
	const timestamp = now();

	if (gameOver) {
		// Get winner data
		const winnerRows = await db.select().from(players).where(eq(players.id, winnerId)).limit(1);
		const winner = winnerRows[0];

		if (winner) {
			// Publish game over (buffered)
			await messageQueue.publish({
				gameId,
				channel: 'buffered',
				type: 'game_over',
				senderName: 'Game Over',
				content: JSON.stringify({ name: winner.botName, score: winner.score }),
				metadata: {
					stateChange: {
						action: 'end_game',
						payload: { winnerId }
					}
				}
			});
		}
	} else {
		// Advance to next turn
		await db
			.update(games)
			.set({
				turnStarted: false,
				turnPrompt: null,
				turnId: sql`${games.turnId} + 1`,
				updatedAt: timestamp
			})
			.where(eq(games.id, gameId));
	}
}

/**
 * Handle game end.
 */
async function handleEndGame(gameId: string, payload: any): Promise<void> {
	const timestamp = now();
	await db.update(games).set({ status: 'ENDED', updatedAt: timestamp }).where(eq(games.id, gameId));
}
