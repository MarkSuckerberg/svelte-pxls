import type { ClientSocket } from '$lib/types';
import { createSubscriber } from 'svelte/reactivity';

class WebsocketData<T> {
	#data;
	#subscribe;

	constructor(socket: ClientSocket, event: Parameters<ClientSocket['on']>['0']) {
		this.#subscribe = createSubscriber((update) => {
			socket.on(event, (data) => {
				this.#data = data;
                update()
			});
		});
	}
}
