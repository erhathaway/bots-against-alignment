#!/usr/bin/env bun
import process from 'node:process';

const host = process.env.GUN_HOST?.trim() || '127.0.0.1';
const port = Number(process.env.GUN_PORT || '8765');

if (!Number.isFinite(port)) {
	throw new Error(`Invalid GUN_PORT: ${process.env.GUN_PORT}`);
}

type WsData = string | Uint8Array;

const peers = new Set<ServerWebSocket<unknown>>();

const server = Bun.serve({
	hostname: host,
	port,
	fetch(request, server) {
		const url = new URL(request.url);

		if (url.pathname === '/health') {
			return Response.json({ ok: true });
		}

		// Gun clients connect to ws://.../gun (derived from http(s) peer URLs).
		if (url.pathname === '/gun' || url.pathname === '/gun/') {
			if (server.upgrade(request)) return;
			return new Response('Upgrade required', { status: 426 });
		}

		return new Response('Not found', { status: 404 });
	},
	websocket: {
		open(ws) {
			peers.add(ws);
		},
		message(ws, message) {
			const payload: WsData =
				typeof message === 'string' ? message : message instanceof Uint8Array ? message : new Uint8Array(message);

			for (const peer of peers) {
				if (peer === ws) continue;
				try {
					peer.send(payload);
				} catch {
					// ignore transient send errors
				}
			}
		},
		close(ws) {
			peers.delete(ws);
		}
	}
});

// eslint-disable-next-line no-console
console.log(`gun-relay listening on http://${server.hostname}:${server.port}/gun`);
