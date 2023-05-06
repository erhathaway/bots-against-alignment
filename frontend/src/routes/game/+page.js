import { redirect } from '@sveltejs/kit';

const BACKEND_API = import.meta.env.VITE_BACKEND_API;

import { addNotification, globalStore, NotificationKind } from '$lib/store';

export async function load({ params, fetch, url }) {
	let gameID = null;
	let creatorID = null;
	url.searchParams.forEach((value, key) => {
		if (key === 'game_id') {
			gameID = value;
		}
	});
	let errorMessage;

	if (gameID) {
		const url = `${BACKEND_API}/game/${gameID}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});

		const _response = await response.json();
		if (!response.ok) {
			errorMessage = 'No game exists.';
			addNotification({
				source_url: '/game',
				title: 'Error finding game',
				body: _response,
				kind: NotificationKind.ERROR,
				action_url: '/game',
				action_text: 'start_game'
			});
			throw redirect(302, '/');
		} else {
			globalStore.update((data) => {
				const oldGameID = data.game_id;
				if (oldGameID !== gameID) {
					return { game_id: gameID };
				} else {
					return data;
				}
			});
		}
	} else {
		const url = `${BACKEND_API}/game`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});

		const _response = await response.json();
		if (response.ok) {
			const { game_id: newGameID, creator_id } = _response;
			gameID = newGameID;
			creatorID = creator_id;
			globalStore.set({ game_id: gameID, creator_id: creator_id, user_id: null });
		} else {
			errorMessage = 'Failed to create a new game.';
			addNotification({
				source_url: '/game',
				title: 'Error creating game',
				body: _response,
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
}

export const ssr = false;
