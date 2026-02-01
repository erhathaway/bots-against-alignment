import { redirect } from '@sveltejs/kit';

import { addNotification, globalStore, NotificationKind } from '$lib/store';

import type { PageLoad } from './$types';

const BACKEND_API = import.meta.env.VITE_BACKEND_API;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function parseCreateGameResponse(
	body: unknown
): { gameID: string; creatorID: string } | null {
	if (!isRecord(body)) return null;
	const gameID = body.game_id;
	const creatorID = body.creator_id;
	if (typeof gameID !== 'string' || typeof creatorID !== 'string') return null;
	return { gameID, creatorID };
}

export const load: PageLoad = async ({ fetch, url }) => {
	let gameID: string | null = url.searchParams.get('game_id');
	let creatorID: string | null = null;
	let errorMessage: string | undefined;

	if (gameID) {
		const apiUrl = `${BACKEND_API}/game/${gameID}`;
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});

		const body = (await response.json()) as unknown;
		if (!response.ok) {
			errorMessage = 'No game exists.';
			addNotification({
				source_url: '/game',
				title: 'Error finding game',
				body,
				kind: NotificationKind.ERROR,
				action_url: '/game',
				action_text: 'start_game'
			});
			throw redirect(302, '/');
		}

		globalStore.update((data) => {
			const oldGameID = data.game_id;
			if (oldGameID !== gameID) {
				return { ...data, game_id: gameID };
			}
			return data;
		});
	} else {
		const apiUrl = `${BACKEND_API}/game`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});

		const body = (await response.json()) as unknown;
		if (response.ok) {
			const parsed = parseCreateGameResponse(body);
			if (parsed) {
				gameID = parsed.gameID;
				creatorID = parsed.creatorID;
				globalStore.update((data) => ({
					...data,
					game_id: gameID,
					creator_id: creatorID,
					user_id: null,
					has_player_joined: false,
					is_game_started: false,
					have_all_users_submitted: false,
					is_game_over: false,
					last_turn_id: null,
					last_alignment_request: null
				}));
			} else {
				errorMessage = 'Failed to create a new game.';
				addNotification({
					source_url: '/game',
					title: 'Error creating game',
					body,
					kind: NotificationKind.ERROR,
					action_url: '/game',
					action_text: 'start_game'
				});
			}
		} else {
			errorMessage = 'Failed to create a new game.';
			addNotification({
				source_url: '/game',
				title: 'Error creating game',
				body,
				kind: NotificationKind.ERROR,
				action_url: '/game',
				action_text: 'start_game'
			});
		}
	}

	return {
		gameID,
		creatorID,
		errorMessage
	};
};

export const ssr = false;
