import type { Server } from 'http';
import type { Server as HTTPSServer } from 'https';
import type { Http2SecureServer, Http2Server } from 'http2';

import { Server as ioServer } from 'socket.io';
import {
	type ClientToServerEvents,
	type ServerToClientEvents,
	type InterServerEvents,
	type SocketData,
	HEIGHT,
	WIDTH
} from './socket';
import { readFile, writeFile } from 'fs';

export async function attach_sockets(
	server: Server | HTTPSServer | Http2SecureServer | Http2Server
) {
	const users: Map<string, SocketData> = new Map();

	let rawdata: Uint8Array = new Uint8Array(WIDTH * HEIGHT);

	function set(x: number, y: number, value: number) {
		if (0 > x || x > WIDTH || 0 > y || y > HEIGHT) {
			throw Error('Invalid pixel position!');
		}
		const position = (x % WIDTH) + y * WIDTH;

		rawdata[position] = value;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function get(x: number, y: number) {
		if (0 > x || x > WIDTH || 0 > y || y > HEIGHT) {
			throw Error('Invalid pixel position!');
		}

		const position = (x % WIDTH) + y * WIDTH;

		return rawdata[position];
	}

	const io = new ioServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>(server);

	readFile('board.dat', (err, fileData) => {
		if (err) {
			return;
		}

		rawdata = fileData;
	});

	io.on('connection', (socket) => {
		users.set(socket.id, { name: 'test' });

		io.emit('heartbeat', Date.now());
		io.emit('map', rawdata.buffer);

		socket.on('place', (pixels) => {
			pixels.forEach(({ x, y, color }) => {
				if (0 > x || x > WIDTH || 0 > y || y > HEIGHT) {
					return;
				}

				set(x, y, color);
			});

			io.emit('pixelUpdate', pixels);
		});

		socket.on('disconnect', () => {
			users.delete(socket.id);
			io.emit('users', users.values().toArray());

			writeFile('board.dat', rawdata, () => {});
		});
	});
}
