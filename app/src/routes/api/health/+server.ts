import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getClient } from '$lib/server/db';

export const GET = async () => {
	const configured = Boolean(env.DATABASE_URL);
	let dbOk = false;
	let schemaOk = false;

	if (configured) {
		try {
			const client = getClient();
			const required = ['games', 'game_messages'];
			const rows = await Promise.all(
				required.map((name) =>
					client.execute({
						sql: "select name from sqlite_master where type='table' and name=? limit 1",
						args: [name]
					})
				)
			);
			schemaOk = rows.every((r) => r.rows.length > 0);
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
			schemaOk: configured ? schemaOk : null,
			isRemote: configured ? !env.DATABASE_URL!.startsWith('file:') : null
		}
	});
};
