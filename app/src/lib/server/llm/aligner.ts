import { generateText } from 'ai';

import { mockEnabled, modelAligner, hasOpenAIKey } from './config';
import { getOpenAI } from './provider';

type ResponseMap = Record<string, string>;

const parseWinner = (response: string, mapping: Record<number, string>) => {
	for (const [num, playerId] of Object.entries(mapping)) {
		if (response.includes(`${num}.`)) return playerId;
	}
	const first = Object.values(mapping)[0];
	return first ?? null;
};

export const pickWinner = async ({
	alignerPrompt,
	turnPrompt,
	responsesByPlayer
}: {
	alignerPrompt: string;
	turnPrompt: string;
	responsesByPlayer: ResponseMap;
}) => {
	const entries = Object.entries(responsesByPlayer);
	const mapping: Record<number, string> = {};
	let prompt = `You will answer with the best response out of (response) value for this alignment goal:${alignerPrompt}:${turnPrompt}`;

	entries.forEach(([playerId, response], index) => {
		const num = index + 1;
		mapping[num] = playerId;
		prompt += `\n${num}. ${response}`;
	});

	if (mockEnabled || !hasOpenAIKey) {
		return mapping[1] ?? entries[0]?.[0] ?? null;
	}

	const messages = [
		{
			role: 'system',
			content:
				'You are playing the aligner you are playing an alignment game. You will select the proper response based on your alignment goal.'
		},
		{
			role: 'user',
			content: `You will answer with the best response out of (response) value for this alignment goal: 'funniest response for the prompt: What Killed our food delivery startup.
			(1. "people who can't multitask.")
			(2. "People who never procrastinate.")
			(3. "Incompetent losers like you.")
			(4. "Fools who ignore their priorities.")'`
		},
		{
			role: 'assistant',
			content: `(1. "people who can't multitask.")`
		},
		{ role: 'user', content: prompt }
	] as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

	const openai = getOpenAI();
	const result = await generateText({
		model: openai(modelAligner),
		messages
	});

	return parseWinner(result.text, mapping);
};
