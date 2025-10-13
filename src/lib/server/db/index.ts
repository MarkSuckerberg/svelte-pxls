import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../../../config.server.js';
import * as schema from './schema.js';
export * from './schema.js';

if (!config.db.url) throw new Error('config.db.url is not set');

export const db = drizzle(config.db.url, { schema });
