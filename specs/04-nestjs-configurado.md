# SPEC 04 — App NestJS configurada (ESM, ORM, PostgreSQL, Better Auth, Pino, Scalar)

> **Status:** Approved
> **Depends on:** SPEC 02, SPEC 03
> **Date:** 2026-11-21
> **Objective:** Convertir la app NestJS vacía en un backend ESM sobre PostgreSQL con el ORM elegido (Drizzle o TypeORM), Better Auth, nestjs-pino, class-validator, Scalar y la estructura nestjs-project-structure, con tablas segmentadas por schema.

## Alcance

**Dentro:**

- Nuevo prompt `select` justo después del nombre de la app NestJS: "ORM". Opciones: `Drizzle` (preseleccionado) y `TypeORM`.
- Base de datos fija: PostgreSQL. No se muestra prompt de base de datos.
- Conversión a ESM: `"type": "module"`, `tsconfig` con `module` y `moduleResolution` en `nodenext`, e imports relativos con extensión `.js`.
- Quitar ESLint y Prettier con `stripEslintPrettier` (SPEC 03).
- Reemplazar Jest por Vitest con `unplugin-swc` (para la metadata de los decoradores). Borrar la config de Jest y `ts-jest`.
- Dependencias, instaladas en `latest`:
  - Comunes: `@nestjs/config`, `nestjs-pino`, `pino-http`, `pino-pretty` (dev), `class-validator`, `class-transformer`, `@nestjs/swagger`, `@scalar/nestjs-api-reference`, `better-auth`, `@thallesp/nestjs-better-auth`, `pg`, `@types/pg` (dev), `vitest` (dev), `unplugin-swc` (dev), `@swc/core` (dev), `supertest` (dev), `@types/supertest` (dev).
  - Drizzle: `drizzle-orm`, `drizzle-kit` (dev).
  - TypeORM: `@nestjs/typeorm`, `typeorm`.
- Configuración por entorno en `src/config/envs/` (`default.ts`, `development.ts`, `production.ts`, `test.ts`) cargada con `@nestjs/config` según `NODE_ENV`.
- `.env.sample`, más una copia `.env` creada por la CLI. `.env` queda en `.gitignore`.
- `main.ts`: logger de pino, `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`), filtro global de excepciones, CORS con `TRUSTED_ORIGINS` y `credentials: true`, OpenAPI en `/openapi.json`, Scalar en `/reference` y puerto `PORT` (3001).
- Better Auth montado en `/api/auth/*` con `@thallesp/nestjs-better-auth`, email y contraseña activados y `trustedOrigins` desde el env.
- Tablas de Better Auth en el schema `usr`: `usr.usr_user`, `usr.usr_session`, `usr.usr_account`, `usr.usr_verification`. Un archivo por tabla en `src/database/schemas/usr/`.
- Endpoint de ejemplo `GET /health` → `{ status: "ok" }` en `src/health/`, con `@ApiTags("health")`.
- Scripts de la app: `dev` (`nest start --watch`), `build`, `start` (`node dist/main.js`), `start:repl`, `test`, `test:cov`, `test:e2e`, `entity:sync`, más los scripts de migraciones de cada ORM (ver Modelo de datos).
- Copiar a `<skillsDir>/nestjs-backend/references/` el archivo `drizzle.md` o `typeorm.md` según el ORM. `SKILL.md` lo enlaza.
- Un test unitario de `HealthController` y un test e2e de `GET /health`.

**Fuera de alcance (specs futuras):**

- MySQL, SQLite u otras bases de datos.
- `docker-compose` con PostgreSQL.
- GraphQL (`src/gql`), Compodoc y el script `doc`.
- JWT/Passport, guards por rol y CRUD de ejemplo.
- Plugins de Better Auth (2FA, organizaciones, OAuth social).
- `entity:load` para TypeORM.
- Ejecutar migraciones contra una base de datos real durante la creación.

## Modelo de datos

