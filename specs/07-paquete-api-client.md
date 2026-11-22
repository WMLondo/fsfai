# SPEC 07 — Paquete `api-client` tipado desde el OpenAPI de NestJS

> **Status:** Approved
> **Depends on:** SPEC 02, SPEC 04
> **Date:** 2026-11-21
> **Objective:** Crear `packages/api-client`, que genera tipos y recursos desde el OpenAPI de la app NestJS y permite llamar al backend desde el frontend con la forma `api.user.find({ name: 'user' })`.

## Por qué existe esta spec

Escribir a mano los tipos y las llamadas `fetch` de cada endpoint hace que se desincronicen del backend.
La guía de estilo pide generar los tipos desde el contrato. NestJS ya publica ese contrato en `/openapi.json` (SPEC 04).
Este paquete convierte ese contrato en un cliente con forma de recurso, parecida a usar un repositorio en el backend.

## Alcance

**Dentro:**

- Se crea siempre que se elija NestJS, haya o no apps front.
- Paquete `packages/api-client` con nombre `@repo/api-client` (la convención de Turborepo).
- Script `openapi:export` en la app Nest: compila y ejecuta `dist/openapi-export.js`, que construye el documento con `buildOpenApiDocument` (SPEC 04) sin escuchar en ningún puerto y lo escribe en `packages/api-client/openapi.json`.
- Script `generate` en el paquete:
  1. `openapi-typescript openapi.json -o src/generated/schema.ts`.
  2. `node scripts/generate-resources.mjs` → `src/generated/resources.ts`.
- Script `api:generate` en la raíz: `turbo run openapi:export && <pm> --filter @repo/api-client run generate` (con npm: `-w @repo/api-client`).
- Reglas de generación de recursos:
  - Cada operación OpenAPI tiene un `operationId` `<Controller>Controller_<método>`, que es el default de `@nestjs/swagger`.
  - Recurso = nombre del controlador sin `Controller`, en camelCase (`UserController` → `user`).
  - Función = nombre del método del controlador (`find`, `findOne`, `create`...).
  - Resultado: `api.<recurso>.<método>(params)`.
- Firma de cada función: un único objeto `params` (o ninguno si la operación no tiene parámetros).
  - Las claves que coinciden con parámetros de ruta van a la ruta (`/users/{id}`).
  - En `GET` y `DELETE`, el resto va a la query string.
  - En `POST`, `PUT` y `PATCH`, el resto va al body JSON.
  - Tipos de entrada y salida derivados de `schema.ts`.
- Runtime en `src/client.ts` con `fetch` nativo:
  - `createApiClient({ baseUrl, getHeaders?, credentials? })` devuelve el objeto de recursos.
  - Si la respuesta no es 2xx, lanza `ApiError` con `status` y `body`.
- El paquete exporta el código TS sin compilar (`"exports": { ".": "./src/index.ts" }`).
- Si existen apps front:
  - Añadir `@repo/api-client` como dependencia de workspace (`workspace:*` con pnpm, `*` con npm).
  - En Next.js, añadir `transpilePackages: ['@repo/api-client']` en `next.config.ts`.
- La CLI ejecuta `api:generate` una vez al final, después del `install`. Si falla, `log.warn` con el comando para reintentarlo, y la CLI no sale con error.
- Los archivos generados (`openapi.json` y `src/generated/`) se versionan.

**Fuera de alcance (specs futuras):**

- Hooks de TanStack Query generados (`useUserFind`).
- Validación en runtime de las respuestas (zod).
- Regeneración automática en `dev` (watch).
- Endpoints de Better Auth dentro del cliente (se usan con `authClient`).
- Varios backends o versiones de API.
- Paginación o filtros con formato propio.

## Modelo de datos

Uso esperado:

```ts
import { createApiClient } from '@repo/api-client';

const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '' , credentials: 'include' });

const health = await api.health.check();                // GET /health
const users = await api.user.find({ name: 'user' });    // GET /users?name=user
const user = await api.user.findOne({ id: '123' });     // GET /users/{id}
await api.user.update({ id: '123', name: 'nuevo' });    // PATCH /users/{id} body { name }
```

```ts
// src/client.ts
export type ApiClientOptions = {
  baseUrl: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  credentials?: RequestCredentials;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
}
```

```ts
// src/generated/resources.ts (generado; ejemplo)
export const RESOURCES = {
  health: {
    check: { method: 'get', path: '/health', pathParams: [] },
  },
} as const;
```

Los tipos de cada función se derivan con tipos genéricos sobre `paths` de `schema.ts`, indexados por `path` y `method` de `RESOURCES`.

Uso desde Expo con Better Auth:

```ts
createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? '', getHeaders: () => ({ Cookie: authClient.getCookie() }) });
```

## Estructura de archivos

```
packages/api-client/
├── package.json                 # @repo/api-client, devDeps: openapi-typescript
├── tsconfig.json                # extiende @repo/typescript-config
├── openapi.json                 # generado, versionado
├── scripts/
│   └── generate-resources.mjs
└── src/
    ├── index.ts                 # export { createApiClient, ApiError } y tipos
    ├── client.ts
    ├── types.ts                 # tipos genéricos params/response
    └── generated/
        ├── schema.ts            # generado
        └── resources.ts         # generado

apps/<nest>/src/openapi-export.ts
```

En la CLI:

```
templates/api-client/            # todo lo de arriba salvo los archivos generados
templates/nestjs/common/src/openapi-export.ts
src/packages/api-client.ts       # createApiClientPackage(options), linkToFrontApps(options)
```

## Plan de implementación

