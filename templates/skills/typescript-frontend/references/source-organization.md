# Organización del código

## Colocación

Coloca juntos los archivos que cambian juntos. Un componente, su hook, sus tipos y sus tests viven en la misma carpeta.
Solo sube un módulo a un nivel compartido cuando lo usan dos o más funcionalidades.

## Estructura por funcionalidad

```
src/
├── app/ (o rutas del framework)   # solo enrutado: páginas y layouts finos
├── features/                      # una carpeta por funcionalidad
│   └── order/
│       ├── components/
│       │   └── OrderItem/
│       │       ├── OrderItem.tsx
│       │       └── OrderItem.test.tsx
│       ├── hooks/
│       │   └── useGetOrders.ts
│       ├── api.ts
│       ├── types.ts
│       └── index.ts               # API pública de la feature
├── components/                    # componentes UI compartidos (sin lógica de negocio)
├── hooks/                         # hooks compartidos
├── utils/                         # funciones puras compartidas
└── constants/
```

## Reglas

- Una funcionalidad expone su API pública en `index.ts`. Desde fuera se importa solo desde ahí.
- Una funcionalidad no importa archivos internos de otra.
- Las páginas/rutas componen funcionalidades; no contienen lógica de negocio.
- Nada de carpetas `misc/` o `helpers/` genéricas: ponle un nombre que diga qué contiene.

## Imports

- Dentro de la misma funcionalidad: imports relativos.
- Entre funcionalidades o hacia código compartido: imports absolutos con el alias del proyecto (`@/`).

```ts
// ✅ dentro de features/order
import { formatOrder } from '../utils';

// ✅ desde otra parte
import { OrderItem } from '@/features/order';

// ❌ ruta interna de otra feature
import { OrderItem } from '@/features/order/components/OrderItem/OrderItem';
```

- Importa los tipos con `import type`.
