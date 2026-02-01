import { createHash } from 'node:crypto';

export const mockText = (seed: string) => {
	const digest = createHash('sha256').update(seed).digest('hex').slice(0, 8);
	return `mock-${digest}`;
};
