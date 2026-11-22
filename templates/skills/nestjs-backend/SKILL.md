---
name: nestjs-backend
description: Use ALWAYS when reading, writing or reviewing NestJS backend code ({{nestAppPath}}): modules, controllers, services, DTOs, auth, database, schemas or tests.
---

# NestJS backend — structure and conventions

App: `{{nestAppPath}}`. Package manager: **{{packageManager}}**.

## Tooling

- **ESM**, not CommonJS (`"type": "module"`, `import`/`export` syntax).
- **Oxlint** instead of ESLint and **Oxfmt** instead of Prettier. Run them from the monorepo root:
  `{{packageManager}} run lint` and `{{packageManager}} run format`. Do not add ESLint or Prettier.
- Always use **{{packageManager}}** to install dependencies (`{{packageManager}} add` / `{{packageManager}} install`), never another package manager.

## Configuration

- Configuration lives in `src/config/envs/`, one file per environment:
  - `default.ts` — shared values.
  - `development.ts`, `production.ts`, `test.ts` — override `default` based on `NODE_ENV`.
- Environment variables are documented in `.env.sample`. For development, copy it to `.env` (which is not committed).
- Never read `process.env` outside `src/config/`. The rest of the code uses the injected configuration.

## Folder structure

```
{{nestAppPath}}/
├── bin/                  # executable scripts (CLI, tasks, seeds)
├── public/               # static files
├── src/
│   ├── config/           # configuration and src/config/envs/
│   ├── auth/             # authentication and authorization
│   ├── common/           # cross-cutting pieces, no business logic
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   └── providers/
│   ├── shared/           # modules shared across features
│   ├── database/
│   │   └── schemas/      # one subdirectory per PostgreSQL schema
│   └── <feature>/        # one module per feature
├── test/                 # e2e tests
└── typings/              # global type declarations (*.d.ts)
```

## Module structure

Each feature module (`src/<name>/`) contains:

```
src/<name>/
├── <name>.constant.ts
├── <name>.controller.ts
├── <name>.service.ts
├── <name>.module.ts
└── index.ts
```

## File names

- A `PascalCaseSuffix` class goes in `pascal-case.suffix.ts`.
  - `UserController` → `user.controller.ts`
  - `JwtAuthGuard` → `jwt-auth.guard.ts`
  - `CreateUserDto` → `create-user.dto.ts`

## Imports

- Every folder has an `index.ts` that re-exports its public content.
- Always import from the folder, not from the internal file: `import { UserService } from '../user';`.
- **Never** import from a path ending in `.` or `..` (`from '.'`, `from '..'`). Name the folder.

## Database

- Segmented by **PostgreSQL schema**.
- Folder: `src/database/schemas/<schema>/<table>.ts`. **One file per table.**
- Table name in the database: `<schema>.<schema>_<table>`.
  - Example: `src/database/schemas/usr/user.ts` → table `usr.usr_user`.
- ORM: **{{ormLabel}}** on PostgreSQL. How to add tables, query and migrate: [references/{{orm}}.md](references/{{orm}}.md).

## Validation, logging and documentation

- Input validation with **class-validator** and **class-transformer** (DTOs + `ValidationPipe`).
- Logging with **nestjs-pino**. Do not use `console.log`.
- OpenAPI documentation with **Scalar**, served at `/reference`.

## Typed client (`@repo/api-client`)

- `packages/api-client` is generated from this app's OpenAPI. After changing a controller, run `api:generate` from
  the monorepo root and commit `openapi.json` and `src/generated/`.
- Resource = controller name without `Controller`, in camelCase; function = method name
  (`UserController.find` → `api.user.find(params)`). Keep the default `operationId` of `@nestjs/swagger`.
- `params` is one object: keys matching a route param go to the route, the rest to the query (`GET`, `DELETE`) or the
  JSON body (`POST`, `PUT`, `PATCH`). **Do not give a body DTO a key with the same name as a route param**: it goes
  to the route, not to the body.

## Tests

- **Vitest**.
- Unit tests `*.spec.ts` next to the code they test.
- e2e tests in `test/`.
