# Source organization

## Colocation

Keep together the files that change together. A component, its hook, its types and its tests live in the same folder.
Only move a module to a shared level when two or more features use it.

## Feature-based structure

```
src/
├── app/ (or framework routes)     # routing only: thin pages and layouts
├── features/                      # one folder per feature
│   └── order/
│       ├── components/
│       │   └── OrderItem/
│       │       ├── OrderItem.tsx
│       │       └── OrderItem.test.tsx
│       ├── hooks/
│       │   └── useGetOrders.ts
│       ├── api.ts
│       ├── types.ts
│       └── index.ts               # public API of the feature
├── components/                    # shared UI components (no business logic)
├── hooks/                         # shared hooks
├── utils/                         # shared pure functions
└── constants/
```

## Rules

- A feature exposes its public API in `index.ts`. From the outside, import only from there.
- A feature does not import another feature's internal files.
- Pages/routes compose features; they contain no business logic.
- No generic `misc/` or `helpers/` folders: give it a name that says what it contains.

## Imports

- Within the same feature: relative imports.
- Across features or into shared code: absolute imports with the project alias (`@/`).

```ts
// ✅ inside features/order
import { formatOrder } from '../utils';

// ✅ from elsewhere
import { OrderItem } from '@/features/order';

// ❌ internal path of another feature
import { OrderItem } from '@/features/order/components/OrderItem/OrderItem';
```

- Import types with `import type`.