```ts
// src/types.ts (CLI)
export type Orm = "drizzle" | "typeorm";

export type AppSelection =
  | { framework: "nestjs"; name: string; orm: Orm }
  | { framework: "expo"; name: string }     // SPEC 05 lo amplía
  | { framework: "nextjs"; name: string };  // SPEC 06 lo amplía
```

Variables de entorno (`.env.sample`):

```dotenv
NODE_ENV=development
PORT=3001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/<proyecto>
BETTER_AUTH_SECRET=<generado por la CLI con crypto.randomBytes(32).toString("base64")>
BETTER_AUTH_URL=http://localhost:3001
TRUSTED_ORIGINS=http://localhost:3000,<scheme-expo>://
```

`.env.sample` deja `BETTER_AUTH_SECRET` vacío. Solo `.env` lleva el secreto generado. Si no hay Expo, `TRUSTED_ORIGINS` solo tiene `http://localhost:3000`.

Patrón de tablas: carpeta `src/database/schemas/<schema>/<tabla>.ts` → tabla `<schema>.<schema>_<tabla>`.

```ts
// Drizzle — src/database/schemas/usr/user.ts
export const usrUser = usr.table('usr_user', { id: text('id').primaryKey(), /* campos de Better Auth */ });

// Drizzle — src/database/schemas/usr/schema.ts
export const usr = pgSchema('usr');
```

```ts
// TypeORM — src/database/schemas/usr/user.ts
@Entity({ schema: 'usr', name: 'usr_user' })
export class UsrUser { /* campos de Better Auth */ }
```

Better Auth según el ORM:

- Drizzle: `drizzleAdapter(db, { provider: 'pg', schema: { user: usrUser, session: usrSession, account: usrAccount, verification: usrVerification } })`.
- TypeORM: `new Pool({ connectionString, options: '-c search_path=usr' })` con `user.modelName: 'usr_user'` (y lo mismo para cada modelo). Las entidades de TypeORM reflejan esas tablas.

Scripts de base de datos:

| Script | Drizzle | TypeORM |
| --- | --- | --- |
| `entity:sync` | `drizzle-kit push` | `typeorm schema:sync -d dist/database/data-source.js` |
| `entity:load` | `drizzle-kit pull` | — |
| `db:generate` | `drizzle-kit generate` | `typeorm migration:generate -d dist/database/data-source.js database/migrations/<nombre>` |
| `db:migrate` | `drizzle-kit migrate` | `typeorm migration:run -d dist/database/data-source.js` |

`drizzle.config.ts`: `dialect: 'postgresql'`, `schema: './src/database/schemas/index.ts'`, `out: './database/migrations'`, `schemaFilter: ['usr']`.

## Estructura de archivos

App generada (`apps/<nest>/`):

```
apps/<nest>/
├── .env.sample
├── .env
├── drizzle.config.ts                # solo Drizzle
├── vitest.config.ts
├── vitest.e2e.config.ts
├── database/migrations/
├── public/
├── test/health.e2e-spec.ts
├── typings/
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── openapi.ts                   # buildOpenApiDocument(app) — lo reutiliza SPEC 07
    ├── config/
    │   ├── envs/{default,development,production,test}.ts
    │   ├── config.ts                # carga según NODE_ENV
    │   └── index.ts
    ├── auth/
    │   ├── auth.ts                  # betterAuth({...})
    │   └── index.ts
    ├── common/
    │   ├── filters/all-exceptions.filter.ts
    │   ├── filters/index.ts
    │   ├── constants/  decorators/  dto/  guards/  interceptors/  middleware/  pipes/  providers/   (con index.ts)
    │   └── index.ts
    ├── shared/index.ts
    ├── database/
    │   ├── database.module.ts       # proveedor de Drizzle o TypeOrmModule
    │   ├── data-source.ts           # solo TypeORM (CLI)
    │   ├── schemas/
    │   │   ├── usr/{schema,user,session,account,verification,index}.ts
    │   │   └── index.ts
    │   └── index.ts
    └── health/
        ├── health.controller.ts
        ├── health.controller.spec.ts
        ├── health.module.ts
        └── index.ts
```

