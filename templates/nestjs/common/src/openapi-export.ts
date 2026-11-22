import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { buildOpenApiDocument } from './openapi.js';

// `openapi:export`: escribe el contrato en `packages/api-client/openapi.json` sin escuchar en
// ningún puerto. `preview: true` no instancia los providers, así que no necesita base de datos.
// Desde `dist/openapi-export.js`: `apps/<app>/dist` → raíz del monorepo.
const OUTPUT_FILE = fileURLToPath(
  new URL('../../../packages/api-client/openapi.json', import.meta.url),
);

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  const document = buildOpenApiDocument(app);
  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

await exportOpenApi();
