#!/usr/bin/env bun
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFile = promisify(execFileCb);

const TERM_TIMEOUT_MS = 5_000;
const KILL_TIMEOUT_MS = 2_000;
const POLL_INTERVAL_MS = 200;

async function which(cmd: string) {
	try {
		const { stdout } = await execFile('bash', ['-lc', `command -v ${cmd}`]);
		return stdout.trim() || null;
	} catch {
		return null;
	}
}

async function getListeningPids(port: number) {
	const lsof = await which('lsof');
	if (lsof) {
		try {
			const { stdout } = await execFile('lsof', [
				'-nP',
				`-iTCP:${port}`,
				'-sTCP:LISTEN',
				'-t'
			]);
			return [
				...new Set(
					stdout
						.split('\n')
						.map((line) => line.trim())
						.filter(Boolean)
						.map((pid) => Number(pid))
						.filter((pid) => Number.isFinite(pid))
				)
			];
		} catch {
			return [];
		}
	}

	throw new Error(
		"Couldn't find a tool to discover PIDs by port (expected `lsof` to be available)."
	);
}

async function getProcessGroupId(pid: number) {
	try {
		const { stdout } = await execFile('ps', ['-o', 'pgid=', '-p', String(pid)]);
		const pgid = Number(stdout.trim());
		if (Number.isFinite(pgid) && pgid > 1) return pgid;
	} catch {
		// ignore
	}
	return null;
}

async function sleep(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPortFree(port: number, timeoutMs: number) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const pids = await getListeningPids(port);
		if (pids.length === 0) return true;
		await sleep(POLL_INTERVAL_MS);
	}
	return (await getListeningPids(port)).length === 0;
}

async function signalByPort(port: number, signal: string) {
	const pids = await getListeningPids(port);
	if (pids.length === 0) return { didSignal: false, pids: [] as number[] };

	const pgids = new Set<number>();
	for (const pid of pids) {
		const pgid = await getProcessGroupId(pid);
		if (pgid) pgids.add(pgid);
	}

	// Prefer signaling the process groups (covers uvicorn reloaders, node children, etc.).
	// Fall back to signaling individual PIDs.
	let didSignal = false;
	for (const pgid of pgids) {
		try {
			process.kill(-pgid, signal);
			didSignal = true;
		} catch {
			// ignore
		}
	}
	for (const pid of pids) {
		try {
			process.kill(pid, signal);
			didSignal = true;
		} catch {
			// ignore
		}
	}

	return { didSignal, pids };
}

export async function freePorts(ports: number[]) {
	for (const port of ports) {
		const initialPids = await getListeningPids(port);
		if (initialPids.length === 0) continue;

		console.log(
			`Port ${port} is in use (pid${initialPids.length === 1 ? '' : 's'}: ${initialPids.join(
				', '
			)}); sending SIGTERM...`
		);
		await signalByPort(port, 'SIGTERM');

		const freedAfterTerm = await waitForPortFree(port, TERM_TIMEOUT_MS);
		if (freedAfterTerm) {
			console.log(`Port ${port} is now free.`);
			continue;
		}

		const remainingPids = await getListeningPids(port);
		console.log(
			`Port ${port} still in use after ${TERM_TIMEOUT_MS}ms (pid${
				remainingPids.length === 1 ? '' : 's'
			}: ${remainingPids.join(', ')}); sending SIGKILL...`
		);
		await signalByPort(port, 'SIGKILL');

		const freedAfterKill = await waitForPortFree(port, KILL_TIMEOUT_MS);
		if (!freedAfterKill) {
			const finalPids = await getListeningPids(port);
			throw new Error(
				`Failed to free port ${port}. Still listening pid${
					finalPids.length === 1 ? '' : 's'
				}: ${finalPids.join(', ')}`
			);
		}

		console.log(`Port ${port} is now free.`);
	}
}

function parsePorts(argv: string[]) {
	const ports = argv.map((value) => Number(value));
	for (const port of ports) {
		if (!Number.isInteger(port) || port <= 0 || port > 65535) {
			throw new Error(`Invalid port: ${port}`);
		}
	}
	return ports;
}

async function main() {
	const ports = parsePorts(process.argv.slice(2));
	if (ports.length === 0) {
		console.error('Usage: free-ports.ts <port> [port...]');
		process.exitCode = 2;
		return;
	}
	await freePorts(ports);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((err) => {
		console.error(err instanceof Error ? err.message : err);
		process.exitCode = 1;
	});
}
