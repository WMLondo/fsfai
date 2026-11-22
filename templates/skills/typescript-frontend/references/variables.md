# Variables

## `const` por defecto

Usa `const`. `let` solo cuando el valor cambia de verdad. Nunca `var`.

## `as const`

Usa `as const` en objetos y arrays constantes: los valores pasan a ser literales y `readonly`.

```ts
// ❌ tipo: { count: number; users: { id: number; name: string }[] }
const FOO_LOCATION = { x: 50, y: 130 };

// ✅ tipo: { readonly x: 50; readonly y: 130 }
const FOO_LOCATION = { x: 50, y: 130 } as const;

const USER_ROLES = ['admin', 'editor', 'viewer'] as const;
type UserRole = (typeof USER_ROLES)[number]; // 'admin' | 'editor' | 'viewer'
```

## Enums

No uses `enum` de TypeScript: genera código en tiempo de ejecución, los numéricos aceptan cualquier número y no encaja con
la eliminación de tipos. Usa uniones de literales o un objeto `as const`.

```ts
// ❌
enum UserRole {
  GUEST,
  MODERATOR,
  ADMINISTRATOR,
}

// ✅ unión de literales
type UserRole = 'guest' | 'moderator' | 'administrator';

// ✅ objeto as const si necesitas iterar o tener los valores en runtime
const USER_ROLE = {
  guest: 'guest',
  moderator: 'moderator',
  administrator: 'administrator',
} as const;
type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
```

## Uniones de tipos

Prefiere uniones de literales a `string` o `number` genéricos cuando el conjunto de valores es conocido.

```ts
// ❌
type Size = string;

// ✅
type Size = 'sm' | 'md' | 'lg';
```

## `null` y `undefined`

- `undefined`: el valor no se ha dado (propiedad opcional, argumento omitido).
- `null`: ausencia explícita de valor (p. ej. un campo vacío que viene así de la API).
- Elige uno por concepto y no los mezcles para lo mismo.
- Usa `??` y `?.` en lugar de `||` y comprobaciones encadenadas.

```ts
const pageSize = options.pageSize ?? 20; // ✅ respeta 0
const city = user.address?.city;
```
