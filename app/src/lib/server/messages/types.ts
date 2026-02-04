/**
 * Message Types and Interfaces for Message-Driven Game Flow
 *
 * Messages are the core of the game flow system. They can be published to
 * either an instant channel (immediate delivery) or a buffered channel
 * (sequential time windows). Messages carry metadata that triggers game
 * state changes.
 */

export type MessageChannel = 'instant' | 'buffered';

/**
 * Message types categorized by channel:
 *
 * Instant: player_joined, player_left, countdown_started, game_started,
 *          aligner_prompt_submitted, chat
 *
 * Buffered: turn_started, bot_response, aligner_deliberation,
 *           round_winner, standings, game_over
 */
export type MessageType =
	// Instant messages
	| 'player_joined'
	| 'player_left'
	| 'countdown_started'
	| 'game_started'
	| 'aligner_prompt_submitted'
	| 'chat'
	// Buffered messages
	| 'turn_started'
	| 'bot_response'
	| 'aligner_deliberation'
	| 'round_winner'
	| 'standings'
	| 'game_over';

/**
 * State actions that can be triggered by message metadata.
 * These are processed by the StateChangeProcessor.
 */
export type StateAction =
	| 'start_countdown'
	| 'start_game'
	| 'start_aligner_setup'
	| 'complete_aligner_setup'
	| 'start_turn'
	| 'submit_bot_response'
	| 'complete_turn'
	| 'award_point'
	| 'end_game';

/**
 * Metadata attached to messages that triggers game state changes.
 */
export interface MessageMetadata {
	stateChange?: GameStateChange;
	data?: Record<string, unknown>;
}

/**
 * Describes a state change to be processed when a message is published.
 */
export interface GameStateChange {
	action: StateAction;
	payload?: Record<string, unknown>;
}

/**
 * Core message structure stored in database and processed by queue.
 */
export interface GameMessage {
	id?: number; // Auto-increment ID (set by DB)
	gameId: string;
	channel: MessageChannel;
	type: MessageType;
	senderName?: string | null; // Display name for chat
	content: string; // Text content or JSON payload
	metadata?: MessageMetadata | null; // Triggers game state changes
	bufferDuration?: number | null; // Milliseconds (buffered only)
	publishedAt?: number | null; // Timestamp when published to clients
	windowEndsAt?: number | null; // publishedAt + bufferDuration
	createdAt: number; // Timestamp when created
}

/**
 * Message creation payload (before DB insert).
 */
export interface CreateMessageInput {
	gameId: string;
	channel: MessageChannel;
	type: MessageType;
	senderName?: string | null;
	content: string;
	metadata?: MessageMetadata | null;
	bufferDuration?: number | null;
}

/**
 * Default buffer durations (milliseconds) per message type.
 */
export const DEFAULT_BUFFER_DURATIONS: Record<string, number> = {
	turn_started: 5000, // 5s - Let players see the turn prompt
	bot_response: 5000, // 5s - Show each bot's answer individually
	aligner_deliberation: 2000, // 2s - Stream aligner's dramatic sentences
	round_winner: 7000, // 7s - Highlight winner with drama
	standings: 5000, // 5s - Show scoreboard
	game_over: 10000 // 10s - Final celebration screen
};

/**
 * Get default buffer duration for a message type.
 */
export function getDefaultBufferDuration(type: MessageType): number {
	return DEFAULT_BUFFER_DURATIONS[type] ?? 5000;
}

/**
 * Check if a message type should use buffered channel by default.
 */
export function isBufferedMessageType(type: MessageType): boolean {
	const bufferedTypes: MessageType[] = [
		'turn_started',
		'bot_response',
		'aligner_deliberation',
		'round_winner',
		'standings',
		'game_over'
	];
	return bufferedTypes.includes(type);
}

/**
 * Helper to create a message with sensible defaults.
 */
export function createMessage(input: CreateMessageInput): GameMessage {
	const channel = input.channel;
	const bufferDuration =
		channel === 'buffered'
			? input.bufferDuration ?? getDefaultBufferDuration(input.type)
			: null;

	return {
		gameId: input.gameId,
		channel,
		type: input.type,
		senderName: input.senderName ?? null,
		content: input.content,
		metadata: input.metadata ?? null,
		bufferDuration,
		publishedAt: null,
		windowEndsAt: null,
		createdAt: Date.now()
	};
}
