import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { loadConfig } from '../config/index.js';

const config = loadConfig();

/**
 * Better Auth montado en `/api/auth/*` por `AuthModule.forRoot({ auth })` (app.module.ts).
 * Better Auth no tiene adaptador de TypeORM: usa su propio `pg.Pool` con `search_path=usr`,
 * y las entidades de `src/database/schemas/usr/` reflejan sus tablas.
 */
export const auth = betterAuth({
  secret: config.auth.secret,
  baseURL: config.auth.url,
  trustedOrigins: config.auth.trustedOrigins,
  emailAndPassword: { enabled: true },
  database: new Pool({
    connectionString: config.database.url,
    options: '-c search_path=usr',
  }),
  user: { modelName: 'usr_user' },
  session: { modelName: 'usr_session' },
  account: { modelName: 'usr_account' },
  verification: { modelName: 'usr_verification' },
});
