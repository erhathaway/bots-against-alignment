import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf'],
	framework: '@storybook/sveltekit',
	async viteFinal(config, { configType }) {
		if (configType === 'PRODUCTION') {
			config.base = '/storybook/';
		}
		return config;
	}
};

export default config;
