import { Auth, createActionURL } from '@auth/core';
import { ArrayGrid } from './lib/arrayGrid.js';
import { fromDb, fromFile, fromLegacyFile, toFile } from './lib/server/arrayGrid.server.js';
import {
	center,
	type AuthedSocketData,
	type ChatMessage,
	type ClientToServerEvents,
	type Dimensions,
	type InterServerEvents,
	type ServerToClientEvents,
	type SocketData
} from './lib/types.js';

import type { ResponseInternal } from '@auth/core/types';
import type { Session } from '@auth/sveltekit';
import { type UUID } from 'crypto';
import { and, desc, eq, max, sql } from 'drizzle-orm';
import type { Server } from 'http';
import type { Http2SecureServer, Http2Server } from 'http2';
import type { Server as HTTPSServer } from 'https';
import { Socket, Server as SocketServer } from 'socket.io';
import { authConfig } from './authConfig.server.js';
import { config } from './config.server.js';
import {
	bans,
	chat,
	connections,
	db,
	pixelMap,
	pixelPlacements,
	reports,
	users
} from './lib/server/db/index.js';
import { User } from './lib/server/user.server.js';
import { dbUser, fullDBUser, GetUserInfo, GetUserInfoUsername } from './lib/userinfo.js';
import { sendMessage } from './lib/webhook.js';

const THIRTY_MINUTES = 1000 * 60 * 30;

