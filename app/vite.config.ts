import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig, type Plugin } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

function storybookStaticServe(): Plugin {
	function middleware(
		req: { url?: string },
		res: { writeHead: (code: number, headers: Record<string, string>) => void; end: () => void },
		next: () => void
	) {
		if (!req.url) return next();
		const qIdx = req.url.indexOf('?');
		const pathname = qIdx >= 0 ? req.url.slice(0, qIdx) : req.url;
		const search = qIdx >= 0 ? req.url.slice(qIdx) : '';

		// Redirect /storybook to /storybook/ so relative paths resolve correctly
		if (pathname === '/storybook') {
			res.writeHead(302, { Location: '/storybook/' + search });
			res.end();
			return;
		}

		// Serve index.html for /storybook/
		if (pathname === '/storybook/') {
			req.url = '/storybook/index.html' + search;
		}

		next();
	}

	return {
		name: 'storybook-static-serve',
		configureServer(server) {
			server.middlewares.use(middleware);
		},
		configurePreviewServer(server) {
			server.middlewares.use(middleware);
		}
	};
}

export default defineConfig({
	plugins: [storybookStaticServe(), sveltekit(), devtoolsJson()]
});
