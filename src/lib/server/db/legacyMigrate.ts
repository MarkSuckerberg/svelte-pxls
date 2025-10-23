import type { AdapterAccountType } from '@auth/core/adapters';
import type { UUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { exit } from 'process';
import { config } from '../../../config.server.js';
import { db } from './index.js';
import * as legacySchema from './legacySchema.js';
import * as schema from './schema.js';
export * from './schema.js';

function uuidFromInt(id: number): UUID {
	return `00000000-0000-0000-0000-${id.toString(16).padStart(12, '0')}`;
}

if (!config.legacyDB?.url) {
	console.log('Legacy DB URL not set. Not running legacy migration.');
	exit();
}

console.time('migration time');

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
	console.log('Beginning migration...');

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

	console.log(`Migrated ${users.length} users.`);

	const messages = await legacyDb
		.select({
			id: legacySchema.chat.id,
			timestamp: legacySchema.chat.sent,
			message: legacySchema.chat.content,
			userId: legacySchema.chat.author
		})
		.from(legacySchema.chat);

	await tx.delete(schema.chat);
	for (let messageID = 0; messageID < messages.length; messageID++) {
		const chatMsg = messages[messageID];

		const msg = {
			message: chatMsg.message,
			userId: chatMsg.userId ? uuidFromInt(chatMsg.userId) : undefined,
			timestamp: new Date(chatMsg.timestamp * 1000)
		};

		await tx.insert(schema.chat).values(msg);
	}

	console.log(`Migrated ${messages.length} chat messages.`);

	let pixelCount = 0;
	for (let row = 0; row < config.size.height; row++) {
		const pixelMap = await legacyDb
			.select({
				userId: legacySchema.pixels.who,
				x: legacySchema.pixels.x,
				time: legacySchema.pixels.time,
				color: legacySchema.pixels.color
			})
			.from(legacySchema.pixels)
			.where(and(eq(legacySchema.pixels.most_recent, true), eq(legacySchema.pixels.y, row)));

		const pixels = pixelMap.map((pixel) => ({
			...pixel,
			y: row,
			userId: pixel.userId ? uuidFromInt(pixel.userId) : undefined
		}));

		pixelCount += pixels.length;

		await tx.insert(schema.pixelMap).values(pixels).onConflictDoNothing();
		await tx.insert(schema.pixelPlacements).values(pixels).onConflictDoNothing();
	}

	console.log(`Migrated ${pixelCount} pixels.`);

	console.log('Committing transaction...');
});

console.log('Migration complete!');
console.timeEnd('migration time');
