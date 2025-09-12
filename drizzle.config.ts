import { defineConfig } from 'drizzle-kit';
import { config } from './src/config.server';

if (!config.db) throw new Error('config.db is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: config.db,
	verbose: true,
	strict: true
});
