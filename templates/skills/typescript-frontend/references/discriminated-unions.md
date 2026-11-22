# Discriminated unions

A discriminated union is a union of types sharing a common literal property (the *discriminant*: `type`, `kind`, `status`…)
that lets TypeScript narrow the type in each branch.

## Why

- They eliminate impossible states (e.g. `isLoading: true` and `error` at the same time).
- They eliminate optional properties: each variant declares exactly what it has.
- The compiler warns when accessing properties that do not exist in that variant.

## Example: request state

```ts
// ❌ 16 possible combinations, most of them invalid
type State = {
  isLoading?: boolean;
  data?: User;
  error?: string;
};

// ✅ 3 states, all valid
type State =
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: string };

const render = (state: State) => {
  switch (state.status) {
    case 'loading':
      return 'Loading…';
    case 'success':
      return state.data.name; // data exists here
    case 'error':
      return state.error; // error exists here
  }
};
```

## Example: domain variants

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

## Exhaustiveness

When you add a variant, every `switch` must handle it. You can enforce this with `never`:

```ts
const assertNever = (value: never): never => {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
};

// in the switch default
default:
  return assertNever(shape);
```

## Component props

Use the same pattern for mutually exclusive props (see `react.md`).
