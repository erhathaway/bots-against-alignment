import { generateText } from 'ai';

import { modelBot } from './config';
import { getOpenAI } from './provider';

export const checkLLMAvailability = async () => {
	const openai = getOpenAI();
	const result = await generateText({
		model: openai(modelBot),
		messages: [{ role: 'user', content: 'Say OK.' }],
		maxOutputTokens: 5
	});
	if (!result.text || result.text.trim().length === 0) {
		throw new Error('LLM returned empty response');
	}
};
