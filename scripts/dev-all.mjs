#!/usr/bin/env node
import { spawn } from 'node:child_process';

import { freePorts } from './free-ports.mjs';

const PORT_GUN = 8765;
const PORT_BACKEND = 8000;
const PORT_FRONTEND = 5173;

const TERM_TIMEOUT_MS = 5_000;
const KILL_TIMEOUT_MS = 2_000;

function prefixStream(stream, prefix, write) {
	let buffered = '';
	stream.on('data', (chunk) => {
		buffered += chunk.toString();
		while (true) {
			const idx = buffered.indexOf('\n');
			if (idx === -1) break;
			const line = buffered.slice(0, idx + 1);
			buffered = buffered.slice(idx + 1);
			write(`${prefix}${line}`);
		}
	});
	stream.on('end', () => {
		if (buffered) write(`${prefix}${buffered}\n`);
	});
}

function spawnService(name, command, args, options) {
	const child = spawn(command, args, {
		...options,
		stdio: ['inherit', 'pipe', 'pipe'],
		detached: true
	});

	prefixStream(child.stdout, `[${name}] `, (line) => process.stdout.write(line));
	prefixStream(child.stderr, `[${name}] `, (line) => process.stderr.write(line));

	return child;
}

async function sleep(ms) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function terminateProcessGroup(pid, signal) {
	try {
		process.kill(-pid, signal);
		return;
	} catch {
		// fall back to pid
	}
	try {
		process.kill(pid, signal);
	} catch {
		// ignore
	}
}

async function terminateChildren(children) {
	for (const child of children) {
		if (child.exitCode != null) continue;
		await terminateProcessGroup(child.pid, 'SIGTERM');
	}

	const deadline = Date.now() + TERM_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (children.every((child) => child.exitCode != null)) return;
		await sleep(200);
	}

	for (const child of children) {
		if (child.exitCode != null) continue;
		await terminateProcessGroup(child.pid, 'SIGKILL');
	}

	const killDeadline = Date.now() + KILL_TIMEOUT_MS;
	while (Date.now() < killDeadline) {
		if (children.every((child) => child.exitCode != null)) return;
		await sleep(200);
	}
}

async function main() {
	await freePorts([PORT_GUN, PORT_BACKEND, PORT_FRONTEND]);

	const children = [];
	let shuttingDown = false;

	const shutdown = async (code) => {
		if (shuttingDown) return;
		shuttingDown = true;
		await terminateChildren(children);
		process.exit(code);
	};

	process.on('SIGINT', () => shutdown(0));
	process.on('SIGTERM', () => shutdown(0));

	children.push(
		spawnService('gun', 'node', ['frontend/scripts/gun-relay.js'], {
			env: {
				...process.env,
				GUN_HOST: '127.0.0.1',
				GUN_PORT: String(PORT_GUN),
				GUN_DATA_DIR: '.gun'
			}
		})
	);

	children.push(
		spawnService('backend', 'bash', ['-lc', `cd backend && poetry run uvicorn src:app --host 127.0.0.1 --port ${PORT_BACKEND} --log-level info`], {
			env: { ...process.env }
		})
	);

	children.push(
		spawnService(
			'frontend',
			'bash',
			[
				'-lc',
				`cd frontend && VITE_BACKEND_API=http://127.0.0.1:${PORT_BACKEND} VITE_GUN_PEER=http://127.0.0.1:${PORT_GUN}/gun npm run dev -- --host 127.0.0.1 --port ${PORT_FRONTEND}`
			],
			{ env: { ...process.env } }
		)
	);

	for (const child of children) {
		child.on('exit', (code, signal) => {
			if (shuttingDown) return;
			const exitCode =
				code ?? (signal && (signal === 'SIGINT' || signal === 'SIGTERM') ? 0 : signal ? 1 : 0);
			console.error(`[dev] ${signal ? `Exited with signal ${signal}` : `Exited with code ${code}`}`);
			shutdown(exitCode);
		});
	}
}

main().catch((err) => {
	console.error(err instanceof Error ? err.stack : err);
	process.exitCode = 1;
});
