import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig, type Plugin } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

function storybookStaticServe(): Plugin {
	function rewrite(req: { url?: string }, _res: unknown, next: () => void) {
		if (req.url) {
			const qIdx = req.url.indexOf('?');
			const pathname = qIdx >= 0 ? req.url.slice(0, qIdx) : req.url;
			if (pathname === '/storybook' || pathname === '/storybook/') {
				const search = qIdx >= 0 ? req.url.slice(qIdx) : '';
				req.url = '/storybook/index.html' + search;
			}
		}
		next();
	}

	return {
		name: 'storybook-static-serve',
		configureServer(server) {
			server.middlewares.use(rewrite);
		},
		configurePreviewServer(server) {
			server.middlewares.use(rewrite);
		}
	};
}

export default defineConfig({
	plugins: [storybookStaticServe(), sveltekit(), devtoolsJson()]
});
