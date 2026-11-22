# Types

## Inference

Let TypeScript infer when the type is obvious. Annotate when it narrows the type or documents intent.

```ts
// ❌
const userRole: string = 'admin'; // too broad
const employees = new Map(); // Map<any, any>

// ✅
const USER_ROLE = 'admin'; // 'admin'
const employees = new Map<string, number>();
```

## Immutability

Data is immutable by default. Use `Readonly` and `ReadonlyArray` and do not mutate arguments.

```ts
// ❌
const removeFirstUser = (users: Array<User>) => {
  users.splice(0, 1);
  return users;
};

// ✅
const removeFirstUser = (users: ReadonlyArray<User>) => users.slice(1);
```

## Required and optional properties

Make most properties required. Optional ones multiply the possible states and force `undefined` checks.
If two properties always go together, model the object with a discriminated union (see `discriminated-unions.md`).

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

## Constants with `satisfies`

Combine `as const` with `satisfies` to validate the shape without losing literal types.

```ts
type OrderStatus = { pending: 'pending' | 'idle'; fulfilled: boolean; error: string };

const DEFAULT_ORDER_STATUS = {
  pending: 'idle',
  fulfilled: true,
  error: 'Shipping Error',
} as const satisfies OrderStatus;
```

## Template literal types

Use them to restrict strings with a known format.

```ts
type ApiRoute = `/${'users' | 'orders'}/${number}`;
type ButtonSize = `${'small' | 'medium' | 'large'}-${'mobile' | 'desktop'}`;
```

## `any` and `unknown`

- `any` is forbidden (`typescript/no-explicit-any`).
- For data of unknown origin use `unknown` and narrow with type guards or a validator (e.g. Zod).

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

## Type and non-null assertions

- Avoid `as`. If the type does not fit, the type is defined wrong.
- `!` (non-null assertion) is forbidden (`typescript/no-non-null-assertion`). Check the value.
- The only common exception is `as const`.

## Type errors

If you really must silence an error, use `// @ts-expect-error` with a comment explaining why. Never `// @ts-ignore`.

```ts
// @ts-expect-error: library X mistypes the second argument (issue #123).
legacyLib.init(config, undefined);
```

## `type` instead of `interface`

Always use `type` (`typescript/consistent-type-definitions`). It is more flexible (unions, mapped types) and avoids
accidental declaration merging. The exception is extending library types that require it.

```ts
// ❌
interface UserProps { name: string }

// ✅
type UserProps = { name: string };
```

## Arrays

Use the generic syntax `Array<T>` / `ReadonlyArray<T>` (`typescript/array-type`). It reads better with unions and readonly.

```ts
// ❌
const x: string[] = [];
const y: readonly (string | number)[] = [];

// ✅
const x: Array<string> = [];
const y: ReadonlyArray<string | number> = [];
```

## Type imports and exports

Import types with `import type` (`typescript/consistent-type-imports`).

```ts
import type { User } from '@/features/user';
import { fetchUser } from '@/features/user';
```

## Generated types

API types (OpenAPI, GraphQL, ORM) are generated, not hand-written. Do not edit files in `generated/`.
