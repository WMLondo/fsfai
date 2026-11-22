# Naming

## Named exports

Named exports only (`import/no-default-export`). They keep the name the same across the codebase and make
autocompletion and renames easier.

```ts
// ❌
export default function Button() {}

// ✅
export const Button = () => {};
```

Exception: files the framework requires to use `export default` (Next.js pages and layouts in `src/app/`, Expo Router
routes in `app/`, `*.config.*` files).

## Conventions

| What | Format | Example |
| --- | --- | --- |
| Local variables | camelCase | `products`, `productsFiltered` |
| Booleans | `is`, `has`, `should`, `can` prefix | `isDisabled`, `hasProduct` |
| Constants | SCREAMING_SNAKE_CASE | `PRODUCT_ID`, `MAX_RETRIES` |
| Constant objects | singular SCREAMING_SNAKE_CASE + `as const` | `ORDER_STATUS` |
| Functions | camelCase, verb | `filterProductsByType`, `formatCurrency` |
| Types | PascalCase | `OrderStatus`, `ProductItem` |
| Generics | `T` + descriptive name | `TRequest`, `TFooBar` |
| Components | PascalCase | `ProductItem`, `ProductsPage` |
| Component props | `<Component>Props` | `ProductItemProps` |
| Hooks | `use` prefix | `useGetProducts` |
| Callback props | `on` prefix | `onClick`, `onItemSelect` |
| Internal handlers | `handle` prefix | `handleClick`, `handleItemSelect` |

## Abbreviations and acronyms

Treat them as words: only the first letter capitalized.

```ts
// ❌
FAQList, generateUserURL, productIDs

// ✅
FaqList, generateUserUrl, productIds
```

## Generics

```ts
// ❌
const createPair = <T, K extends keyof T>(obj: T, key: K) => [key, obj[key]];

// ✅
const createPair = <TObject, TKey extends keyof TObject>(obj: TObject, key: TKey) => [key, obj[key]];
```

## Comments

- Prefer expressive code over comments: good names, small functions, precise types.
- Comment the **why**, not the **what**.
- Use TSDoc (`/** … */`) on public functions and types that need it.

```ts
// ❌
// convert to lowercase
const lower = email.toLowerCase();

// ✅
// The backend compares emails without normalizing them; they must be sent in lowercase.
const normalizedEmail = email.toLowerCase();
```
