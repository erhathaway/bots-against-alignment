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

notificationStore.set([])

const MAX_NOTIFICATION_HISTORY = 1000;

export const addNotification = (notification: Omit<Notification, 'uuid'|'unix_time_sec'>) => {
  const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const unix_time_sec = Math.floor(Date.now() / 1000);
	notificationStore.update(_notifications => {
    if (_notifications.length >= MAX_NOTIFICATION_HISTORY) {
      _notifications = _notifications.slice(0, MAX_NOTIFICATION_HISTORY - 1);
    }
		const body = notification.body;
		if (typeof body === 'object') {
			notification.body = JSON.stringify(body);
		}
		const newNotification = {
			...notification,
			uuid,
			unix_time_sec
		}
		console.log('New Notification:', newNotification);

		return [..._notifications, newNotification];
	});
};



