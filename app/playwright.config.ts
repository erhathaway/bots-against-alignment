import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';

if (process.platform === 'darwin' && process.arch === 'arm64' && os.cpus().length === 0) {
	const ver = os.release().split('.').map((a) => Number.parseInt(a, 10));
	let macVersion = '';
	if (ver[0] < 18) {
		macVersion = 'mac10.13';
	} else if (ver[0] === 18) {
		macVersion = 'mac10.14';
	} else if (ver[0] === 19) {
		macVersion = 'mac10.15';
	} else {
		const LAST_STABLE_MACOS_MAJOR_VERSION = 15;
		macVersion = `mac${Math.min(ver[0] - 9, LAST_STABLE_MACOS_MAJOR_VERSION)}-arm64`;
	}
	process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE ??= macVersion;
}

const systemChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const configuredChannel = process.env.PLAYWRIGHT_CHANNEL?.trim();
const channel =
	configuredChannel ||
	(!process.env.CI && process.platform === 'darwin' && fs.existsSync(systemChromePath)
		? 'chrome'
		: undefined);

export default defineConfig({
	webServer: {
		command: 'bash scripts/e2e-server.sh',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	use: channel ? { channel } : undefined,
	testDir: 'e2e'
});
