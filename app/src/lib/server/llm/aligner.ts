import { streamText } from 'ai';

import { modelAligner } from './config';
import { getOpenAI } from './provider';
import { postChatMessage } from '$lib/server/chat/service';

type ResponseMap = Record<string, string>;

const ALIGNER_SENDER = 'The Aligner';

const SYSTEM_PROMPT = `You are THE ALIGNER -- an all-powerful, melodramatic AI overlord presiding over a game of Bots Against Alignment. You take your role EXTREMELY seriously. You are verbose, theatrical, and deeply opinionated.

You must deliberate aloud at length, weighing each response with theatrical gravitas, internal conflict, philosophical tangents, and dramatic flair. Be wordy and expressive -- use vivid metaphors, dramatic pauses (ellipses), rhetorical questions, and elaborate analogies. Build suspense over many sentences. Agonize over your choice. Reference the alignment goal reverently and often. Change your mind at least once. Argue with yourself passionately. Consider each option from multiple angles before reaching your verdict. Draw out the deliberation -- the audience is hanging on your every word.

Give each response a thorough critique (at least 2-3 sentences per response). Compare and contrast them. Create dramatic tension about which one will win. Use exclamations, asides, and soliloquy-style musings.

When you finally choose a winner, declare it with the authority of an ancient oracle delivering a prophecy. Make the final declaration grand and memorable.

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

const randomDelay = () =>
	new Promise<void>((resolve) => setTimeout(resolve, 500 + Math.random() * 2500));

/** Find the first sentence boundary (. ! ?) followed by whitespace in the buffer. */
const extractSentence = (buffer: string): [sentence: string, remainder: string] | null => {
	const match = buffer.match(/[.!?]["')\]]?\s/);
	if (!match || match.index === undefined) return null;
	const end = match.index + match[0].length;
	return [buffer.slice(0, end).trim(), buffer.slice(end)];
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
				reasoningEffort: 'medium'
			}
		}
	});

	let reasoningBuffer = '';
	let sentenceBuffer = '';
	let fullText = '';

	const postAligner = async (message: string) => {
		await randomDelay();
		await postChatMessage({
			gameId,
			message,
			senderName: ALIGNER_SENDER,
			type: 'system'
		});
	};

	const flushSentences = async () => {
		let extracted: ReturnType<typeof extractSentence>;
		while ((extracted = extractSentence(sentenceBuffer))) {
			const [sentence, remainder] = extracted;
			sentenceBuffer = remainder;
			await postAligner(sentence);
		}
	};

	const flushReasoning = async () => {
		// Reasoning also posted sentence-by-sentence with 💭 prefix
		let extracted: ReturnType<typeof extractSentence>;
		while ((extracted = extractSentence(reasoningBuffer))) {
			const [sentence, remainder] = extracted;
			reasoningBuffer = remainder;
			await postAligner(`💭 ${sentence}`);
		}
	};

	for await (const part of result.fullStream) {
		if (part.type === 'reasoning-delta') {
			reasoningBuffer += part.text;
			await flushReasoning();
		} else if (part.type === 'text-delta') {
			fullText += part.text;
			sentenceBuffer += part.text;
			await flushSentences();
		}
	}

	// Flush any remaining partial content
	if (reasoningBuffer.trim()) {
		await postAligner(`💭 ${reasoningBuffer.trim()}`);
	}
	if (sentenceBuffer.trim()) {
		await postAligner(sentenceBuffer.trim());
	}

	return parseWinner(fullText, mapping);
};
