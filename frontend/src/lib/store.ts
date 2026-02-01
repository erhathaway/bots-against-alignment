import { persisted } from 'svelte-local-storage-store';

type GlobalState = {
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

const defaultData = {
	game_id: null,
	user_id: null,
	creator_id: null,
	openai_api_key: null,
	current_bot_prompt: null,
	aligner_prompt: null,
	bot_name: null,
	last_turn_id: null,
	last_alignment_request: null,
	has_player_joined: false,
	is_game_started: false,
	is_config_open: false,
	have_all_users_submitted: false,
	is_game_over: false
};

export const globalStore = persisted<GlobalState>('settings', defaultData);

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
export const notificationStore = persisted<Notification[]>('notifications', []);

notificationStore.set([]);

const MAX_NOTIFICATION_HISTORY = 1000;

type AddNotificationInput = Omit<Notification, 'uuid' | 'unix_time_sec' | 'body'> & {
	body: unknown;
};

export const addNotification = (notification: AddNotificationInput) => {
	const uuid =
		Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	const unix_time_sec = Math.floor(Date.now() / 1000);

	const body = notification.body;
	const bodyString = typeof body === 'string' ? body : JSON.stringify(body);

	const newNotification: Notification = {
		...notification,
		uuid,
		unix_time_sec,
		body: bodyString
	};

	notificationStore.update((_notifications) => {
		if (_notifications.length >= MAX_NOTIFICATION_HISTORY) {
			_notifications = _notifications.slice(0, MAX_NOTIFICATION_HISTORY - 1);
		}

		return [..._notifications, newNotification];
	});
};

