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
	is_collecting_aligner_prompts: false,
	has_submitted_aligner_prompt: false,
	have_all_users_submitted: false,
	is_game_over: false,
	last_turn_results: null
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

export async function leaveCurrentGame(): Promise<boolean> {
	const gameId = globalState.game_id;
	const playerId = globalState.user_id;
	if (!gameId || !playerId) return false;

	try {
		const response = await fetch(`/api/game/${gameId}/leave`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playerId })
		});

		if (response.ok) {
			Object.assign(globalState, { ...defaultState });
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

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

	$effect.root(() => {
		$effect(() => {
			const snapshot: GlobalState = { ...globalState };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		});
	});
}
