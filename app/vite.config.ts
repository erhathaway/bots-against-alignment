import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()]
});
