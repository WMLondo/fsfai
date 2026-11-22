import '../load-env.js';

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/** Valores comunes a todos los entornos. Cada entorno sobrescribe lo que necesite. */
export const config = {
  port: Number(process.env.PORT ?? 3001),
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  auth: {
    secret: process.env.BETTER_AUTH_SECRET ?? '',
    url: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
    trustedOrigins: parseList(process.env.TRUSTED_ORIGINS),
  },
  logger: {
    level: 'info',
    pretty: false,
  },
};
