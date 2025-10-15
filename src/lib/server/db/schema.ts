import type { AdapterAccountType } from '@auth/core/adapters';
import type { UUID } from 'crypto';
import {
	boolean,
	inet,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

const userId = uuid('userId')
	.references(() => users.id, {
		onDelete: 'cascade',
		onUpdate: 'cascade'
	})
	.notNull();

const userIdOptional = uuid('userId').references(() => users.id, {
	onDelete: 'set null',
	onUpdate: 'cascade'
});

export const users = pgTable('user', {
	id: uuid('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID())
		.$type<UUID>(),
	name: text('name').notNull().unique(),
	email: text('email').unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date' }),
	image: text('image'),
	registered: timestamp('registered').notNull().defaultNow(),
	lastTicked: timestamp('lastTicked').notNull().defaultNow(),
	pixels: integer('pixels').notNull().default(100),
	placed: integer('placed').notNull().default(0),
	mod: boolean('mod').notNull().default(false)
});

export const bans = pgTable('bans', {
	id: serial('id').primaryKey(),
	ip: inet('ip'),
	userId: userIdOptional,
	reason: varchar('reason'),
	expires: timestamp('expires')
});

export const connections = pgTable(
	'connections',
	{
		timestamp: timestamp('latestLogin').notNull().defaultNow(),
		ip: inet('ip').notNull(),
		userId
	},
	(table) => [primaryKey({ columns: [table.ip, table.userId] })]
);

export const pixelPlacements = pgTable(
	'pixelPlace',
	{
		x: integer('x').notNull(),
		y: integer('y').notNull(),
		color: integer('color').notNull(),
		userId: userIdOptional,
		time: timestamp('time', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [primaryKey({ columns: [table.x, table.y, table.time] })]
);

export const pixelMap = pgTable(
	'pixelMap',
	{
		x: integer().notNull(),
		y: integer().notNull(),
		color: integer().notNull(),
		userId: userIdOptional
	},
	(table) => [primaryKey({ columns: [table.x, table.y] })]
);

export const chat = pgTable('chat', {
	id: serial('id').primaryKey().notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
	userId: userIdOptional,
	message: varchar('message').notNull()
});

export const accounts = pgTable(
	'account',
	{
		userId,
		type: text('type').$type<AdapterAccountType>().notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('providerAccountId').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(account) => [
		{
			compoundKey: primaryKey({
				columns: [account.provider, account.providerAccountId]
			})
		}
	]
);
