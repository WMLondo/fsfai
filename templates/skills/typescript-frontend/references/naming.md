# Nombres

## Exports con nombre

Solo exports con nombre (`import/no-default-export`). Hacen que el nombre sea el mismo en todo el código y facilitan
el autocompletado y los renombrados.

```ts
// ❌
export default function Button() {}

// ✅
export const Button = () => {};
```

Excepción: archivos que el framework exige con `export default` (páginas y layouts de Next.js en `src/app/`, rutas de
Expo Router en `app/`, archivos `*.config.*`).

## Convenciones

| Qué | Formato | Ejemplo |
| --- | --- | --- |
| Variables locales | camelCase | `products`, `productsFiltered` |
| Booleanos | prefijo `is`, `has`, `should`, `can` | `isDisabled`, `hasProduct` |
| Constantes | SCREAMING_SNAKE_CASE | `PRODUCT_ID`, `MAX_RETRIES` |
| Objetos constantes | SCREAMING_SNAKE_CASE en singular + `as const` | `ORDER_STATUS` |
| Funciones | camelCase, verbo | `filterProductsByType`, `formatCurrency` |
| Tipos | PascalCase | `OrderStatus`, `ProductItem` |
| Genéricos | `T` + nombre descriptivo | `TRequest`, `TFooBar` |
| Componentes | PascalCase | `ProductItem`, `ProductsPage` |
| Props de componente | `<Componente>Props` | `ProductItemProps` |
| Hooks | prefijo `use` | `useGetProducts` |
| Props de callback | prefijo `on` | `onClick`, `onItemSelect` |
| Handlers internos | prefijo `handle` | `handleClick`, `handleItemSelect` |

## Abreviaturas y acrónimos

Trátalos como palabras: solo la primera letra en mayúscula.

```ts
// ❌
FAQList, generateUserURL, productIDs

// ✅
FaqList, generateUserUrl, productIds
```

## Genéricos

```ts
// ❌
const createPair = <T, K extends keyof T>(obj: T, key: K) => [key, obj[key]];

// ✅
const createPair = <TObject, TKey extends keyof TObject>(obj: TObject, key: TKey) => [key, obj[key]];
```

## Comentarios

- Prefiere código expresivo a comentarios: buenos nombres, funciones pequeñas, tipos precisos.
- Comenta el **porqué**, no el **qué**.
- Usa TSDoc (`/** … */`) en funciones y tipos públicos que lo necesiten.

```ts
// ❌
// convierte a minúsculas
const lower = email.toLowerCase();

// ✅
// El backend compara emails sin normalizar; hay que enviarlo en minúsculas.
const normalizedEmail = email.toLowerCase();
```
