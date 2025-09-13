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
	avatar: varchar('avatar'),
	registered: timestamp('registered').notNull().defaultNow(),
	lastTicked: timestamp('lastTicked').notNull().defaultNow(),
	pixels: integer('pixels').notNull().default(100),
	placed: integer('placed').notNull().default(0)
});

export const oauthLinks = pgTable(
	'oauthLinks',
	{
		id: varchar('id').notNull(),
		provider: varchar('provider').notNull(),
		userId: integer('userId')
			.references(() => users.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade'
			})
			.notNull(),
		data: jsonb()
	},
	(table) => [primaryKey({ columns: [table.provider, table.id] })]
);

export const pixelPlacements = pgTable(
	'pixelPlace',
	{
		x: integer('x').notNull(),
		y: integer('y').notNull(),
		color: integer('color').notNull(),
		userId: integer('userId')
			.references(() => users.id, {
				onDelete: 'set null',
				onUpdate: 'cascade'
			})
			.notNull(),
		time: timestamp('time', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [primaryKey({ columns: [table.x, table.y, table.time] })]
);
