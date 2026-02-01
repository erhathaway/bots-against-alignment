import { eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { rateLimits } from '$lib/server/db/schema';

type RateLimitConfig = {
	key: string;
	limit: number;
	windowMs: number;
};

export const rateLimit = async ({ key, limit, windowMs }: RateLimitConfig) => {
	const now = Date.now();
	const windowStart = now - (now % windowMs);
	const bucketKey = `${key}:${windowStart}`;

	const existingRows = await db
		.select()
		.from(rateLimits)
		.where(eq(rateLimits.key, bucketKey))
		.limit(1);
	const existing = existingRows[0];

	if (!existing) {
		try {
			await db.insert(rateLimits).values({
				key: bucketKey,
				count: 1,
				windowStart,
				updatedAt: now
			});
			return {
				allowed: true,
				remaining: limit - 1,
				resetAt: windowStart + windowMs
			};
		} catch {
			// Another request inserted the same bucket; fall through to update path.
		}
	}

	const current =
		existing ??
		(
			await db.select().from(rateLimits).where(eq(rateLimits.key, bucketKey)).limit(1)
		)[0];

	if (!current) {
		return {
			allowed: true,
			remaining: limit - 1,
			resetAt: windowStart + windowMs
		};
	}

	if (current.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			resetAt: windowStart + windowMs
		};
	}

	await db
		.update(rateLimits)
		.set({ count: current.count + 1, updatedAt: now })
		.where(eq(rateLimits.key, bucketKey));

	return {
		allowed: true,
		remaining: limit - (current.count + 1),
		resetAt: windowStart + windowMs
	};
};
