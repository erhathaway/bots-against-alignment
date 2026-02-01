import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const games = sqliteTable('games', {
	id: text('id').primaryKey(),
	creatorId: text('creator_id').notNull(),
	creatorPlayerId: text('creator_player_id'),
	status: text('status', { enum: ['LOBBY', 'STARTED', 'ENDED'] }).notNull(),
	pointsToWin: integer('points_to_win').notNull().default(10),
	alignerType: text('aligner_type', {
		enum: ['USER_ROUND_ROBIN', 'LAST_WON_USER', 'BOT_WITH_HIDDEN_PROMPT', 'BOT_WITH_USER_PROMPT']
	})
		.notNull()
		.default('USER_ROUND_ROBIN'),
	maxAutoPlayers: integer('max_auto_players').notNull().default(0),
	turnId: integer('turn_id').notNull().default(1),
	turnStarted: integer('turn_started', { mode: 'boolean' }).notNull().default(false),
	turnPrompt: text('turn_prompt'),
	alignerPromptFull: text('aligner_prompt_full').notNull().default(''),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const players = sqliteTable('players', {
	id: text('id').primaryKey(),
	gameId: text('game_id')
		.notNull()
		.references(() => games.id, { onDelete: 'cascade' }),
	botName: text('bot_name').notNull(),
	botPrompt: text('bot_prompt').notNull(),
	submittedBotPrompt: text('submitted_bot_prompt').notNull(),
	promptsRemaining: integer('prompts_remaining').notNull(),
	score: integer('score').notNull().default(0),
	isAuto: integer('is_auto', { mode: 'boolean' }).notNull().default(false),
	turnComplete: integer('turn_complete', { mode: 'boolean' }).notNull().default(false),
	leftAt: integer('left_at'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const alignerPrompts = sqliteTable(
	'aligner_prompts',
	{
		gameId: text('game_id')
			.notNull()
			.references(() => games.id, { onDelete: 'cascade' }),
		playerId: text('player_id')
			.notNull()
			.references(() => players.id, { onDelete: 'cascade' }),
		prompt: text('prompt').notNull()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.gameId, table.playerId] })
	})
);

export const turns = sqliteTable(
	'turns',
	{
		gameId: text('game_id')
			.notNull()
			.references(() => games.id, { onDelete: 'cascade' }),
		turnId: integer('turn_id').notNull(),
		prompt: text('prompt').notNull(),
		status: text('status', { enum: ['OPEN', 'PROCESSED'] }).notNull().default('OPEN'),
		winnerPlayerId: text('winner_player_id').references(() => players.id, { onDelete: 'set null' }),
		processedAt: integer('processed_at')
	},
	(table) => ({
		pk: primaryKey({ columns: [table.gameId, table.turnId] })
	})
);

export const turnResponses = sqliteTable(
	'turn_responses',
	{
		gameId: text('game_id')
			.notNull()
			.references(() => games.id, { onDelete: 'cascade' }),
		turnId: integer('turn_id').notNull(),
		playerId: text('player_id')
			.notNull()
			.references(() => players.id, { onDelete: 'cascade' }),
		responseText: text('response_text').notNull()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.gameId, table.turnId, table.playerId] })
	})
);

export const chatMessages = sqliteTable('chat_messages', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	gameId: text('game_id')
		.notNull()
		.references(() => games.id, { onDelete: 'cascade' }),
	senderName: text('sender_name'),
	message: text('message').notNull(),
	type: text('type', { enum: ['chat', 'status', 'system'] })
		.notNull()
		.default('chat'),
	createdAt: integer('created_at').notNull()
});

export const rateLimits = sqliteTable('rate_limits', {
	key: text('key').primaryKey(),
	count: integer('count').notNull(),
	windowStart: integer('window_start').notNull(),
	updatedAt: integer('updated_at').notNull()
});
