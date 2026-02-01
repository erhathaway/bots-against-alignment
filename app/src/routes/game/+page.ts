import { redirect } from '@sveltejs/kit';

import { isRecord, type JsonValue } from '$lib/types';

import type { PageLoad } from './$types';

function parseCreateGameResponse(body: JsonValue): { gameId: string; creatorId: string } | null {
	if (!isRecord(body)) return null;
	const gameId = body.gameId;
	const creatorId = body.creatorId;
	if (typeof gameId !== 'string' || typeof creatorId !== 'string') return null;
	return { gameId, creatorId };
}

export const load: PageLoad = async ({ fetch, url }) => {
	let gameId: string | null = url.searchParams.get('game_id');
	let creatorId: string | null = null;
	let errorMessage: string | undefined;

	if (gameId) {
		const response = await fetch(`/api/game/${gameId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			errorMessage = 'No game exists.';
			throw redirect(302, '/');
		}
	} else {
		const response = await fetch('/api/game', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});

		const body = (await response.json()) as JsonValue;
		if (response.ok) {
			const parsed = parseCreateGameResponse(body);
			if (parsed) {
				gameId = parsed.gameId;
				creatorId = parsed.creatorId;
			} else {
				errorMessage = 'Failed to create a new game.';
			}
		} else {
			errorMessage = 'Failed to create a new game.';
		}
	}

	return { gameId, creatorId, errorMessage };
};

export const ssr = false;
