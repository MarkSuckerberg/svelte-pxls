import { Auth, createActionURL } from '@auth/core';
import { ArrayGrid } from './lib/arrayGrid.js';
import { fromFile, toFile } from './lib/arrayGrid.server.js';
import {
	type ClientToServerEvents,
	type Dimensions,
	type InterServerEvents,
	type ServerToClientEvents,
	type SocketData
} from './lib/types.js';

import type { Session } from '@auth/sveltekit';
import type { Server } from 'http';
import type { Http2SecureServer, Http2Server } from 'http2';
import type { Server as HTTPSServer } from 'https';
import { Server as SocketServer } from 'socket.io';
import { authConfig } from './config.server.js';

export class PixelSocketServer {
	public static async fromFile(
		file: string,
		server: Server | HTTPSServer | Http2SecureServer | Http2Server,
		size: Dimensions
	) {
		const data = (await fromFile(file)) || new ArrayGrid(size);

		return new PixelSocketServer(data, server);
	}

	public users: Map<string, SocketData> = new Map();
	public readonly data: ArrayGrid;
	public readonly io: SocketServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>;

	public constructor(
		data: ArrayGrid,
		server: Server | HTTPSServer | Http2SecureServer | Http2Server
	) {
		this.io = new SocketServer<
			ClientToServerEvents,
			ServerToClientEvents,
			InterServerEvents,
			SocketData
		>(server);

		this.data = data;

		this.io.use(async (socket, next) => {
			const headers = new Headers();

			socket.request.rawHeaders.forEach((element, index, array) => {
				if (index % 2) {
					const prev = array[index - 1];
					headers.append(prev, element);
				}
			});

			const req: RequestInit = {
				...socket.request,
				headers
			};

			const url = createActionURL('session', 'http', headers, process.env, authConfig);

			const session = await Auth(new Request(url, req), authConfig);
			if (session.ok) {
				socket.data.session = (await session.json()) as Session | null;
			}

			next();
		});

		this.io.on('connection', (socket) => {
			this.users.set(socket.id, socket.data);

			this.io.emit(
				'users',
				this.users
					.entries()
					.map(([id, userdata]) => {
						return userdata.session?.user?.name || id;
					})
					.toArray()
			);

			socket.on('disconnect', () => {
				this.users.delete(socket.id);

				this.io.emit(
					'users',
					this.users
						.entries()
						.map(([id, userdata]) => {
							return userdata.session?.user?.name || id;
						})
						.toArray()
				);
			});

			if (!socket.data.session) {
				return;
			}

			socket.on('place', (pixels, ack) => {
				pixels.forEach((pixel, index) => {
					try {
						data.set(pixel);
					} catch {
						pixels.splice(index);
						return;
					}
				});

				socket.broadcast.emit('pixelUpdate', pixels);
				ack(pixels);

				toFile(data, 'board2.dat');
			});
		});
	}
}
