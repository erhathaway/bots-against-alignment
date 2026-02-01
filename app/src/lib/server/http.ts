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

export const getClientAddressSafe = (event: {
	getClientAddress?: () => string;
	request: Request;
}) => {
	try {
		if (event.getClientAddress) {
			return event.getClientAddress();
		}
	} catch {
		// fall back to headers
	}
	const forwarded = event.request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0]?.trim() || 'unknown';
	}
	return event.request.headers.get('x-real-ip')?.trim() || 'unknown';
};
