import type { AdapterAccountType } from '@auth/core/adapters';
import type { UUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../../../config.server.js';
import * as legacySchema from './legacySchema.js';
import * as schema from './schema.js';
export * from './schema.js';

if (!config.db.url) throw new Error('config.db.url is not set');

export const db = drizzle(config.db.url, { schema });

function uuidFromInt(id: number): UUID {
	return `00000000-0000-0000-0000-${id.toString(16).padStart(12, '0')}`;
}

if (config.legacyDB?.url) {
	const providerMap: Record<string, { provider: string; type: AdapterAccountType }> = {
		google: {
			provider: 'google',
			type: 'oidc'
		},
		discord: {
			provider: 'discord',
			type: 'oauth'
		},
		twitch: {
			provider: 'twitch',
			type: 'oidc'
		},
		tumblr: {
			provider: 'tumblr',
			type: 'oauth'
		},
		oidc: {
			provider: 'authentik',
			type: 'oidc'
		}
	};

	const legacyDb = drizzle(config.legacyDB.url, { schema: legacySchema });

	await db.transaction(async (tx) => {
		const users = await legacyDb.select().from(legacySchema.users);

		users.forEach(async (user) => {
			const data = await tx
				.insert(schema.users)
				.values({
					id: uuidFromInt(user.id),
					name: user.username,
					pixels: user.pixels,
					placed: user.placed,
					lastTicked: user.lastTicked || new Date(Date.now()),
					registered: user.signupTime
				})
				.returning({ userId: schema.users.id })
				.onConflictDoNothing({ target: schema.users.name });

			if (data.length != 1) {
				return;
			}

			const userId = data[0].userId;

			const values = (
				await legacyDb
					.select({
						service: legacySchema.connections.service,
						serviceUid: legacySchema.connections.serviceUid
					})
					.from(legacySchema.connections)
					.where(eq(legacySchema.connections.uid, user.id))
			).map((connection) => {
				return {
					...providerMap[connection.service],
					userId,
					providerAccountId: connection.serviceUid
				};
			});

			await tx.insert(schema.accounts).values(values).onConflictDoNothing();
		});

		const messages = await legacyDb
			.select({
				id: legacySchema.chat.id,
				timestamp: legacySchema.chat.sent,
				message: legacySchema.chat.content,
				userId: legacySchema.chat.author
			})
			.from(legacySchema.chat);

		messages.forEach(async (message) => {
			const pix = {
				...message,
				userId: message.userId ? uuidFromInt(message.userId) : undefined,
				timestamp: new Date(message.timestamp * 1000)
			};

			await tx.insert(schema.chat).values(pix).onConflictDoNothing();
		});

		/* const pixels = await legacyDb
			.select({
				x: legacySchema.pixels.x,
				y: legacySchema.pixels.y,
				time: legacySchema.pixels.time,
				userId: legacySchema.pixels.who,
				color: legacySchema.pixels.color
			})
			.from(legacySchema.pixels);

		pixels.forEach(async (pixel) => {
			const pix = {
				...pixel,
				userId: pixel.userId ? userMap.get(pixel.userId) : undefined
			};

			await tx.insert(schema.pixelPlacements).values(pix).onConflictDoNothing();
		}); */

		const pixelMap = await legacyDb
			.select({
				userId: legacySchema.pixels.who,
				x: legacySchema.pixels.x,
				y: legacySchema.pixels.y,
				time: legacySchema.pixels.time,
				color: legacySchema.pixels.color
			})
			.from(legacySchema.pixels)
			.where(eq(legacySchema.pixels.most_recent, true));

		const pixels = pixelMap.map((pixel) => ({
			...pixel,
			userId: pixel.userId ? uuidFromInt(pixel.userId) : undefined
		}));

		pixels.forEach(async (pix) => {
			await tx
				.insert(schema.pixelMap)
				.values(pix)
				.onConflictDoUpdate({
					target: [schema.pixelMap.x, schema.pixelMap.y],
					set: { color: pix.color }
				});

			await tx.insert(schema.pixelPlacements).values(pix).onConflictDoNothing();
		});
	});

	console.log('success!');
}
