import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'bash scripts/e2e-server.sh',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests'
};

export default config;
