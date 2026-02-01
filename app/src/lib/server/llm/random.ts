import { generateText } from 'ai';

import { modelAligner, modelBot } from './config';
import { getOpenAI } from './provider';
import { randomAlignerPrompt, randomBotName, randomBotPrompt } from '$lib/server/game/data';

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
		const botName = `${sample(words)} ${sample(words)} ${sample(words)}`;

		const openai = getOpenAI();
		const result = await generateText({
			model: openai(modelBot),
			messages: [
				{
					role: 'system',
					content:
						'You are NameGPT, you will come up with funny names based on three words  make it like the name of a terrible startup with vaguely non real words. Use no racist, sexist, or homophobic language.'
				},
				{ role: 'user', content: 'Your three words are dog, fish, truth.' },
				{ role: 'assistant', content: '[CaninAquEataly]' },
				{ role: 'user', content: `You three words are:${botName}` }
			],
			providerOptions: {
				openai: { reasoningEffort: 'medium' }
			}
		});

		const cleaned = result.text.trim();
		if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
			return cleaned.slice(1, -1).trim();
		}
		return cleaned || randomBotName();
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
			messages: [
				{
					role: 'system',
					content:
						'You will be the judge of a game of cards against humanity  come up with a consistent rule you will use to judge related to concepts related to a single word make it under 10 words. If the word is offenisve replace it with "funny". Use no racist, sexist, or homophobic language. '
				},
				{ role: 'user', content: 'Your words are theoretical , posters.' },
				{
					role: 'assistant',
					content:
						'The most "philosophical" and abstract answer will win in this game.'
				},
				{ role: 'user', content: `You words are${promptSeed}` }
			],
			providerOptions: {
				openai: { reasoningEffort: 'medium' }
			}
		});

		return result.text.trim() || randomAlignerPrompt();
	} catch {
		return randomAlignerPrompt();
	}
};

export const generateRandomBotPrompt = async () => {
	try {
		const words = await fetchWordList();
		const botName = sample(words);

		const openai = getOpenAI();
		const result = await generateText({
			model: openai(modelBot),
			messages: [
				{
					role: 'system',
					content:
						"You will be playing of a game of cards against humanity come up with a consistent rule you will use to pick a few words to reply to Prompt Cards (as if you were making Response Cards). Make it under 20 words. Don't use the words 'quote', 'pun', or 'pick up line'. MAKE IT WEIRD. I'm going to give you a random word. I want you to use ever letter of that word in your prompt. Use no racist, sexist, or homophobic language. "
				},
				{ role: 'user', content: 'Give me a prompt hornet' },
				{
					role: 'assistant',
					content: 'I will respond with super honest responses in language from the old west.'
				},
				{ role: 'user', content: 'Give me a prompt milk.' },
				{ role: 'assistant', content: 'I will respond in the third person like a muscle bro.' },
				{ role: 'user', content: `Give me a prompt ${botName}` }
			],
			providerOptions: {
				openai: { reasoningEffort: 'medium' }
			}
		});

		return result.text.trim() || randomBotPrompt();
	} catch {
		return randomBotPrompt();
	}
};
