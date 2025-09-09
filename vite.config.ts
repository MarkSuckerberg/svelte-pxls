import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import 'dotenv/config';

import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';

import { PixelSocketServer } from './src/server.socket';

const socketIo: Plugin = {
	name: 'socket.io',
	async configureServer(server: ViteDevServer) {
		if (!server.httpServer) {
			return;
		}

		try {
			globalThis.io = await PixelSocketServer.fromFile('board2.dat', server.httpServer);
		} catch (e) {
			console.error(e);
		}
	},

	async configurePreviewServer(server: PreviewServer) {
		if (!server.httpServer) {
			return;
		}

		try {
			globalThis.io = await PixelSocketServer.fromFile('board2.dat', server.httpServer);
		} catch (e) {
			console.error(e);
		}
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), socketIo, devtoolsJson()]
});
