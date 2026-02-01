import type { PlaywrightTestConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';

// In some sandboxed environments `os.cpus()` may be empty, which makes Playwright mis-detect
// Apple Silicon as x64 on newer macOS versions (e.g. `mac15` -> `mac-x64`).
// Force the correct host platform so it uses the arm64 browser builds.
if (process.platform === 'darwin' && process.arch === 'arm64' && os.cpus().length === 0) {
	// Match Playwright's own mapping logic.
	// https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/utils/hostPlatform.ts
	// (Copied here to avoid relying on hostPlatform's computed value.)
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

// Prefer a system Chrome on local macOS runs. Some sandboxed environments can
// crash Playwright's bundled Chromium on launch.
const systemChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const configuredChannel = process.env.PLAYWRIGHT_CHANNEL?.trim();
const channel =
	configuredChannel ||
	(!process.env.CI && process.platform === 'darwin' && fs.existsSync(systemChromePath)
		? 'chrome'
		: undefined);

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'bash scripts/e2e-server.sh',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	use: channel ? { channel } : undefined,
	testDir: 'tests'
};

export default config;
