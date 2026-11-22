# @repo/api-client

Cliente tipado del backend NestJS, generado desde su OpenAPI.

```ts
import { createApiClient } from '@repo/api-client';

const api = createApiClient({ baseUrl: 'http://localhost:3001', credentials: 'include' });

await api.health.check(); // GET /health
```

## Regenerar

Después de cambiar un controlador de Nest, desde la raíz del monorepo:

```sh
{{packageManager}} run api:generate
```

Esto escribe `openapi.json`, `src/generated/schema.ts` y `src/generated/resources.ts`. Los tres se versionan.

## Reglas

- Recurso = controlador sin `Controller`, en camelCase (`UserController` → `api.user`).
- Función = método del controlador (`find`, `findOne`, `update`...). Se lee del `operationId`
  `<Controller>Controller_<método>`, el que genera `@nestjs/swagger` por defecto. Las operaciones con otro
  `operationId` se omiten con un aviso.
- Cada función recibe un único objeto de params:
  - Las claves que coinciden con un parámetro de ruta van a la ruta (`/users/{id}`). **Si el body tiene una clave
    con el mismo nombre que un parámetro de ruta, va a la ruta, no al body.**
  - En `GET` y `DELETE`, el resto va a la query string.
  - En `POST`, `PUT` y `PATCH`, el resto va al body JSON.
- Una respuesta que no es 2xx lanza `ApiError` con `status` y `body`.
