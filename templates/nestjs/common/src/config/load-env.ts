import { existsSync } from 'node:fs';

// Carga `.env` (si existe) antes de leer `process.env`. No sobrescribe variables ya definidas.
const ENV_FILE = '.env';

if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}
