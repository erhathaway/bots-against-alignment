import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf'],
	framework: '@storybook/sveltekit',
	viteFinal(config) {
		config.plugins = config.plugins ?? [];
		config.plugins.unshift({
			name: 'mock-sveltekit-env',
			enforce: 'pre',
			resolveId(id) {
				if (id === '$env/dynamic/public' || id === '$env/static/public') {
					return id;
				}
			},
			load(id) {
				if (id === '$env/dynamic/public' || id === '$env/static/public') {
					return 'export const env = {};';
				}
			}
		});
		return config;
	}
};

export default config;
