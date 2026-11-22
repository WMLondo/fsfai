# React / React Native

Applies equally to Next.js and Expo.

## Components

- Functional components as arrow functions with named exports.
- Props are typed with `type <Component>Props`.
- One component per file, with the same name as the file.

```tsx
type ProductItemProps = {
  name: string;
  price: number;
  onSelect: (id: string) => void;
};

export const ProductItem = ({ name, price, onSelect }: ProductItemProps) => {
  // …
};
```

## Required and optional props

Same as with types: most should be required. Every optional prop is one more state to test.

## Props as discriminated unions

If some props are mutually exclusive, model them as a discriminated union.

```tsx
// ❌
type StatusProps = { isLoading?: boolean; error?: string; data?: Order };

// ✅
type StatusProps =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: Order };
```

## Containers and UI components

- **Container** (page, feature): fetches data, handles state and effects, and passes data to the UI.
- **UI**: receives props and renders. No data fetching or global state. Easy to test and reuse.

## Data and state

- Fetch data in containers or hooks (`useGetOrders`), not in UI components.
- Keep state as close as possible to where it is used. Lift it only when two components share it.
- Do not duplicate in state what can be derived from props or other state.

## Pass primitives

Whenever possible, pass primitive values instead of whole objects. The component depends only on what it uses and
memoization works better.

```tsx
// ❌
<UserAvatar user={user} />

// ✅
<UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
```

## Handlers

- Callback props: `on*` (`onSelect`).
- Internal functions that handle them: `handle*` (`handleSelect`).

## Hooks

- `use` prefix. One hook, one responsibility.
- Extract logic into a hook when a component mixes UI with data logic or complex state.
