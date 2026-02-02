import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Use the web (HTTP) client for remote URLs to avoid native bindings that
// aren't available in serverless environments (e.g. Vercel).
const isLocalFile = env.DATABASE_URL.startsWith('file:');
const { createClient } = isLocalFile
	? await import('@libsql/client')
	: await import('@libsql/client/web');

const client = createClient({ url: env.DATABASE_URL });

export const db = drizzle(client, { schema });
export { schema };
