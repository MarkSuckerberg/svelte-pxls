import { Auth, createActionURL } from '@auth/core';
import { ArrayGrid } from './lib/arrayGrid.js';
import { fromFile, toFile } from './lib/server/arrayGrid.server.js';
import {
	type ClientToServerEvents,
	type Dimensions,
	type InterServerEvents,
	type ServerToClientEvents,
	type SocketData
} from './lib/types.js';

import type { ResponseInternal } from '@auth/core/types';
import type { Session } from '@auth/sveltekit';
import type { Server } from 'http';
import type { Http2SecureServer, Http2Server } from 'http2';
import type { Server as HTTPSServer } from 'https';
import { Server as SocketServer } from 'socket.io';
import { authConfig } from './authConfig.server.js';
import { db, users } from './lib/server/db/index.js';
import { eq } from 'drizzle-orm';

export class PixelSocketServer {
	public static async fromFile(
		file: string,
		server: Server | HTTPSServer | Http2SecureServer | Http2Server,
		size: Dimensions
	) {
		const data = (await fromFile(file)) || new ArrayGrid(size);

		return new PixelSocketServer(data, server);
	}

	private userList() {
		return this.users
			.entries()
			.map(([id, userdata], index) => {
				return userdata.session?.user?.name || `Guest ${index}`;
			})
			.toArray();
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

			const session: ResponseInternal | Response = await Auth(
				new Request(url, req),
				authConfig
			);

			if (session instanceof Response) {
				if (!session.ok) {
					return next();
				}

				socket.data.session = (await session.json()) as Session | null;
			} else {
				if (session.status !== 200) {
					return next();
				}

				socket.data.session = session.body;
			}

			next();
		});

		this.io.on('connection', async (socket) => {
			this.users.set(socket.id, socket.data);

			this.io.emit('users', this.userList());

			socket.on('disconnect', () => {
				this.users.delete(socket.id);

				this.io.emit('users', this.userList());
			});

			if (!socket.data.session?.user) {
				socket.emit('userInfo', {
					pixels: 0,
					maxPixels: 0,
					lastTicked: Date.now(),
					placed: 0
				});

				return;
			}

			const userInfo = (
				await db
					.select()
					.from(users)
					.where(eq(users.id, Number(socket.data.session.user.id)))
			)[0];

			socket.emit('userInfo', {
				pixels: userInfo.pixels,
				maxPixels: Math.floor(userInfo.placed / 100 + 100),
				lastTicked: userInfo.lastTicked.getTime(),
				placed: userInfo.placed
			});

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
