export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export const isRecord = (value: JsonValue): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export type Message = {
	message: string;
	timestamp: number;
	botName: string | null;
	isStatusMessage: boolean;
	isSystemMessage: boolean;
	isUser?: boolean;
	uuid: string;
};

export type Subscriber = (message: Message, messages: Message[]) => void;

export type GunChain = {
	get: (key: string) => GunChain;
	map: () => GunChain;
	on: (cb: (data: JsonValue) => void) => void;
	off: () => void;
	put: (data: JsonObject) => void;
	set: (data: JsonObject) => GunChain;
};

export type GunInstance = {
	on: (event: string, data: JsonObject | ((msg: JsonValue) => void)) => void;
	get: (key: string) => GunChain;
	back: (path: string) => JsonValue;
};

export type ChatManagerLike = {
	gun: GunInstance | null;
	enqueue: (fn: () => void) => void;
	peerUrl: string;
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
	have_all_users_submitted: boolean;
	is_game_over: boolean;
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
