import {
	type ClientToServerEvents,
	type InterServerEvents,
	type ServerToClientEvents,
	type SocketData,
	HEIGHT,
	WIDTH
} from './lib/socket.js';

import { ArrayGrid } from './lib/arrayGrid.js';
import { fromFile, toFile } from './lib/arrayGrid.server.js';

import type { Server } from 'http';
import type { Http2SecureServer, Http2Server } from 'http2';
import type { Server as HTTPSServer } from 'https';
import { Server as ioServer } from 'socket.io';

export class PixelSocketServer {
	public static async fromFile(
		file: string,
		server: Server | HTTPSServer | Http2SecureServer | Http2Server
	) {
		const data = (await fromFile(file)) || new ArrayGrid({ width: WIDTH, height: HEIGHT });

		return new PixelSocketServer(data, server);
	}

	public users: Map<string, SocketData> = new Map();
	public readonly data;
	public readonly io: ioServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>;

	public constructor(
		data: ArrayGrid,
		server: Server | HTTPSServer | Http2SecureServer | Http2Server
	) {
		this.io = new ioServer<
			ClientToServerEvents,
			ServerToClientEvents,
			InterServerEvents,
			SocketData
		>(server);

		this.data = data;

		this.io.on('connection', (socket) => {
			this.users.set(socket.id, { name: 'test' });
			this.io
				.compress(true)
				.emit('map', data.array, { width: data.width, height: data.height });

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

			socket.on('disconnect', () => {
				this.users.delete(socket.id);

				const userArray: SocketData[] = [];
				this.users.forEach((element) => {
					userArray.push(element);
				});

				this.io.emit('users', userArray);

				toFile(data, 'board2.dat');
			});
		});
	}
}