1. Añadir `openapi-export.ts` a la plantilla de Nest y su script `openapi:export`. Usa `NestFactory.create(AppModule, { preview: true, logger: false })`, `buildOpenApiDocument(app)` y `writeFile`. Prueba manual: `<pm> run openapi:export` en la app crea `packages/api-client/openapi.json` sin base de datos disponible.
2. Copiar `templates/api-client/` a `packages/api-client` cuando haya NestJS, y añadir `api:generate` a la raíz. Prueba manual: el paquete aparece en el workspace tras `install`.
3. Implementar `scripts/generate-resources.mjs`: lee `openapi.json`, agrupa por `operationId` y escribe `RESOURCES`. Las operaciones sin `operationId` con el formato esperado se omiten con un aviso. Prueba manual: con `/health`, genera `health.check`.
4. Implementar `src/types.ts` y `src/client.ts`: tipos de params/response derivados de `paths` y el reparto de params a ruta, query o body. Prueba manual: `api.health.check()` tipa la respuesta como `{ status: string }` y la petición llega a Nest.
5. Si hay apps front, añadir la dependencia de workspace y `transpilePackages` en Next.js. Prueba manual: importar `@repo/api-client` en `HomePage` de Next.js y de Expo compila.
6. Ejecutar `api:generate` al final de la CLI, con `log.warn` si falla. Prueba manual: un proyecto recién creado ya trae `src/generated/schema.ts` y `resources.ts`.

## Criterios de aceptación

- [ ] Con NestJS elegido existe `packages/api-client/package.json` con `name: "@repo/api-client"`.
- [ ] Sin NestJS no existe `packages/api-client`.
- [ ] `<pm> run openapi:export` en la app Nest escribe `packages/api-client/openapi.json` aunque PostgreSQL no esté disponible.
- [ ] `<pm> run api:generate` en la raíz termina con código 0 y regenera `src/generated/schema.ts` y `src/generated/resources.ts`.
- [ ] Con el proyecto recién creado, `api.health.check()` existe, devuelve `{ status: 'ok' }` y su tipo de retorno es el del OpenAPI.
- [ ] Con un controlador `UserController` con `find(@Query() q: FindUserDto)`, después de `api:generate` existe `api.user.find({ name })` y TypeScript rechaza una clave que no está en `FindUserDto`.
- [ ] Con `findOne(@Param('id') id)`, `api.user.findOne({ id: '1' })` llama a `GET /users/1`.
- [ ] Con `update(@Param('id') id, @Body() dto)`, `api.user.update({ id: '1', name: 'x' })` llama a `PATCH /users/1` con body `{ "name": "x" }`.
- [ ] Una respuesta 404 lanza `ApiError` con `status === 404`.
- [ ] `getHeaders` se llama en cada petición y sus cabeceras se envían.
- [ ] Con Expo y/o Next.js, sus `package.json` dependen de `@repo/api-client` con el protocolo del gestor elegido.
- [ ] Con Next.js, `next.config.ts` incluye `@repo/api-client` en `transpilePackages` y `<pm> run build` de la app pasa.
- [ ] Si `api:generate` falla durante la creación, la CLI muestra un aviso con el comando para reintentarlo y termina con código 0.

## Decisiones

- **Sí:** generar tipos desde el OpenAPI de Nest. La guía pide generar desde el contrato, y Nest ya lo expone para Scalar.
- **No:** un contrato zod escrito a mano. Nest valida con class-validator; habría dos fuentes de verdad.
- **No:** importar los tipos del ORM. Acopla el frontend al esquema de la base de datos.
- **Sí:** recursos derivados de `operationId` (`<Controller>Controller_<método>`). Da `api.user.find(...)` sin configurar nada y sin singularizar rutas.
- **Sí:** un único objeto de params, repartido por nombre a ruta, query o body. Es la forma `user.find({ name })` que pidió el usuario y sigue la regla de "un solo objeto como argumento" de la guía.
- **Sí:** `fetch` nativo sin dependencias de runtime. Funciona en Next.js, Expo y Node.
- **No:** `openapi-fetch`. Su API es por ruta (`GET('/users')`), no por recurso.
- **Sí:** el paquete se crea siempre que haya NestJS. Lo pidió el usuario, aunque no haya front.
- **Sí:** exportar TS sin compilar. Evita un paso de build; Next.js usa `transpilePackages` y Metro compila TS del workspace.
- **Sí:** versionar los archivos generados. El proyecto compila recién clonado, sin levantar Nest.
- **Sí:** export del OpenAPI con `preview: true`. No instancia proveedores, así que no necesita base de datos.
- **No:** hooks de TanStack Query en esta spec. Van en otra.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `preview: true` no permite que `SwaggerModule.createDocument` lea los controladores | Alternativa: crear la app normal con la conexión de base de datos diferida (`pg.Pool` no conecta hasta la primera consulta; TypeORM con `manualInitialization`). Se decide en la prueba manual del paso 1. |
| Dos controladores con el mismo nombre generan el mismo recurso | El generador falla con un error que nombra los dos `operationId`. |
| Un body con una clave igual a un parámetro de ruta | La clave va a la ruta. Esto se documenta en el README del paquete y en la skill `nestjs-backend`. |
| Los tipos genéricos derivados de `paths` son lentos o difíciles de leer en el IDE | `RESOURCES` es `as const` y los tipos se resuelven por índice directo, sin uniones grandes. |
| `authClient.getCookie()` cambia en Better Auth Expo | Se configura en la app, no en el paquete; `getHeaders` es genérico. |

## Lo que **no** está en esta spec

- Hooks de TanStack Query.
- Validación de respuestas en runtime.
- Regeneración en watch.
- Endpoints de Better Auth en el cliente.
- Varios backends o versiones de API.

Cada uno, si llega, va en su propia spec.
