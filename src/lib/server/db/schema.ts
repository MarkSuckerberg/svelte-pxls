import type { AdapterAccountType } from '@auth/core/adapters';
import {
	boolean,
	inet,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	varchar
} from 'drizzle-orm/pg-core';

const userId = text('userId').references(() => users.id, {
	onDelete: 'cascade',
	onUpdate: 'cascade'
});
const userIdOptional = text('userId').references(() => users.id, {
	onDelete: 'set null',
	onUpdate: 'cascade'
});

export const users = pgTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	email: text('email').unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date' }),
	image: text('image'),
	registered: timestamp('registered').notNull().defaultNow(),
	lastTicked: timestamp('lastTicked').notNull().defaultNow(),
	pixels: integer('pixels').notNull().default(100),
	placed: integer('placed').notNull().default(0),
	mod: boolean('mod').notNull().default(false)
});

export const oauthLinks = pgTable(
	'oauthLinks',
	{
		id: varchar('id').notNull(),
		provider: varchar('provider').notNull(),
		userId: userId,
		data: jsonb()
	},
	(table) => [primaryKey({ columns: [table.provider, table.id] })]
);

export const bans = pgTable('bans', {
	id: serial('id').primaryKey(),
	ip: inet('ip'),
	userId: userIdOptional,
	reason: varchar('reason')
});

export const connections = pgTable(
	'connections',
	{
		timestamp: timestamp('latestLogin').notNull().defaultNow(),
		ip: inet('ip').notNull(),
		userId: userId
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
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
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
