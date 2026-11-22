# Uniones discriminadas

Una unión discriminada es una unión de tipos con una propiedad común literal (el *discriminante*: `type`, `kind`, `status`…)
que permite a TypeScript estrechar el tipo en cada rama.

## Por qué

- Eliminan estados imposibles (p. ej. `isLoading: true` y `error` a la vez).
- Eliminan propiedades opcionales: cada variante declara exactamente lo que tiene.
- El compilador avisa al acceder a propiedades que no existen en esa variante.

## Ejemplo: estado de una petición

```ts
// ❌ 16 combinaciones posibles, la mayoría inválidas
type State = {
  isLoading?: boolean;
  data?: User;
  error?: string;
};

// ✅ 3 estados, todos válidos
type State =
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: string };

const render = (state: State) => {
  switch (state.status) {
    case 'loading':
      return 'Cargando…';
    case 'success':
      return state.data.name; // data existe aquí
    case 'error':
      return state.error; // error existe aquí
  }
};
```

## Ejemplo: variantes de un dominio

```ts
type Circle = { kind: 'circle'; radius: number };
type Square = { kind: 'square'; size: number };
type Shape = Circle | Square;

const area = (shape: Shape) => {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size ** 2;
  }
};
```

## Exhaustividad

Al añadir una variante, todos los `switch` deben tratarla. Puedes forzarlo con `never`:

```ts
const assertNever = (value: never): never => {
  throw new Error(`Variante no tratada: ${JSON.stringify(value)}`);
};

// en el default del switch
default:
  return assertNever(shape);
```

## Props de componentes

Usa el mismo patrón para props que se excluyen entre sí (ver `react.md`).
