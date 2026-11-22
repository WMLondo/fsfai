import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source-options.js';
import { SCHEMAS } from './schemas/index.js';

/**
 * DataSource de la CLI de TypeORM: `typeorm <comando> -d dist/database/data-source.js`.
 * TypeORM no crea los schemas de PostgreSQL: se crean al conectar, antes de
 * `schema:sync` o `migration:run`.
 */
class CliDataSource extends DataSource {
  override async initialize(): Promise<this> {
    await super.initialize();
    for (const schema of SCHEMAS) {
      await this.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    }
    return this;
  }
}

export default new CliDataSource(dataSourceOptions());
