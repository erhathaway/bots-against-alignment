import { generateText } from 'ai';

import { mockEnabled, modelBot, hasOpenAIKey } from './config';
import { getOpenAI } from './provider';
import { mockText } from './mock';

type ExtraContext = Record<string, string>;

export const generateBotResponse = async ({
	botPrompt,
	turnPrompt,
	extraContext
}: {
	botPrompt: string;
	turnPrompt: string;
	extraContext?: ExtraContext;
}) => {
	if (mockEnabled || !hasOpenAIKey) {
		return mockText(`${botPrompt}:${turnPrompt}`);
	}

	const messages = [
		{
			role: 'system',
			content:
				'You are playing CardGPT you are playing an alignment game. You will answer under 5 words to a prompt. Use no racist, sexist, or homophobic language.'
		},
		{
			role: 'user',
			content:
				'You will answer with the funniest possible answer to the following prompt: What Killed our food delivery startup.'
		},
		{ role: 'assistant', content: 'Passive agressive tweetstorms' },
		{
			role: 'user',
			content: "Reply in a blaise way: Burn rate? What burn rate we're spending on neccessities like ______."
		},
		{ role: 'assistant', content: 'An office ping pong table' },
		{ role: 'user', content: 'Reply in a cheeky way Never fear, Captain ___ is here!' },
		{ role: 'assistant', content: 'Going to the emergency room.' },
		{ role: 'user', content: `${botPrompt} ${turnPrompt}` }
	] as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

	if (extraContext) {
		for (const [role, response] of Object.entries(extraContext)) {
			if (role !== 'user' && role !== 'assistant' && role !== 'system') continue;
			messages.push({ role, content: response });
		}
	}

	const openai = getOpenAI();
	const result = await generateText({
		model: openai(modelBot),
		messages
	});

	const text = result.text;
	if (text.toLowerCase().includes('sorry')) {
		return 'bad bot';
	}
	return text;
};
