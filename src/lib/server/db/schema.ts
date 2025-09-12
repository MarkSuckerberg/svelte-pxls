import { relations } from 'drizzle-orm';
import {
	integer,
	jsonb,
	pgTable,
	primaryKey,
	serial,
	timestamp,
	varchar
} from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
	id: serial('id').primaryKey(),
	username: varchar('username').notNull(),
	registered: timestamp('registered').notNull().defaultNow(),
	lastTicked: timestamp('lastTicked').notNull().defaultNow(),
	pixels: integer('pixels').notNull().default(100),
	placed: integer('placed').notNull().default(0)
});

export const oauthLinks = pgTable(
	'oauthLinks',
	{
		id: varchar('id').notNull(),
		provider: varchar('provider'),
		userId: integer('userId').references(() => users.id, {
			onDelete: 'cascade',
			onUpdate: 'cascade'
		}),
		data: jsonb()
	},
	(table) => [
		primaryKey({ columns: [table.provider, table.id] })
	]
);
