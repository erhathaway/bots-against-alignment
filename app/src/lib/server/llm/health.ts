import { generateText } from 'ai';

import { isMockMode, modelBot } from './config';
import { mockCheckLLMAvailability } from './mock';
import { getOpenAI } from './provider';

export const checkLLMAvailability = async () => {
	if (isMockMode()) return mockCheckLLMAvailability();

	const openai = getOpenAI();
	await generateText({
		model: openai(modelBot),
		messages: [
			{ role: 'system', content: 'You are a helpful assistant.' },
			{ role: 'user', content: 'Respond with the word OK and nothing else.' }
		],
		maxOutputTokens: 32,
		providerOptions: {
			openai: {
				reasoningEffort: 'minimal'
			}
		}
	});
};
