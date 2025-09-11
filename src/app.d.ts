// See https://svelte.dev/docs/kit/types#app.d.ts

import type { PixelSocketServer } from './socket.server';

// for information about these interfaces
declare global {
	var io: PixelSocketServer;

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
