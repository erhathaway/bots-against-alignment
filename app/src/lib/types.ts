export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export const isRecord = (value: JsonValue): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export type AlignmentResponse = {
	playerId: string;
	name: string;
	text: string;
	score: number;
	isRoundWinner: boolean;
	isGlobalWinner: boolean;
};

export type BotInfo = {
	id: string;
	name: string;
	points: number;
	turnComplete: boolean;
	isHost: boolean;
	isAuto: boolean;
};

export type GlobalState = {
	game_id: string | null;
	user_id: string | null;
	creator_id: string | null;
	openai_api_key: string | null;
	current_bot_prompt: string | null;
	aligner_prompt: string | null;
	bot_name: string | null;
	last_turn_id: number | null;
	has_player_joined: boolean;
	is_game_started: boolean;
	is_config_open: boolean;
	last_alignment_request: string | null;
	is_collecting_aligner_prompts: boolean;
	has_submitted_aligner_prompt: boolean;
	have_all_users_submitted: boolean;
	is_game_over: boolean;
	last_turn_results: AlignmentResponse[] | null;
};

export enum NotificationKind {
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
	SUGGESTION = 'SUGGESTION'
}

export type Notification = {
	source_url: string;
	title: string;
	body: string;
	kind: NotificationKind;
	action_url?: string | null;
	action_text?: string | null;
	unix_time_sec: number;
	uuid: string;
};

export type AddNotificationInput = Omit<Notification, 'uuid' | 'unix_time_sec' | 'body'> & {
	body: JsonValue;
};
