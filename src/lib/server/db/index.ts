import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../../../config.server.js';
import * as schema from './schema.js';
export * from './schema.js';

if (!config.db.url) throw new Error('config.db.url is not set');

const client = postgres(config.db.url);

export const db = drizzle(client, { schema });
