import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';

import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';

import { config } from './src/config.server';
import { PixelSocketServer } from './src/socket.server';

const socketIo: Plugin = {
	name: 'socket.io',
	async configureServer(server: ViteDevServer) {
		if (!server.httpServer) {
			return;
		}

		try {
			globalThis.io = await PixelSocketServer.fromFile(
				'data/board.dat',
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

		try {
			globalThis.io = await PixelSocketServer.fromFile(
				'data/board.dat',
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
