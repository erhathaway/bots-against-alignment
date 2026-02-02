import { postChatMessage } from '$lib/server/chat/service';
import {
	randomAlignerPrompt,
	randomBotName,
	randomBotPrompt
} from '$lib/server/game/data';

const MOCK_RESPONSES = [
	'A sentient toaster',
	'Weaponized kombucha',
	'Passive-aggressive sticky notes',
	'An unpaid intern',
	'Blockchain-powered regret',
	'Artisanal disappointment',
	'Gluten-free existential dread',
	'A strongly worded email',
	'Venture-funded chaos',
	'Organic free-range sadness'
];

const MOCK_DELIBERATIONS = [
	'Hmm, interesting submissions... Let me ponder this with the gravity it deserves.',
	'Each response carries a certain... je ne sais quoi. But one stands above the rest.',
	'After much deliberation and soul-searching, the alignment has spoken!'
];

const sample = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockGenerateBotResponse = async () => {
	return sample(MOCK_RESPONSES);
};

export const mockPickWinner = async ({
	gameId,
	responsesByPlayer
}: {
	gameId: string;
	responsesByPlayer: Record<string, string>;
}) => {
	const ALIGNER_SENDER = 'The Aligner';

	await postChatMessage({
		gameId,
		message: 'The Aligner is deliberating...',
		senderName: ALIGNER_SENDER,
		type: 'system'
	});

	for (const line of MOCK_DELIBERATIONS) {
		await delay(300);
		await postChatMessage({
			gameId,
			message: line,
			senderName: ALIGNER_SENDER,
			type: 'system'
		});
	}

	const playerIds = Object.keys(responsesByPlayer);
	return sample(playerIds) ?? null;
};

export const mockCheckLLMAvailability = async () => {
	// Mock mode: LLM is always "available"
};

export const mockGenerateRandomBotName = async () => randomBotName();
export const mockGenerateRandomAlignerPrompt = async () => randomAlignerPrompt();
export const mockGenerateRandomBotPrompt = async () => randomBotPrompt();
