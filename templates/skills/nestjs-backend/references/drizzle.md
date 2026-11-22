# Drizzle ORM — {{nestAppPath}}

Base de datos PostgreSQL con [Drizzle ORM](https://orm.drizzle.team). Configuración de la CLI en `drizzle.config.ts`.

## Schemas y tablas

- Un schema de PostgreSQL por carpeta: `src/database/schemas/<schema>/`.
- `schema.ts` declara el schema: `export const usr = pgSchema('usr');`.
- Un archivo por tabla, con columnas, índices y relaciones: `src/database/schemas/<schema>/<tabla>.ts`.
- Tabla en la base de datos: `<schema>.<schema>_<tabla>`. Variable exportada: `<schema><Tabla>` en camelCase.
- Columnas en `snake_case` en la base de datos; propiedades en camelCase en TS.

```ts
// src/database/schemas/usr/profile.ts → tabla usr.usr_profile
import { text, timestamp } from 'drizzle-orm/pg-core';
import { usr } from './schema.js';
import { usrUser } from './user.js';

export const usrProfile = usr.table('usr_profile', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => usrUser.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

Después de crear la tabla:

1. Reexpórtala en `src/database/schemas/<schema>/index.ts`.
2. Si es un schema nuevo: reexporta su carpeta en `src/database/schemas/index.ts` y añade el nombre a `schemaFilter` en `drizzle.config.ts`.

## Usar la base de datos en un servicio

`DatabaseModule` es global y expone el cliente con el token `DRIZZLE`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type Database, usrUser } from '../database/index.js';

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByEmail(email: string) {
    return this.db.query.usrUser.findFirst({ where: eq(usrUser.email, email) });
  }
}
```

## Better Auth

Las tablas de Better Auth (`usr_user`, `usr_session`, `usr_account`, `usr_verification`) se pasan al
`drizzleAdapter` en `src/auth/auth.ts`. Si añades campos a esas tablas, decláralos también en la
config de Better Auth (`additionalFields`).

## Scripts

Desde `{{nestAppPath}}`:

- `{{packageManager}} run entity:sync` — `drizzle-kit push`: aplica el schema directamente (desarrollo).
- `{{packageManager}} run entity:load` — `drizzle-kit pull`: genera el schema TS desde la base de datos.
- `{{packageManager}} run db:generate` — `drizzle-kit generate`: crea una migración SQL en `database/migrations/`.
- `{{packageManager}} run db:migrate` — `drizzle-kit migrate`: aplica las migraciones pendientes.

Usa `entity:sync` en desarrollo local y migraciones (`db:generate` + `db:migrate`) para producción.
