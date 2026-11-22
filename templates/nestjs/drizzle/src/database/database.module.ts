import { Global, Module } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { loadConfig } from '../config/index.js';
import * as schema from './schemas/index.js';

export type Database = NodePgDatabase<typeof schema>;

/** Token de inyección del cliente de Drizzle: `@Inject(DRIZZLE) private readonly db: Database`. */
export const DRIZZLE = Symbol('DRIZZLE');

export const pool = new Pool({ connectionString: loadConfig().database.url });

/** Cliente único de Drizzle. Lo comparten los providers de Nest y Better Auth (`src/auth/auth.ts`). */
export const db: Database = drizzle(pool, { schema });

@Global()
@Module({
  providers: [{ provide: DRIZZLE, useValue: db }],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
