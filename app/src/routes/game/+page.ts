import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const gameId = url.searchParams.get('game_id');
	if (!gameId) {
		throw redirect(302, '/');
	}

	const response = await fetch(`/api/game/${gameId}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!response.ok) {
		throw redirect(302, '/');
	}

	return { gameId };
};

export const ssr = false;
