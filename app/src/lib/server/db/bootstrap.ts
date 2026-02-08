import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getClient } from './index';

function splitStatements(sqlText: string) {
	// drizzle-kit uses this marker between statements in generated .sql files
	return sqlText
		.split(/--> statement-breakpoint\s*/g)
		.map((s) => s.trim())
		.filter(Boolean);
}

function isSafeToIgnoreMigrationError(message: string) {
	// In serverless, multiple cold starts can race; these are the common harmless cases.
	const m = message.toLowerCase();
	return (
		m.includes('already exists') ||
		m.includes('duplicate column') ||
		m.includes('duplicate') ||
		m.includes('constraint failed') // usually from concurrent creation/insert
	);
}

const migrationSqlModules = import.meta.glob('../../../../drizzle/*.sql', {
	as: 'raw',
	eager: true
}) as Record<string, string>;

function getMigrationSqlFiles() {
	return Object.entries(migrationSqlModules)
		.map(([path, sqlText]) => ({
			path,
			sqlText
		}))
		.sort((a, b) => a.path.localeCompare(b.path));
}

async function hasTable(tableName: string) {
	const client = getClient();
	const result = await client.execute({
		sql: `select name from sqlite_master where type='table' and name=? limit 1`,
		args: [tableName]
	});
	return result.rows.length > 0;
}

export async function ensureDbBootstrapped() {
	// This app is designed for a remote LibSQL/Turso DB in production (Vercel can't use native SQLite bindings).
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set');
	}
	if (!dev && env.DATABASE_URL.startsWith('file:')) {
		throw new Error(
			'DATABASE_URL uses file: in production. On Vercel, configure a remote LibSQL/Turso DATABASE_URL instead.'
		);
	}

	// Fast path: schema is present. We check a small set of required tables because
	// some deployments may have a partially-migrated/older schema.
	const requiredTables = [
		'games',
		'players',
		'game_messages',
		'aligner_prompts',
		'turns',
		'turn_responses',
		'rate_limits'
	];
	const missingTables: string[] = [];
	for (const table of requiredTables) {
		if (!(await hasTable(table))) missingTables.push(table);
	}
	if (!missingTables.length) return;

	const migrations = getMigrationSqlFiles();
	if (!migrations.length) {
		throw new Error('No migration SQL files found under app/drizzle/*.sql');
	}

	const client = getClient();
	console.log('[db] Bootstrapping schema (missing tables)', missingTables);

	for (const mig of migrations) {
		const statements = splitStatements(mig.sqlText);
		for (const statement of statements) {
			try {
				await client.execute(statement);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				if (isSafeToIgnoreMigrationError(message)) continue;
				console.error('[db] Migration failed:', { migration: mig.path, message });
				throw error;
			}
		}
	}

	// Re-check required tables.
	const stillMissing: string[] = [];
	for (const table of requiredTables) {
		if (!(await hasTable(table))) stillMissing.push(table);
	}
	if (stillMissing.length) {
		throw new Error(
			`DB bootstrap finished but tables are still missing: ${stillMissing.join(', ')}`
		);
	}

	console.log('[db] Schema bootstrap complete');
}
