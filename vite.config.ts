import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import { attach_sockets } from './src/server.socket';

const socketIo: Plugin = {
	name: 'socket.io',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) {
			return;
		}

		try {
			attach_sockets(server.httpServer);
		} catch (e) {
			console.error(e);
		}
	}
};

export default defineConfig({
	plugins: [sveltekit(), socketIo, devtoolsJson()]
});