export class PixelSocketServer {
	public static async fromFile(
		file: string,
		server: Server | HTTPSServer | Http2SecureServer | Http2Server,
		size: Dimensions
	) {
		const data =
			(await fromFile(file)) ||
			(await fromDb(size)) ||
			(await fromLegacyFile('data/baseMap.dat', size)) ||
			new ArrayGrid(size);

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

	private origin: URL;

	public users: Map<string, SocketData> = new Map();
	public sessions: Map<UUID, Set<Socket<ClientToServerEvents, ServerToClientEvents>>> = new Map();

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

		if (process.env.ORIGIN) {
			this.origin = new URL(process.env.ORIGIN);
		} else {
			const address = server.address();
			if (address !== null) {
				this.origin =
					typeof address === 'string'
						? new URL(address)
						: new URL(`http://${address?.address}:${address?.port}`);
			} else {
				this.origin = new URL('http://localhost:5173');
			}
		}

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

			const url = createActionURL(
				'session',
				socket.handshake.secure ? 'https' : 'http',
				headers,
				process.env,
				authConfig
			);

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

			if (socket.data.session?.user) {
				socket.data.user = await User.byId(socket.data.session.user.id as UUID);

				if (!socket.data.user) {
					return;
				}

				const address = socket.request.socket.remoteAddress;
				if (!address) {
					next();
					return;
				}

				const ban = (
					await db.execute<{ reason: string | null }>(
						sql`SELECT reason FROM ${bans} WHERE ${bans.ip} >>= ${address} OR ${bans.userId} = ${socket.data.session.user.id}`
					)
				).rows[0];

				if (ban) {
					next(new Error('You have been banned for reason: ' + ban.reason));
					return;
				}

				if (this.sessions.has(socket.data.user.id)) {
					this.sessions.get(socket.data.user.id)?.add(socket);
				} else {
					this.sessions.set(socket.data.session.user.id as UUID, new Set([socket]));
				}

				await db
					.insert(connections)
					.values({
						ip: address,
						userId: socket.data.session.user.id
					})
					.onConflictDoNothing();
			}

			next();
		});

		this.io.on('connection', async (socket) => {
			this.users.set(socket.id, socket.data);

			this.io.emit('users', this.userList());

			socket.on('disconnect', () => {
				this.users.delete(socket.id);

				if (socket.data.user) {
					this.sessions.get(socket.data.user?.id)?.delete(socket);
				}

				this.io.emit('users', this.userList());
			});

			socket.on('pixelInfo', async (loc, ack) => {
				const info = (
					await db
						.select({
							user: dbUser,
							time: pixelPlacements.time
						})
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
					placer: info.user,
					time: info.time.getTime()
				});
				return;
			});

			db.select()
				.from(chat)
				.innerJoin(users, eq(chat.userId, users.id))
				.orderBy(desc(chat.timestamp))
				.limit(socket.data.user ? 200 : 50)
				.then((messages) => {
					const result = messages
						.map((message) => ({
							username: message.user.name,
							message: message.chat.message,
							timestamp: message.chat.timestamp.getTime()
						}))
						.reverse() satisfies ChatMessage[];

					result.push({
						username: 'Server',
						message: config.motd,
						timestamp: Date.now()
					});

					socket.emit('chat', result);
				});

			socket.on('idInfo', async (id, ack) => {
				ack(await GetUserInfo(id));
			});

			socket.on('usernameInfo', async (username, ack) => {
				ack(await GetUserInfoUsername(username));
			});

			//TODO: Refactor into user and admin namespaces?

			if (!socket.data.user) {
				socket.emit('userInfo', {
					pixels: 0,
					id: '000000-0000-0000-0000-000000000000',
					name: 'Guest',
					maxPixels: 0,
					lastTicked: Date.now(),
					placed: 0,
					avatar: null,
					title: null,
					mod: false
				});

				return;
			}
			const data = socket.data as AuthedSocketData;

			socket.emit('userInfo', data.user.info());

			socket.on('place', async (pixels, ack) => {
				pixels = pixels.slice(0, data.user.Pixels);

				pixels.forEach(async (pixel, index) => {
					try {
						this.grid.set(pixel);
						await db
							.insert(pixelMap)
							.values({ ...pixel, userId: data.user.id })
							.onConflictDoUpdate({
								target: [pixelMap.x, pixelMap.y],
								set: { color: pixel.color }
							});
					} catch {
						pixels.splice(index);
						return;
					}
				});

				const pixelData = pixels.map((pixel) => {
					return { ...pixel, userId: data.user.id };
				});

				await db.insert(pixelPlacements).values(pixelData);

				data.user.Placed += pixels.length;
				data.user.Pixels -= pixels.length;
				await data.user.sync();

				socket.broadcast.emit('pixelUpdate', pixels);
				ack(pixels);

				this.sessions.get(data.user.id)?.forEach((socket) => {
					socket.emit('userInfo', data.user.info());
				});

				toFile(this.grid, 'data/board.dat');
			});

			socket.on('chat', async (message) => {
				config.webhooks?.chat?.forEach((webhook) => {
					sendMessage(webhook, {
						title: 'New Chat Message',
						timestamp: new Date(Date.now()),
						user: { name: data.user.username, image: data.user.Avatar },
						message
					});
				});

				await db.insert(chat).values({ message, userId: data.user.id });

				this.io.emit('chat', [
					{
						username: data.user.username,
						message,
						timestamp: Date.now()
					}
				]);
			});

			socket.on('settings', async (settings, ack) => {
				data.user.Avatar = settings.imageUrl;
				data.user.Title = settings.title;
				await data.user.sync();

				this.sessions.get(data.user.id)?.forEach((socket) => {
					socket.emit('userInfo', data.user.info());
				});

				ack();
			});

			socket.on('report', async (location, reason, ack) => {
				if (reason.length < 60) {
					//don't you dare bypass my input validation
					ack(Number.POSITIVE_INFINITY);
					return;
				}

				if (!data.user.mod) {
					const lastReport = (
						await db
							.select({ value: max(reports.timestamp) })
							.from(reports)
							.where(eq(reports.userId, data.user.id))
					).at(0);

					if (
						lastReport?.value &&
						Date.now() - lastReport.value.getTime() < THIRTY_MINUTES
					) {
						ack(lastReport.value.getTime() + THIRTY_MINUTES);
						return;
					}
				}

				const result = (
					await db
						.insert(reports)
						.values({
							x: location.x,
							y: location.y,
							userId: data.user.id,
							reason
						})
						.returning({ id: reports.id })
				).at(0)?.id;

				if (!result) {
					ack(Date.now() + 30000);
					return;
				}

				const centerLoc = center(this.grid.size, location);
				config.webhooks?.admin?.forEach((webhook) => {
					sendMessage(webhook, {
						title: 'New report:',
						url: new URL(
							`/?x=${centerLoc.x}&y=${centerLoc.y}&s=10`,
							this.origin
						).toString(),
						timestamp: new Date(Date.now()),
						message: `Report ${result} has been made for the pixel (${location.x}, ${location.y}) with reason:\n\`${reason}\``,
						user: { name: data.user.username, image: data.user.Avatar }
					});
				});

				ack();
			});

			if (!data.user.mod) {
				return;
			}

			socket.on('getReports', async (ack) => {
				ack(
					(
						await db
							.select({
								user: fullDBUser,
								x: reports.x,
								y: reports.y,
								timestamp: reports.timestamp,
								id: reports.id,
								reason: reports.reason
							})
							.from(reports)
							.innerJoin(users, eq(reports.userId, users.id))
							.where(eq(reports.resolved, false))
							.limit(25)
					).map((input) => ({
						...input,
						timestamp: input.timestamp.getTime(),
						user: {
							...input.user,
							lastTicked: input.user.lastTicked.getTime()
						}
					}))
				);
			});

			socket.on('ban', async (ban, ack) => {
				const banId = (
					await db
						.insert(bans)
						.values({ ip: ban.ip, userId: ban.userId })
						.returning({ id: bans.id })
				)[0].id;

				if (!banId) {
					ack();
					return;
				}

				config.webhooks?.admin?.forEach((webhook) =>
					sendMessage(webhook, {
						title: 'New ban created',
						timestamp: new Date(Date.now()),
						message: `User ID ${ban.userId} / IP ${ban.ip} banned.`,
						user: { name: data.user.username, image: data.user.Avatar }
					})
				);
				ack(banId);
			});
		});
	}
}
