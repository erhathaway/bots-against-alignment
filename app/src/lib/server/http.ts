import { json } from '@sveltejs/kit';
import { HttpError } from '$lib/server/errors';

export const jsonError = (status: number, message: string, details?: unknown) =>
	json({ error: message, details }, { status });

export const handleApiError = (error: unknown) => {
	if (error instanceof HttpError) {
		return jsonError(error.status, error.message);
	}
	console.error(error);
	return jsonError(500, 'Internal server error');
};
