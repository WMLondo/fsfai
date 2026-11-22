# Variables

## `const` by default

Use `const`. `let` only when the value really changes. Never `var`.

## `as const`

Use `as const` on constant objects and arrays: values become literals and `readonly`.

```ts
// ❌ type: { x: number; y: number }
const FOO_LOCATION = { x: 50, y: 130 };

// ✅ type: { readonly x: 50; readonly y: 130 }
const FOO_LOCATION = { x: 50, y: 130 } as const;

const USER_ROLES = ['admin', 'editor', 'viewer'] as const;
type UserRole = (typeof USER_ROLES)[number]; // 'admin' | 'editor' | 'viewer'
```

## Enums

Do not use TypeScript `enum`: it emits runtime code, numeric enums accept any number, and it does not play well with
type stripping. Use literal unions or an `as const` object.

```ts
// ❌
enum UserRole {
  GUEST,
  MODERATOR,
  ADMINISTRATOR,
}

// ✅ literal union
type UserRole = 'guest' | 'moderator' | 'administrator';

// ✅ as const object if you need to iterate or have the values at runtime
const USER_ROLE = {
  guest: 'guest',
  moderator: 'moderator',
  administrator: 'administrator',
} as const;
type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
```

## Type unions

Prefer literal unions over generic `string` or `number` when the set of values is known.

```ts
// ❌
type Size = string;

// ✅
type Size = 'sm' | 'md' | 'lg';
```

## `null` and `undefined`

- `undefined`: the value was not provided (optional property, omitted argument).
- `null`: explicit absence of a value (e.g. an empty field that comes that way from the API).
- Pick one per concept and do not mix them for the same thing.
- Use `??` and `?.` instead of `||` and chained checks.

```ts
const pageSize = options.pageSize ?? 20; // ✅ respects 0
const city = user.address?.city;
```
