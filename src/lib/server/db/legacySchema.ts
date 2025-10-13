import { boolean, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const pixels = pgTable('pixels', {
	id: serial().primaryKey(),
	x: integer().notNull(),
	y: integer().notNull(),
	color: integer().notNull(),
	who: integer(),
	secondary_id: integer(),
	time: timestamp().notNull(),
	mod_action: boolean(),
	rollback_action: boolean(),
	undone: boolean(),
	undo_action: boolean(),
	most_recent: boolean()
});

export const users = pgTable('users', {
	id: integer().primaryKey(),
	pixels: integer('stacked').notNull(),
	username: varchar().notNull(),
	lastTicked: timestamp('cooldown_expiry'),
	signupTime: timestamp('signup_time').notNull(),
	ip: varchar('signup_ip').notNull(),
	chatNameColor: integer('chat_name_color').notNull(),
	placed: integer('pixel_count_alltime').notNull()
});

export const connections = pgTable('user_logins', {
	uid: integer().primaryKey(),
	service: varchar({ length: 16 }).notNull(),
	serviceUid: varchar('service_uid', { length: 64 }).notNull()
});

export const chat = pgTable('chat_messages', {
	id: serial().primaryKey(),
	author: integer(),
	sent: integer().notNull(),
	content: varchar({ length: 2048 }).notNull(),
	filtered: varchar({ length: 2048 }).notNull(),
	purged: boolean().notNull()
});