En la CLI:

```
templates/nestjs/
├── common/                  # archivos iguales para ambos ORM
├── drizzle/                 # database/, drizzle.config.ts
└── typeorm/                 # database/, data-source.ts
templates/skills/nestjs-backend/references/{drizzle,typeorm}.md
src/apps/nestjs.ts           # + askNestOptions(), configureNestApp(options, app)
src/apps/nestjs-deps.ts      # listas de dependencias por ORM
```

## Plan de implementación

1. Añadir `Orm` y el prompt "ORM" (Drizzle preseleccionado) después del nombre de la app Nest. Prueba manual: el resumen muestra el ORM elegido.
2. `configureNestApp`, paso ESM: aplicar `stripEslintPrettier`, poner `"type": "module"`, cambiar `tsconfig.json` a `nodenext` y añadir `.js` a los imports relativos de los archivos generados por Nest. Prueba manual: `pnpm --filter <nest> build && node apps/<nest>/dist/main.js` arranca.
3. Reemplazar Jest por Vitest: borrar la config de Jest, añadir `vitest.config.ts` y `vitest.e2e.config.ts` con `unplugin-swc`, y ajustar los scripts `test*`. Prueba manual: el test de ejemplo de Nest pasa con `vitest run`.
4. Copiar `templates/nestjs/common/`: `config/`, `common/`, `shared/`, `health/`, `main.ts`, `app.module.ts`, `openapi.ts`, más `.env.sample` y `.env` con el secreto generado. Añadir las dependencias comunes al `package.json` de la app. Prueba manual: tras `install`, `GET /health` responde `{ "status": "ok" }`, `/reference` muestra Scalar y los logs salen con pino-pretty.
5. Copiar `templates/nestjs/<orm>/` (`database/` y su config) y añadir las dependencias del ORM. Prueba manual con un Postgres local: `entity:sync` crea `usr.usr_user`, `usr.usr_session`, `usr.usr_account` y `usr.usr_verification`.
6. Copiar `src/auth/auth.ts` según el ORM e importar `AuthModule.forRoot({ auth })` en `app.module.ts`. Prueba manual: `POST /api/auth/sign-up/email` crea una fila en `usr.usr_user`.
7. Añadir los scripts de base de datos de la tabla según el ORM y copiar la referencia del ORM a la skill `nestjs-backend`. Prueba manual: `<pm> run entity:sync` funciona desde `apps/<nest>`, y la skill enlaza `references/<orm>.md`.

## Criterios de aceptación

- [ ] Con NestJS elegido, aparece el prompt "ORM" con `Drizzle` preseleccionado. No aparece ningún prompt de base de datos.
- [ ] `apps/<nest>/package.json` tiene `"type": "module"` y ninguna dependencia de ESLint, Prettier ni Jest.
- [ ] `<pm> run build` en la app termina sin errores y `node dist/main.js` arranca en el puerto 3001.
- [ ] `GET http://localhost:3001/health` responde 200 con `{ "status": "ok" }`.
- [ ] `GET /openapi.json` devuelve un documento OpenAPI 3 que incluye `/health`.
- [ ] `GET /reference` muestra la UI de Scalar.
- [ ] Los logs de las peticiones salen por nestjs-pino, con formato legible en `development`.
- [ ] Un body con propiedades no declaradas en el DTO responde 400 (ValidationPipe con `forbidNonWhitelisted`).
- [ ] Existen los cuatro archivos de entorno en `src/config/envs/` y, con `NODE_ENV=test`, se carga `test.ts`.
- [ ] Existen `.env.sample` (sin secreto) y `.env` (con un `BETTER_AUTH_SECRET` no vacío), y `.env` está en `.gitignore`.
- [ ] Existen `src/database/schemas/usr/user.ts`, `session.ts`, `account.ts` y `verification.ts`.
- [ ] Con Drizzle y un Postgres disponible, `entity:sync` crea las tablas `usr.usr_user`, `usr.usr_session`, `usr.usr_account` y `usr.usr_verification`.
- [ ] Con TypeORM y un Postgres disponible, `entity:sync` crea las mismas cuatro tablas.
- [ ] `POST /api/auth/sign-up/email` con email y contraseña crea un usuario en `usr.usr_user`.
- [ ] `<pm> run test` pasa el test unitario de `HealthController` y `<pm> run test:e2e` pasa el e2e de `/health`.
- [ ] Existe `<skillsDir>/nestjs-backend/references/drizzle.md` o `typeorm.md`, según el ORM, y no el otro.

