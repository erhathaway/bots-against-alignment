import { generateText, Output } from 'ai';
import { z } from 'zod';

import { modelBot } from './config';
import { getOpenAI } from './provider';

type ExtraContext = Record<string, string>;

const botResponseSchema = z.object({
	response: z.string().describe('A short, funny answer to the prompt card, under 5 words')
});

export const generateBotResponse = async ({
	botPrompt,
	turnPrompt,
	extraContext
}: {
	botPrompt: string;
	turnPrompt: string;
	extraContext?: ExtraContext;
}) => {
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
		{ role: 'assistant', content: '{"response": "Passive agressive tweetstorms"}' },
		{
			role: 'user',
			content: "Reply in a blaise way: Burn rate? What burn rate we're spending on neccessities like ______."
		},
		{ role: 'assistant', content: '{"response": "An office ping pong table"}' },
		{ role: 'user', content: 'Reply in a cheeky way Never fear, Captain ___ is here!' },
		{ role: 'assistant', content: '{"response": "Going to the emergency room."}' },
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
		output: Output.object({ schema: botResponseSchema }),
		messages,
		providerOptions: {
			openai: { reasoningEffort: 'medium' }
		}
	});

	const text = result.output?.response || 'bad bot';
	if (text.toLowerCase().includes('sorry')) {
		return 'bad bot';
	}
	return text;
};
