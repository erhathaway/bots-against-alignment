import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import os from 'node:os';
import fs from 'node:fs';

// In some restricted environments, `os.cpus()[].model` is unavailable, which makes Playwright
// mis-detect Apple Silicon as Intel macOS and look for `mac-x64` browser binaries.
// Force the correct host platform for darwin/arm64 so Vitest's Playwright browser provider works.
if (process.platform === 'darwin' && process.arch === 'arm64') {
	const darwinMajor = Number.parseInt(os.release().split('.')[0] ?? '', 10);
	if (Number.isFinite(darwinMajor) && darwinMajor >= 20) {
		const LAST_STABLE_MACOS_MAJOR_VERSION = 15;
		const macMajor = Math.min(darwinMajor - 9, LAST_STABLE_MACOS_MAJOR_VERSION);
		process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE ??= `mac${macMajor}-arm64`;
	}
}

const systemChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const configuredChannel = process.env.PLAYWRIGHT_CHANNEL?.trim();
const channel =
	configuredChannel ||
	(!process.env.CI && process.platform === 'darwin' && fs.existsSync(systemChromePath)
		? 'chrome'
		: undefined);

const playwrightProvider = playwright({
	launchOptions: channel ? { channel } : undefined
});

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vitest.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwrightProvider,
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vitest.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
