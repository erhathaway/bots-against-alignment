import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@libsql/client';

export const GET = async ({ url }) => {
	if (url.searchParams.get('db') !== null) {
		try {
			const dbUrl = env.DATABASE_URL;
			if (!dbUrl) return json({ status: 'ERROR', error: 'DATABASE_URL not set' }, { status: 500 });
			const client = createClient({ url: dbUrl });
			const result = await client.execute('SELECT 1 as ok');
			return json({
				status: 'OK',
				db: 'connected',
				rows: result.rows,
				dbUrl: dbUrl.replace(/authToken=[^&]+/, 'authToken=***')
			});
		} catch (e: unknown) {
			const err = e as Error;
			return json(
				{
					status: 'ERROR',
					db: 'failed',
					error: err.message,
					name: err.name,
					cause: err.cause ? String(err.cause) : undefined,
					stack: err.stack,
					dbUrl: env.DATABASE_URL?.replace(/authToken=[^&]+/, 'authToken=***')
				},
				{ status: 500 }
			);
		}
	}
	return json({ status: 'OK' });
};
