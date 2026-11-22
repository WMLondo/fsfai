# React / React Native

Aplica igual a Next.js y a Expo.

## Componentes

- Componentes funcionales con funciones flecha y export con nombre.
- Las props se tipan con `type <Componente>Props`.
- Un componente por archivo, con el mismo nombre que el archivo.

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

## Props obligatorias y opcionales

Igual que en los tipos: la mayoría obligatorias. Cada prop opcional es un estado más que probar.

## Props como uniones discriminadas

Si hay props que se excluyen entre sí, modélalas como unión discriminada.

```tsx
// ❌
type StatusProps = { isLoading?: boolean; error?: string; data?: Order };

// ✅
type StatusProps =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: Order };
```

## Contenedores y componentes de UI

- **Contenedor** (página, feature): obtiene datos, maneja estado y efectos, y pasa datos a la UI.
- **UI**: recibe props y renderiza. Sin data fetching ni estado global. Fácil de probar y de reutilizar.

## Datos y estado

- Obtén datos en los contenedores o en hooks (`useGetOrders`), no en componentes de UI.
- Mantén el estado lo más cerca posible de donde se usa. Súbelo solo cuando dos componentes lo comparten.
- No dupliques en estado lo que se puede derivar de props o de otro estado.

## Pasar primitivos

Siempre que se pueda, pasa valores primitivos en lugar de objetos enteros. El componente depende solo de lo que usa y
la memoización funciona mejor.

```tsx
// ❌
<UserAvatar user={user} />

// ✅
<UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
```

## Handlers

- Props de callback: `on*` (`onSelect`).
- Funciones internas que los manejan: `handle*` (`handleSelect`).

## Hooks

- Prefijo `use`. Un hook, una responsabilidad.
- Extrae lógica a un hook cuando un componente mezcla UI con lógica de datos o de estado compleja.
