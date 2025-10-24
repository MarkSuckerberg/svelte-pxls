import { io } from 'socket.io-client';
import { doNotify } from './notify';
import type { ChatMessage, ClientSocket } from './types';
import type { UserInfo } from './userinfo';

export class PixelsClient {
	public readonly socket: ClientSocket;

	public info: UserInfo;
	public chat: ChatMessage[];
	public currentUsers: string[];
	public nextPixel: number;

	public constructor(
		socket: ClientSocket,
		info: UserInfo,
		initialChat: ChatMessage[],
		initialUsers: string[]
	) {
		this.socket = socket;

		this.info = $state(info);

		this.nextPixel = $state(
			this.info ? Math.floor(20 - (Date.now() - this.info.lastTicked) / 1000) : 20
		);

		if (this.info) {
			this.updateTitle();

			setTimeout(
				() => {
					this.nextPixel = Math.floor(20 - (Date.now() - this.info.lastTicked) / 1000);
					setInterval(() => {
						this.nextPixel = Math.floor(
							20 - (Date.now() - this.info.lastTicked) / 1000
						);
					}, 1000);
				},
				//Offset to try to match times with the server
				(Date.now() - this.info.lastTicked) % 1000
			);

			setTimeout(
				() => {
					this.info.pixels = Math.min(this.info.maxPixels, this.info.pixels + 1);
					this.info.lastTicked = Date.now();

					setInterval(() => {
						if (this.info.pixels === this.info.maxPixels - 1) {
							doNotify(
								'Pixels Full!',
								`Your ${this.info.pixels} pixels are ready to place!`
							);
						}
						this.info.pixels = Math.min(this.info.maxPixels, this.info.pixels + 1);
						this.info.lastTicked = Date.now();
						this.updateTitle();
					}, 20 * 1000);
				},
				20 * 1000 - (Date.now() - this.info.lastTicked)
			);
		}

		this.chat = $state(initialChat);
		this.currentUsers = $state(initialUsers);

		this.socket.on('userInfo', (info) => {
			this.info = info;
			this.updateTitle();
		});

		this.socket.on('chat', (messages) => {
			this.chat = this.chat.concat(messages);
		});

		this.socket.on('users', (userList) => {
			this.currentUsers = userList;
		});
	}

	public static async startClient() {
		const socket: ClientSocket = io({
			rememberUpgrade: true
		});

		const userData = new Promise<UserInfo>((resolve, reject) => {
			setTimeout(reject, 5000);

			socket.once('userInfo', (info) => {
				resolve(info);
			});
		});

		const initialChat = new Promise<ChatMessage[]>((resolve, reject) => {
			setTimeout(reject, 5000);

			socket.once('chat', (messages) => {
				resolve(messages);
			});
		});

		const initialUsers = new Promise<string[]>((resolve, reject) => {
			setTimeout(reject, 5000);

			socket.once('users', (users) => {
				resolve(users);
			});
		});

		return new PixelsClient(socket, await userData, await initialChat, await initialUsers);
	}

	public updateTitle() {
		const prepend =
			this.info.pixels >= this.info.maxPixels
				? 'Full'
				: `${this.info.pixels}/${this.info.maxPixels}`;
		document.title = `[${prepend}] | Steller's Pixels`;
	}
}
