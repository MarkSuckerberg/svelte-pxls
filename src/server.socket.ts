import {
	type ClientToServerEvents,
	type ServerToClientEvents,
	type InterServerEvents,
	type SocketData,
	HEIGHT,
	WIDTH
} from './lib/socket.js';

import { ArrayGrid } from './lib/arrayGrid.js';
import { fromFile, toFile } from './lib/arrayGrid.server.js';

import { Server as ioServer } from 'socket.io';
import type { Server } from 'http';
import type { Server as HTTPSServer } from 'https';
import type { Http2SecureServer, Http2Server } from 'http2';

export async function attach_sockets(
	server: Server | HTTPSServer | Http2SecureServer | Http2Server
) {
	const users: Map<string, SocketData> = new Map();

	const data = (await fromFile('board2.dat')) || new ArrayGrid(WIDTH, HEIGHT);

	const io = new ioServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>(server);

	io.on('connection', (socket) => {
		users.set(socket.id, { name: 'test' });
		io.compress(true).emit('map', data.array, data.width, data.height);

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
			users.delete(socket.id);

			const userArray: SocketData[] = [];
			users.forEach((element) => {
				userArray.push(element);
			});

			io.emit('users', userArray);

			toFile(data, 'board2.dat');
		});
	});
}
