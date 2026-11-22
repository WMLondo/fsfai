import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Documento OpenAPI de la API. Lo usan `main.ts` y la exportación de `@repo/api-client`. */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const options = new DocumentBuilder().setTitle('{{appName}}').setVersion('1.0.0').build();
  return SwaggerModule.createDocument(app, options);
}
