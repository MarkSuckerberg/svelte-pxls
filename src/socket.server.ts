import { Auth, createActionURL } from '@auth/core';
import { ArrayGrid } from './lib/arrayGrid.js';
import { fromFile, toFile } from './lib/server/arrayGrid.server.js';
import {
	type AuthedSocketData,
	type ClientToServerEvents,
	type Dimensions,
	type InterServerEvents,
	type ServerToClientEvents,
	type SocketData
} from './lib/types.js';

import type { ResponseInternal } from '@auth/core/types';
import type { Session } from '@auth/sveltekit';
import { and, eq } from 'drizzle-orm';
import type { Server } from 'http';
import type { Http2SecureServer, Http2Server } from 'http2';
import type { Server as HTTPSServer } from 'https';
import { Server as SocketServer } from 'socket.io';
import { authConfig } from './authConfig.server.js';
import { db, pixelPlacements, users } from './lib/server/db/index.js';
import { User } from './user.js';

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
	public readonly grid: ArrayGrid;
	public readonly io: SocketServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>;

	public constructor(
		grid: ArrayGrid,
		server: Server | HTTPSServer | Http2SecureServer | Http2Server
	) {
		this.io = new SocketServer<
			ClientToServerEvents,
			ServerToClientEvents,
			InterServerEvents,
			SocketData
		>(server);

		this.grid = grid;

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

			if (socket.data.session) {
				socket.data.user = await User.byId(socket.data.session?.user.userId);
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

			socket.on('pixelInfo', async (loc, ack) => {
				const info = (
					await db
						.select()
						.from(pixelPlacements)
						.where(and(eq(pixelPlacements.x, loc.x), eq(pixelPlacements.y, loc.y)))
						.orderBy(pixelPlacements.time)
						.innerJoin(users, eq(users.id, pixelPlacements.userId))
						.limit(1)
				)[0];

				if (!info) {
					ack(null);
					return;
				}

				ack({
					user: info.user.username,
					time: info.pixelPlace.time.getTime()
				});
				return;
			});

			const data = socket.data as AuthedSocketData;

			if (!data) {
				socket.emit('userInfo', {
					pixels: 0,
					maxPixels: 0,
					lastTicked: Date.now(),
					placed: 0
				});

				return;
			}

			socket.emit('userInfo', data.user.info());

			socket.on('place', async (pixels, ack) => {
				pixels = pixels.slice(0, data.user.Pixels);

				pixels.forEach(async (pixel, index) => {
					try {
						this.grid.set(pixel);
					} catch {
						pixels.splice(index);
						return;
					}

					await db.insert(pixelPlacements).values({
						...pixel,
						userId: data.user.id,
						time: new Date(Date.now())
					});
				});

				data.user.Placed += pixels.length;
				data.user.Pixels -= pixels.length;
				await data.user.sync();

				socket.broadcast.emit('pixelUpdate', pixels);
				ack(pixels);

				toFile(this.grid, 'board2.dat');
			});
		});
	}
}
