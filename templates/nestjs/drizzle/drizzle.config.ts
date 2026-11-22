import { defineConfig } from 'drizzle-kit';
import { loadConfig } from './src/config/index.js';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schemas/index.ts',
  out: './database/migrations',
  // Cada schema nuevo de src/database/schemas/ se añade aquí.
  schemaFilter: ['usr'],
  dbCredentials: { url: loadConfig().database.url },
});
