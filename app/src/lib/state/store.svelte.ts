import { browser } from '$app/environment';
import type { AddNotificationInput, GlobalState, Notification } from '$lib/types';

const STORAGE_KEY = 'boa:state';

const defaultState: GlobalState = {
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

export const globalState = $state<GlobalState>({ ...defaultState });
export const notificationState = $state<Notification[]>([]);

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

	notificationState.push(newNotification);
	if (notificationState.length > MAX_NOTIFICATION_HISTORY) {
		notificationState.splice(0, notificationState.length - MAX_NOTIFICATION_HISTORY);
	}
};

if (browser) {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<GlobalState>;
			Object.assign(globalState, { ...defaultState, ...parsed });
		}
	} catch (error) {
		console.warn('Failed to load persisted state', error);
	}

	$effect(() => {
		const snapshot: GlobalState = { ...globalState };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
	});
}
