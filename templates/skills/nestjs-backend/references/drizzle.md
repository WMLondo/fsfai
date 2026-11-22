# Drizzle ORM — {{nestAppPath}}

PostgreSQL database with [Drizzle ORM](https://orm.drizzle.team). CLI configuration in `drizzle.config.ts`.

## Schemas and tables

- One PostgreSQL schema per folder: `src/database/schemas/<schema>/`.
- `schema.ts` declares the schema: `export const usr = pgSchema('usr');`.
- One file per table, with columns, indexes and relations: `src/database/schemas/<schema>/<table>.ts`.
- Table in the database: `<schema>.<schema>_<table>`. Exported variable: `<schema><Table>` in camelCase.
- Columns in `snake_case` in the database; camelCase properties in TS.

```ts
// src/database/schemas/usr/profile.ts → table usr.usr_profile
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

After creating the table:

1. Re-export it in `src/database/schemas/<schema>/index.ts`.
2. If it is a new schema: re-export its folder in `src/database/schemas/index.ts` and add its name to `schemaFilter` in `drizzle.config.ts`.

## Using the database in a service

`DatabaseModule` is global and exposes the client under the `DRIZZLE` token:

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

The Better Auth tables (`usr_user`, `usr_session`, `usr_account`, `usr_verification`) are passed to the
`drizzleAdapter` in `src/auth/auth.ts`. If you add fields to those tables, also declare them in the
Better Auth config (`additionalFields`).

## Scripts

From `{{nestAppPath}}`:

- `{{packageManager}} run entity:sync` — `drizzle-kit push`: applies the schema directly (development).
- `{{packageManager}} run entity:load` — `drizzle-kit pull`: generates the TS schema from the database.
- `{{packageManager}} run db:generate` — `drizzle-kit generate`: creates a SQL migration in `database/migrations/`.
- `{{packageManager}} run db:migrate` — `drizzle-kit migrate`: applies pending migrations.

Use `entity:sync` for local development and migrations (`db:generate` + `db:migrate`) for production.
