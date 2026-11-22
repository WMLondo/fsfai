import type { DataSourceOptions } from 'typeorm';
import { loadConfig } from '../config/index.js';
import { ENTITIES } from './schemas/index.js';

/** Opciones comunes de TypeORM para `DatabaseModule` y la CLI (`data-source.ts`). */
export function dataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    url: loadConfig().database.url,
    entities: ENTITIES,
    // Migraciones ESM en JavaScript (`db:generate` usa `--outputJs --esm`), relativas a la app.
    migrations: ['database/migrations/*.js'],
    synchronize: false,
  };
}