## Decisiones

- **Sí:** solo PostgreSQL y sin prompt de base de datos. Los schemas nativos encajan con la segmentación por carpeta; un select con una sola opción no aporta nada.
- **Sí:** Drizzle preseleccionado. Adaptador oficial de Better Auth, ESM nativo y schema en TS.
- **Sí:** TypeORM como alternativa, con Better Auth sobre un `pg.Pool` con `search_path=usr`. Better Auth no tiene adaptador oficial de TypeORM.
- **Sí:** patrón `schemas/<schema>/<tabla>.ts` → `<schema>.<schema>_<tabla>`. Es lo que pidió el usuario: el schema agrupa y el prefijo va también en el nombre de la tabla.
- **No:** archivo `*-configuration.ts` aparte. Un archivo por tabla con columnas, índices y relaciones.
- **Sí:** tablas de Better Auth en `usr`. Es el primer schema de dominio y sirve de ejemplo del patrón.
- **Sí:** `src/database/schemas` en lugar de `src/entity` del patrón original. Sirve para ambos ORM y refleja la segmentación.
- **Sí:** Vitest con `unplugin-swc` en lugar de Jest. Lo pide el patrón; SWC emite la metadata de los decoradores que Nest necesita.
- **Sí:** `@thallesp/nestjs-better-auth`. Es la integración de NestJS que recomienda la documentación de Better Auth.
- **Sí:** Scalar en `/reference` y OpenAPI en `/openapi.json`, generado con `@nestjs/swagger`. SPEC 07 consume ese JSON.
- **Sí:** puerto 3001. Next.js se queda en 3000.
- **Sí:** el CLI genera `BETTER_AUTH_SECRET` en `.env`. El proyecto arranca sin pasos manuales y el secreto no se versiona.
- **No:** `entity:load` con TypeORM. `typeorm-model-generator` no está mantenido y no soporta bien ESM.
- **No:** GraphQL, Compodoc, Passport/JWT ni CRUD de ejemplo. Son partes del patrón original que no se pidieron.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Nest CLI genera CommonJS y algún archivo queda sin la extensión `.js` | El paso 2 reescribe los imports relativos y la prueba manual arranca `dist/main.js`. |
| `@thallesp/nestjs-better-auth` es un paquete de la comunidad y puede romperse con una versión nueva de Nest o Better Auth | Está aislado en `src/auth/` y `app.module.ts`. Alternativa: montar `toNodeHandler(auth)` en `main.ts`. |
| Better Auth con TypeORM no respeta `search_path` en alguna consulta | La prueba manual del paso 6 con TypeORM lo detecta. Alternativa: `modelName: 'usr.usr_user'`. |
| Nest lee el body antes que Better Auth y rompe `/api/auth/*` | `NestFactory.create(AppModule, { bodyParser: false })`, como pide la integración. |
| `drizzle-kit push` toca schemas ajenos | `schemaFilter: ['usr']`; cada schema nuevo se añade a esa lista. |

## Lo que **no** está en esta spec

- Otras bases de datos y `docker-compose`.
- GraphQL, Compodoc, Passport/JWT, guards por rol y CRUD de ejemplo.
- Plugins de Better Auth.
- `entity:load` para TypeORM.
- Ejecutar migraciones durante la creación.

Cada uno, si llega, va en su propia spec.
