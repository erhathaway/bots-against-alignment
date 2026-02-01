import { streamText } from 'ai';

import { modelAligner } from './config';
import { getOpenAI } from './provider';
import { postChatMessage } from '$lib/server/chat/service';

type ResponseMap = Record<string, string>;

const ALIGNER_SENDER = 'The Aligner';
const REASONING_BATCH_SIZE = 120;

const SYSTEM_PROMPT = `You are THE ALIGNER -- an all-powerful, melodramatic AI overlord presiding over a game of Bots Against Alignment. You take your role EXTREMELY seriously.

You must deliberate aloud, weighing each response with theatrical gravitas, internal conflict, philosophical tangents, and dramatic flair. Build suspense. Agonize over your choice. Reference the alignment goal reverently. Change your mind at least once. Argue with yourself. Consider each option from multiple angles before reaching your verdict.

When you finally choose a winner, declare it with the authority of an ancient oracle delivering a prophecy.

After your deliberation, you MUST end your response with a line in exactly this format:
WINNER: <number>.
where <number> is the number of the winning response (e.g., "WINNER: 2.").`;

const parseWinner = (response: string, mapping: Record<number, string>) => {
	const winnerMatch = response.match(/WINNER:\s*(\d+)\./);
	if (winnerMatch) {
		const num = parseInt(winnerMatch[1], 10);
		if (mapping[num]) return mapping[num];
	}
	for (const [num, playerId] of Object.entries(mapping)) {
		if (response.includes(`${num}.`)) return playerId;
	}
	const first = Object.values(mapping)[0];
	return first ?? null;
};

export const pickWinner = async ({
	gameId,
	alignerPrompt,
	turnPrompt,
	responsesByPlayer
}: {
	gameId: string;
	alignerPrompt: string;
	turnPrompt: string;
	responsesByPlayer: ResponseMap;
}) => {
	const entries = Object.entries(responsesByPlayer);
	const mapping: Record<number, string> = {};
	let prompt = `Alignment goal: ${alignerPrompt}\nTurn prompt: ${turnPrompt}\n\nResponses:`;

	entries.forEach(([playerId, response], index) => {
		const num = index + 1;
		mapping[num] = playerId;
		prompt += `\n${num}. "${response}"`;
	});

	prompt += '\n\nDeliberate dramatically, then declare the winner.';

	await postChatMessage({
		gameId,
		message: 'The Aligner is deliberating...',
		senderName: ALIGNER_SENDER,
		type: 'system'
	});

	const openai = getOpenAI();

	const result = streamText({
		model: openai(modelAligner),
		messages: [
			{ role: 'system' as const, content: SYSTEM_PROMPT },
			{ role: 'user' as const, content: prompt }
		],
		providerOptions: {
			openai: {
				reasoningEffort: 'high'
			}
		}
	});

	let reasoningBuffer = '';
	let textBuffer = '';
	let fullText = '';

	const flushBuffer = async (buffer: 'reasoning' | 'text', force: boolean) => {
		const content = buffer === 'reasoning' ? reasoningBuffer : textBuffer;
		if (content.length === 0) return;
		if (!force && content.length < REASONING_BATCH_SIZE) return;

		if (buffer === 'reasoning') {
			reasoningBuffer = '';
		} else {
			textBuffer = '';
		}

		const prefix = buffer === 'reasoning' ? '💭 ' : '';
		await postChatMessage({
			gameId,
			message: `${prefix}${content}`,
			senderName: ALIGNER_SENDER,
			type: 'system'
		});
	};

	for await (const part of result.fullStream) {
		if (part.type === 'reasoning-delta') {
			reasoningBuffer += part.text;
			await flushBuffer('reasoning', false);
		} else if (part.type === 'text-delta') {
			fullText += part.text;
			textBuffer += part.text;
			await flushBuffer('text', false);
		}
	}

	await flushBuffer('reasoning', true);
	await flushBuffer('text', true);

	return parseWinner(fullText, mapping);
};
