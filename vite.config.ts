import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';

import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';

import { PixelSocketServer } from './src/socket.server';

const socketIo: Plugin = {
	name: 'socket.io',
	async configureServer(server: ViteDevServer) {
		if (!server.httpServer) {
			return;
		}

		const config = (await import('./src/config.server')).config;

		try {
			globalThis.io = await PixelSocketServer.fromFile(
				config.boardFile,
				server.httpServer,
				config.size
			);
		} catch (e) {
			console.error(e);
		}
	},

	async configurePreviewServer(server: PreviewServer) {
		if (!server.httpServer) {
			return;
		}

		const config = (await import('./src/config.server')).config;

		try {
			globalThis.io = await PixelSocketServer.fromFile(
				config.boardFile,
				server.httpServer,
				config.size
			);
		} catch (e) {
			console.error(e);
		}
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), socketIo, devtoolsJson()]
});
