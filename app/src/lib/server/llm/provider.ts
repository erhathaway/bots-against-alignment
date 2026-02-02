import { createOpenAI } from '@ai-sdk/openai';
import { env } from '$env/dynamic/private';

import { serviceUnavailable } from '$lib/server/errors';

export const getOpenAI = () => {
	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		throw serviceUnavailable('OPENAI_API_KEY is not set — LLM features are unavailable');
	}
	return createOpenAI({ apiKey });
};
