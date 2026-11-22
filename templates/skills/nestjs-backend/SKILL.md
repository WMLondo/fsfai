---
name: nestjs-backend
description: Úsala SIEMPRE que leas, escribas o revises código de backend NestJS ({{nestAppPath}}): módulos, controladores, servicios, DTOs, auth, base de datos, schemas o tests.
---

# NestJS backend — estructura y convenciones

App: `{{nestAppPath}}`. Gestor de paquetes: **{{packageManager}}**.

## Herramientas

- **ESM**, no CommonJS (`"type": "module"`, imports con `import`/`export`).
- **Oxlint** en lugar de ESLint y **Oxfmt** en lugar de Prettier. Se ejecutan desde la raíz del monorepo:
  `{{packageManager}} run lint` y `{{packageManager}} run format`. No añadas ESLint ni Prettier.
- Usa siempre **{{packageManager}}** para instalar dependencias (`{{packageManager}} add` / `{{packageManager}} install`), nunca otro gestor.

## Configuración

- La configuración vive en `src/config/envs/`, un archivo por entorno:
  - `default.ts` — valores comunes.
  - `development.ts`, `production.ts`, `test.ts` — sobrescriben `default` según `NODE_ENV`.
- Las variables de entorno se documentan en `.env.sample`. Para desarrollo se copia a `.env` (que no se versiona).
- Nunca leas `process.env` fuera de `src/config/`. El resto del código usa la configuración inyectada.

## Estructura de carpetas

```
{{nestAppPath}}/
├── bin/                  # scripts ejecutables (CLI, tareas, seeds)
├── public/               # archivos estáticos
├── src/
│   ├── config/           # configuración y src/config/envs/
│   ├── auth/             # autenticación y autorización
│   ├── common/           # piezas transversales, sin lógica de negocio
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
│   ├── shared/           # módulos compartidos entre features
│   ├── database/
│   │   └── schemas/      # un subdirectorio por schema de PostgreSQL
│   └── <feature>/        # un módulo por funcionalidad
├── test/                 # tests e2e
└── typings/              # declaraciones de tipos globales (*.d.ts)
```

## Estructura de un módulo

Cada módulo de funcionalidad (`src/<name>/`) contiene:

```
src/<name>/
├── <name>.constant.ts
├── <name>.controller.ts
├── <name>.service.ts
├── <name>.module.ts
└── index.ts
```

## Nombres de archivo

- Una clase `PascalCaseSuffix` va en `pascal-case.suffix.ts`.
  - `UserController` → `user.controller.ts`
  - `JwtAuthGuard` → `jwt-auth.guard.ts`
  - `CreateUserDto` → `create-user.dto.ts`

## Imports

- Cada carpeta tiene un `index.ts` que reexporta su contenido público.
- Importa siempre desde la carpeta, no desde el archivo interno: `import { UserService } from '../user';`.
- **Nunca** importes desde una ruta que termina en `.` o `..` (`from '.'`, `from '..'`). Nombra la carpeta.

## Base de datos

- Segmentada por **schema de PostgreSQL**.
- Carpeta: `src/database/schemas/<schema>/<tabla>.ts`. **Un archivo por tabla.**
- Nombre de la tabla en la base de datos: `<schema>.<schema>_<tabla>`.
  - Ejemplo: `src/database/schemas/usr/user.ts` → tabla `usr.usr_user`.
- ORM: **{{ormLabel}}** sobre PostgreSQL. Cómo añadir tablas, consultar y migrar: [references/{{orm}}.md](references/{{orm}}.md).

## Validación, logs y documentación

- Validación de entrada con **class-validator** y **class-transformer** (DTOs + `ValidationPipe`).
- Logs con **nestjs-pino**. No uses `console.log`.
- Documentación OpenAPI con **Scalar**, servida en `/reference`.

## Tests

- **Vitest**.
- Tests unitarios `*.spec.ts` junto al código que prueban.
- Tests e2e en `test/`.
