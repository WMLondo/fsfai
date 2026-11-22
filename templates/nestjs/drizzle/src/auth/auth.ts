import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { loadConfig } from '../config/index.js';
import { db, usrAccount, usrSession, usrUser, usrVerification } from '../database/index.js';

const config = loadConfig();

/** Better Auth montado en `/api/auth/*` por `AuthModule.forRoot({ auth })` (app.module.ts). */
export const auth = betterAuth({
  secret: config.auth.secret,
  baseURL: config.auth.url,
  trustedOrigins: config.auth.trustedOrigins,
  emailAndPassword: { enabled: true },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: usrUser,
      session: usrSession,
      account: usrAccount,
      verification: usrVerification,
    },
  }),
});
