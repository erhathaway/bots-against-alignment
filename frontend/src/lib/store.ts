import { persisted } from 'svelte-local-storage-store';

import { type AddNotificationInput, type GlobalState, type Notification } from './types';

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

export const notificationStore = persisted<Notification[]>('notifications', []);

notificationStore.set([]);

const MAX_NOTIFICATION_HISTORY = 1000;

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
