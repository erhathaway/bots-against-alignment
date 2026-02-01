import { createOpenAI } from '@ai-sdk/openai';
import { env } from '$env/dynamic/private';

export const getOpenAI = () => {
	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('OPENAI_API_KEY is not set');
	}
	return createOpenAI({ apiKey });
};
