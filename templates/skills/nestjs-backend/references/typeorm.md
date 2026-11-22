# TypeORM — {{nestAppPath}}

Base de datos PostgreSQL con [TypeORM](https://typeorm.io) y `@nestjs/typeorm`. Opciones comunes en
`src/database/data-source-options.ts`; DataSource de la CLI en `src/database/data-source.ts`.

## Schemas y entidades

- Un schema de PostgreSQL por carpeta: `src/database/schemas/<schema>/`.
- `schema.ts` exporta el nombre: `export const USR_SCHEMA = 'usr';`.
- Un archivo por tabla (entidad), con columnas, índices y relaciones: `src/database/schemas/<schema>/<tabla>.ts`.
- Tabla en la base de datos: `<schema>.<schema>_<tabla>`. Clase: `<Schema><Tabla>` en PascalCase.
- En relaciones usa `Relation<T>` (evita problemas de imports circulares en ESM).

```ts
// src/database/schemas/usr/profile.ts → tabla usr.usr_profile
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

Después de crear la entidad:

1. Reexpórtala en `src/database/schemas/<schema>/index.ts` y añádela a la lista `<SCHEMA>_ENTITIES`.
2. Si es un schema nuevo: añade su nombre a `SCHEMAS` y sus entidades a `ENTITIES` en
   `src/database/schemas/index.ts`. TypeORM no crea schemas: el DataSource de la CLI los crea al conectar.

## Usar la base de datos en un servicio

Registra las entidades del módulo con `TypeOrmModule.forFeature([...])` e inyecta el repositorio:

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

Better Auth no tiene adaptador de TypeORM: en `src/auth/auth.ts` usa su propio `pg.Pool` con
`search_path=usr` y `modelName: 'usr_<tabla>'`. Las entidades `UsrUser`, `UsrSession`, `UsrAccount`
y `UsrVerification` reflejan esas tablas: sus columnas usan los nombres de campo de Better Auth
(`emailVerified`, `userId`...). No las renombres.

## Scripts

Desde `{{nestAppPath}}`. Usan el DataSource compilado: ejecuta `{{packageManager}} run build` antes.

- `{{packageManager}} run entity:sync` — `typeorm schema:sync`: aplica las entidades directamente (desarrollo).
- `{{packageManager}} run db:generate database/migrations/<nombre>` — `typeorm migration:generate`: crea
  una migración (JavaScript ESM) con la diferencia entre las entidades y la base de datos.
- `{{packageManager}} run db:migrate` — `typeorm migration:run`: aplica las migraciones pendientes.

Usa `entity:sync` en desarrollo local y migraciones (`db:generate` + `db:migrate`) para producción.
