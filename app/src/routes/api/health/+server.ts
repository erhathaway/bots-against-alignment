import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getClient } from '$lib/server/db';

export const GET = async () => {
	const configured = Boolean(env.DATABASE_URL);
	let dbOk = false;

	if (configured) {
		try {
			const client = getClient();
			// Query sqlite_master so this succeeds even before migrations.
			await client.execute(
				"select name from sqlite_master where type='table' and name='games' limit 1"
			);
			dbOk = true;
		} catch {
			dbOk = false;
		}
	}

	return json({
		status: 'OK',
		db: {
			configured,
			ok: dbOk,
			isRemote: configured ? !env.DATABASE_URL!.startsWith('file:') : null
		}
	});
};
