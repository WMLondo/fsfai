# TypeORM — {{nestAppPath}}

PostgreSQL database with [TypeORM](https://typeorm.io) and `@nestjs/typeorm`. Shared options in
`src/database/data-source-options.ts`; CLI DataSource in `src/database/data-source.ts`.

## Schemas and entities

- One PostgreSQL schema per folder: `src/database/schemas/<schema>/`.
- `schema.ts` exports the name: `export const USR_SCHEMA = 'usr';`.
- One file per table (entity), with columns, indexes and relations: `src/database/schemas/<schema>/<table>.ts`.
- Table in the database: `<schema>.<schema>_<table>`. Class: `<Schema><Table>` in PascalCase.
- Use `Relation<T>` in relations (avoids circular import issues in ESM).

```ts
// src/database/schemas/usr/profile.ts → table usr.usr_profile
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { USR_SCHEMA } from './schema.js';
import { UsrUser } from './user.js';

@Entity({ schema: USR_SCHEMA, name: 'usr_profile' })
export class UsrProfile {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => UsrUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<UsrUser>;

  @Column('text', { nullable: true })
  bio: string | null;
}
```

After creating the entity:

1. Re-export it in `src/database/schemas/<schema>/index.ts` and add it to the `<SCHEMA>_ENTITIES` list.
2. If it is a new schema: add its name to `SCHEMAS` and its entities to `ENTITIES` in
   `src/database/schemas/index.ts`. TypeORM does not create schemas: the CLI DataSource creates them on connect.

## Using the database in a service

Register the module's entities with `TypeOrmModule.forFeature([...])` and inject the repository:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UsrUser } from '../database/index.js';

@Injectable()
export class UserService {
  constructor(@InjectRepository(UsrUser) private readonly users: Repository<UsrUser>) {}

  findByEmail(email: string) {
    return this.users.findOneBy({ email });
  }
}
```

## Better Auth

Better Auth has no TypeORM adapter: `src/auth/auth.ts` uses its own `pg.Pool` with
`search_path=usr` and `modelName: 'usr_<table>'`. The `UsrUser`, `UsrSession`, `UsrAccount`
and `UsrVerification` entities mirror those tables: their columns use Better Auth's field names
(`emailVerified`, `userId`...). Do not rename them.

## Scripts

From `{{nestAppPath}}`. They use the compiled DataSource: run `{{packageManager}} run build` first.

- `{{packageManager}} run entity:sync` — `typeorm schema:sync`: applies the entities directly (development).
- `{{packageManager}} run db:generate database/migrations/<name>` — `typeorm migration:generate`: creates
  a migration (ESM JavaScript) with the diff between the entities and the database.
- `{{packageManager}} run db:migrate` — `typeorm migration:run`: applies pending migrations.

Use `entity:sync` for local development and migrations (`db:generate` + `db:migrate`) for production.
