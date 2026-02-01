import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import Gun from 'gun';
import 'gun/axe.js';

const host = process.env.GUN_HOST?.trim() || '127.0.0.1';
const port = Number(process.env.GUN_PORT || '8765');
const dataDir = process.env.GUN_DATA_DIR?.trim();

if (!Number.isFinite(port)) {
	throw new Error(`Invalid GUN_PORT: ${process.env.GUN_PORT}`);
}

const gunFile = dataDir ? path.join(dataDir, 'radata') : undefined;
if (gunFile) {
	fs.mkdirSync(gunFile, { recursive: true });
}

const server = http.createServer((req, res) => {
	if (!req.url) {
		res.writeHead(400);
		res.end();
		return;
	}

	if (req.url === '/health') {
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify({ ok: true }));
		return;
	}

	return Gun.serve(req, res);
});

Gun({
	web: server,
	file: gunFile
});

server.listen(port, host, () => {
	// eslint-disable-next-line no-console
	console.log(`gun-relay listening on http://${host}:${port}/gun`);
});

