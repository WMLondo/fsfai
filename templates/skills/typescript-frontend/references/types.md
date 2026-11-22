# Tipos

## Inferencia

Deja que TypeScript infiera cuando el tipo es obvio. Anota cuando estrecha el tipo o documenta una intención.

```ts
// ❌
const userRole: string = 'admin'; // demasiado amplio
const employees = new Map(); // Map<any, any>

// ✅
const USER_ROLE = 'admin'; // 'admin'
const employees = new Map<string, number>();
```

## Inmutabilidad

Los datos son inmutables por defecto. Usa `Readonly` y `ReadonlyArray` y no mutes argumentos.

```ts
// ❌
const removeFirstUser = (users: Array<User>) => {
  users.splice(0, 1);
  return users;
};

// ✅
const removeFirstUser = (users: ReadonlyArray<User>) => users.slice(1);
```

## Propiedades obligatorias y opcionales

Haz obligatorias la mayoría de propiedades. Las opcionales multiplican los estados posibles y obligan a comprobar `undefined`.
Si dos propiedades van siempre juntas, modela el objeto con una unión discriminada (ver `discriminated-unions.md`).

```ts
// ❌
type User = {
  id?: number;
  email?: string;
  dashboardAccess?: boolean;
  adminPermissions?: ReadonlyArray<string>;
};

// ✅
type AdminUser = { role: 'admin'; id: number; email: string; adminPermissions: ReadonlyArray<string> };
type RegularUser = { role: 'regular'; id: number; email: string; dashboardAccess: boolean };
type User = AdminUser | RegularUser;
```

## Constantes con `satisfies`

Combina `as const` con `satisfies` para validar la forma sin perder los tipos literales.

```ts
type OrderStatus = { pending: 'pending' | 'idle'; fulfilled: boolean; error: string };

const DEFAULT_ORDER_STATUS = {
  pending: 'idle',
  fulfilled: true,
  error: 'Shipping Error',
} as const satisfies OrderStatus;
```

## Template literal types

Úsalos para restringir strings con un formato conocido.

```ts
type ApiRoute = `/${'users' | 'orders'}/${number}`;
type ButtonSize = `${'small' | 'medium' | 'large'}-${'mobile' | 'desktop'}`;
```

## `any` y `unknown`

- `any` está prohibido (`typescript/no-explicit-any`).
- Para datos de origen desconocido usa `unknown` y estrecha con guardas de tipo o con un validador (p. ej. Zod).

```ts
// ❌
const parse = (value: any) => value.name;

// ✅
const parse = (value: unknown) => {
  if (typeof value === 'object' && value !== null && 'name' in value) {
    return String(value.name);
  }
  throw new Error('Invalid value');
};
```

## Aserciones de tipo y de no nulo

- Evita `as`. Si el tipo no encaja, el tipo está mal definido.
- `!` (non-null assertion) está prohibido (`typescript/no-non-null-assertion`). Comprueba el valor.
- La única excepción habitual es `as const`.

## Errores de tipo

Si de verdad hay que silenciar un error, usa `// @ts-expect-error` con un comentario que explique por qué. Nunca `// @ts-ignore`.

```ts
// @ts-expect-error: la librería X tipa mal el segundo argumento (issue #123).
legacyLib.init(config, undefined);
```

## `type` en lugar de `interface`

Usa siempre `type` (`typescript/consistent-type-definitions`). Es más flexible (uniones, mapped types) y evita el
"declaration merging" accidental. La excepción es extender tipos de librerías que lo exigen.

```ts
// ❌
interface UserProps { name: string }

// ✅
type UserProps = { name: string };
```

## Arrays

Usa la sintaxis genérica `Array<T>` / `ReadonlyArray<T>` (`typescript/array-type`). Se lee mejor con uniones y readonly.

```ts
// ❌
const x: string[] = [];
const y: readonly (string | number)[] = [];

// ✅
const x: Array<string> = [];
const y: ReadonlyArray<string | number> = [];
```

## Imports y exports de tipos

Importa los tipos con `import type` (`typescript/consistent-type-imports`).

```ts
import type { User } from '@/features/user';
import { fetchUser } from '@/features/user';
```

## Tipos generados

Los tipos de la API (OpenAPI, GraphQL, ORM) se generan, no se escriben a mano. No edites archivos de `generated/`.
