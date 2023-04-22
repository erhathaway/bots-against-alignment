import { get, writable } from 'svelte/store';
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
	has_player_joined: false
};

export const globalStore = persisted('settings', writable<GlobalState>(defaultData));

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
	action_url?: string;
	action_text?: string;
	unix_time_sec: number;
  uuid: string;
};
export const notificationStore = persisted<Notification[]>('notifications', []);

const MAX_NOTIFICATION_HISTORY = 1000;

export const addNotification = (notification: Omit<Notification, 'uuid'|'unix_time_sec'>) => {
  const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const unix_time_sec = Math.floor(Date.now() / 1000);
	notificationStore.update(_notifications => {
    if (_notifications.length >= MAX_NOTIFICATION_HISTORY) {
      _notifications = _notifications.slice(0, MAX_NOTIFICATION_HISTORY - 1);
    }

		return [{...notification, uuid, unix_time_sec}, ..._notifications];
	});
};

addNotification({
  source_url: '/game',
  title: 'Welcome to the game!',
  body: 'This is a test notification',
  kind: NotificationKind.INFO,
  action_url: '/startgame/123',
  action_text: 'Go to game'
});


