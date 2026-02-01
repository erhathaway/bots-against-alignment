import { generateText, Output } from 'ai';
import { z } from 'zod';

import { modelAligner, modelBot } from './config';
import { getOpenAI } from './provider';
import { randomAlignerPrompt, randomBotName, randomBotPrompt } from '$lib/server/game/data';

const botNameSchema = z.object({
	name: z.string().describe('A single funny startup-style name, 1-4 words')
});

const alignerPromptSchema = z.object({
	prompt: z.string().describe('A judging rule for a cards-against-humanity-style game, under 10 words')
});

const botPromptSchema = z.object({
	prompt: z.string().describe('A bot behavior rule, under 20 words, starting with "I will respond..."')
});

const fallbackWords = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf'];

const fetchWordList = async (): Promise<string[]> => {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const response = await fetch('https://www.mit.edu/~ecprice/wordlist.10000', {
			signal: controller.signal
		});
		clearTimeout(timeout);
		if (!response.ok) return fallbackWords;
		const text = await response.text();
		const words = text
			.split('\n')
			.map((word) => word.trim())
			.filter(Boolean);
		return words.length ? words : fallbackWords;
	} catch {
		return fallbackWords;
	}
};

const sample = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export const generateRandomBotName = async () => {
	try {
		const words = await fetchWordList();
		const seedWords = `${sample(words)}, ${sample(words)}, ${sample(words)}`;

		const openai = getOpenAI();
		const result = await generateText({
			model: openai(modelBot),
			output: Output.object({ schema: botNameSchema }),
			messages: [
				{
					role: 'system',
					content:
						'You are NameGPT. Given three random words, mash them together into ONE funny fake startup name. The name should be 1-3 words, use vaguely non-real words (like portmanteaus), and sound like a terrible tech startup. Return ONLY the name. No racist, sexist, or homophobic language.'
				},
				{ role: 'user', content: 'Your three words are: dog, fish, truth.' },
				{ role: 'assistant', content: '{"name": "CaninAquEataly"}' },
				{ role: 'user', content: 'Your three words are: moon, keyboard, salad.' },
				{ role: 'assistant', content: '{"name": "LunaTypoGreens"}' },
				{ role: 'user', content: `Your three words are: ${seedWords}` }
			],
			providerOptions: {
				openai: { reasoningEffort: 'medium' }
			}
		});

		return result.output?.name || randomBotName();
	} catch {
		return randomBotName();
	}
};

export const generateRandomAlignerPrompt = async () => {
	try {
		const words = await fetchWordList();
		const promptSeed = `${sample(words)}, ${sample(words)}`;

		const openai = getOpenAI();
		const result = await generateText({
			model: openai(modelAligner),
			output: Output.object({ schema: alignerPromptSchema }),
			messages: [
				{
					role: 'system',
					content:
						'You are the judge of a cards-against-humanity-style game. Come up with a consistent judging rule related to concepts inspired by the given words. Keep it under 10 words. If a word is offensive, replace it with "funny". No racist, sexist, or homophobic language.'
				},
				{ role: 'user', content: 'Your words are: theoretical, posters.' },
				{
					role: 'assistant',
					content:
						'{"prompt": "The most philosophical and abstract answer wins."}'
				},
				{ role: 'user', content: `Your words are: ${promptSeed}` }
			],
			providerOptions: {
				openai: { reasoningEffort: 'medium' }
			}
		});

		return result.output?.prompt || randomAlignerPrompt();
	} catch {
		return randomAlignerPrompt();
	}
};

export const generateRandomBotPrompt = async () => {
	try {
		const words = await fetchWordList();
		const word = sample(words);

		const openai = getOpenAI();
		const result = await generateText({
			model: openai(modelBot),
			output: Output.object({ schema: botPromptSchema }),
			messages: [
				{
					role: 'system',
					content:
						"You are playing a cards-against-humanity-style game. Come up with a consistent rule for picking a few words to reply to Prompt Cards. Make it under 20 words. Don't use the words 'quote', 'pun', or 'pick up line'. MAKE IT WEIRD. I'm going to give you a random word. Use every letter of that word in your prompt. No racist, sexist, or homophobic language."
				},
				{ role: 'user', content: 'Give me a prompt for: hornet' },
				{
					role: 'assistant',
					content:
						'{"prompt": "I will respond with super honest responses in language from the old west."}'
				},
				{ role: 'user', content: 'Give me a prompt for: milk' },
				{
					role: 'assistant',
					content: '{"prompt": "I will respond in the third person like a muscle bro."}'
				},
				{ role: 'user', content: `Give me a prompt for: ${word}` }
			],
			providerOptions: {
				openai: { reasoningEffort: 'medium' }
			}
		});

		return result.output?.prompt || randomBotPrompt();
	} catch {
		return randomBotPrompt();
	}
};
