import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/index.js';
import { loadConfig } from './config/index.js';
import { buildOpenApiDocument } from './openapi.js';

const OPENAPI_PATH = '/openapi.json';
const REFERENCE_PATH = '/reference';

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  // Better Auth necesita el body sin procesar en /api/auth/*;
  // @thallesp/nestjs-better-auth vuelve a añadir los body parsers para el resto de rutas.
  const app = await NestFactory.create(AppModule, { bodyParser: false, bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  app.enableCors({ origin: config.auth.trustedOrigins, credentials: true });

  const document = buildOpenApiDocument(app);
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get(OPENAPI_PATH, (_req: unknown, res: unknown) => httpAdapter.reply(res, document, 200));
  app.use(REFERENCE_PATH, apiReference({ url: OPENAPI_PATH }));

  await app.listen(config.port);
}

await bootstrap();
