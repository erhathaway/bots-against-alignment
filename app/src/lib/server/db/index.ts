import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Lazy-init: avoid creating the client at module-load time so SvelteKit's
// postbuild analysis doesn't crash when the web client is aliased but
// DATABASE_URL points to a local file (or isn't set yet).
let _db: LibSQLDatabase<typeof schema> | undefined;

export function getDb() {
	if (!_db) {
		if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
		const client = createClient({ url: env.DATABASE_URL });
		_db = drizzle(client, { schema });
	}
	return _db;
}

/** @deprecated Use getDb() instead — kept temporarily for migration. */
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
	get(_, prop) {
		const target = getDb();
		const value = Reflect.get(target, prop, target);
		if (typeof value === 'function') {
			return value.bind(target);
		}
		return value;
	}
});

export { schema };
