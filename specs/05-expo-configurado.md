# SPEC 05 — App Expo configurada con paquetes base elegibles

> **Status:** Draft
> **Depends on:** SPEC 02, SPEC 03
> **Date:** 2026-11-21
> **Objective:** Preguntar qué paquetes base se instalan en la app Expo, instalarlos con `expo install` en versiones compatibles con el SDK y dejar la app conectada (providers, Uniwind, cliente de Better Auth) con la estructura del TypeScript Style Guide.

## Alcance

**Dentro:**

- Nuevo prompt `multiselect` justo después del nombre de la app Expo: "Paquetes para <app>". Todas las opciones van marcadas por defecto y se puede desmarcar cualquiera:
  - `heroui-native` — HeroUI Native
  - `uniwind` — Uniwind (Tailwind para React Native)
  - `better-auth` — cliente de Better Auth
  - `vector-icons` — `@expo/vector-icons`
  - `react-hook-form` — React Hook Form
  - `tanstack-query` — TanStack Query
  - `zod` — Zod
  - `flash-list` — `@shopify/flash-list`
- Se puede no elegir ninguno.
- Dependencias implícitas:
  - Si se elige `heroui-native` sin `uniwind`, se añade `uniwind` y se avisa con `log.info`.
  - Si se eligen `react-hook-form` y `zod`, se añade `@hookform/resolvers`.
- Instalación con `<runner-local> expo install <paquetes>` desde `apps/<expo>`, que resuelve las versiones compatibles con el SDK del proyecto. Se ejecuta después del `install` de la raíz (SPEC 02).
- Quitar ESLint con `stripEslintPrettier` (SPEC 03), incluido `eslint-config-expo` y el script `lint`.
- Estructura de carpetas del TypeScript Style Guide (ver Estructura de archivos). Las rutas de expo-router solo enrutan.
- Alias de TypeScript: `@common/*` → `src/common/*` y `@modules/*` → `src/modules/*`.
- Configuración según los paquetes elegidos:
  - `uniwind`: `metro.config.js` con `withUniwindConfig`, `src/global.css` (con los estilos de HeroUI si se eligió) e import de `global.css` en el layout raíz.
  - `heroui-native`: `HeroUINativeProvider` dentro de `GestureHandlerRootView` en el layout raíz.
  - `tanstack-query`: `QueryClient` en `src/common/lib/query-client.ts` y `QueryClientProvider` en el layout raíz.
  - `better-auth`: `src/common/lib/auth-client.ts` con `createAuthClient` + `expoClient({ scheme, storagePrefix, storage: SecureStore })`, `scheme` en `app.json` y `EXPO_PUBLIC_API_URL` en `.env`.
- Pantalla de inicio `src/modules/HomePage/index.tsx` (`HomePage`), que la ruta `index` re-exporta.

**Fuera de alcance (specs futuras):**

- Pantallas de login/registro y protección de rutas.
- Módulos extra del SDK de Expo (`expo-image`, `expo-notifications`, etc.).
- EAS Build/Submit y `eas.json`.
- Tema personalizado de HeroUI y modo oscuro.
- Storybook y tests de componentes.
- Consumir `api-client` (SPEC 07).

## Modelo de datos

```ts
// src/types.ts (CLI)
export type ExpoPackage =
  | "heroui-native" | "uniwind" | "better-auth" | "vector-icons"
  | "react-hook-form" | "tanstack-query" | "zod" | "flash-list";

// variante Expo de AppSelection
{ framework: "expo"; name: string; packages: ReadonlyArray<ExpoPackage> }
```

```ts
// src/apps/expo-packages.ts
export const EXPO_PACKAGES: Record<ExpoPackage, { label: string; install: ReadonlyArray<string> }> = {
  "heroui-native":   { label: "HeroUI Native", install: ["heroui-native", "react-native-reanimated", "react-native-gesture-handler", "react-native-safe-area-context", "react-native-svg", "tailwind-variants", "tailwind-merge"] },
  "uniwind":         { label: "Uniwind",       install: ["uniwind", "tailwindcss"] },
  "better-auth":     { label: "Better Auth",   install: ["better-auth", "@better-auth/expo", "expo-secure-store", "expo-linking", "expo-web-browser", "expo-constants"] },
  "vector-icons":    { label: "Expo Vector Icons", install: ["@expo/vector-icons"] },
  "react-hook-form": { label: "React Hook Form", install: ["react-hook-form"] },
  "tanstack-query":  { label: "TanStack Query", install: ["@tanstack/react-query"] },
  "zod":             { label: "Zod",           install: ["zod"] },
  "flash-list":      { label: "FlashList",     install: ["@shopify/flash-list"] },
};
```

Variables de entorno (`apps/<expo>/.env`):

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Convenciones:

- `scheme` en `app.json` = nombre de la app Expo. SPEC 04 lo añade a `TRUSTED_ORIGINS` como `<scheme>://`.
- `<runner-local>` es `pnpm exec` o `npx`.
- Las listas exactas de peer deps de cada paquete se revisan contra su documentación al implementar. `EXPO_PACKAGES` es la única fuente.

## Estructura de archivos

App generada (`apps/<expo>/`), con todos los paquetes elegidos:

```
apps/<expo>/
├── app.json                  # + scheme
├── metro.config.js           # withUniwindConfig
├── tsconfig.json             # + paths @common/*, @modules/*
├── .env
└── src/
    ├── global.css
    ├── app/                  # rutas de expo-router: solo enrutan
    │   ├── _layout.tsx       # providers
    │   └── index.tsx         # export { HomePage as default } from '@modules/HomePage';
    ├── common/
    │   ├── components/index.tsx
    │   ├── consts/
    │   ├── hooks/
    │   ├── lib/
    │   │   ├── auth-client.ts
    │   │   └── query-client.ts
    │   └── types/
    └── modules/
        └── HomePage/
            └── index.tsx
```

Si el template de Expo deja las rutas en `app/` y no en `src/app/`, se respeta esa ubicación y el resto va igual en `src/`.

En la CLI:

```
templates/expo/
├── metro.config.js
├── global.css
├── _layout.tsx               # con marcadores por paquete
├── index.tsx
├── HomePage.tsx
├── auth-client.ts
└── query-client.ts
src/apps/expo.ts              # + askExpoPackages(), configureExpoApp(options, app)
src/apps/expo-packages.ts     # EXPO_PACKAGES, resolveExpoPackages()
```

## Plan de implementación

1. Añadir `ExpoPackage`, `EXPO_PACKAGES` y el multiselect con todo marcado. Añadir `resolveExpoPackages()`, que aplica las dependencias implícitas. Prueba manual: con HeroUI marcado y Uniwind desmarcado, el resumen muestra Uniwind añadido.
2. `configureExpoApp`, paso base: `stripEslintPrettier`, crear `src/common/` y `src/modules/HomePage/`, re-exportar la ruta `index` y añadir los alias al `tsconfig.json`. Prueba manual: `<pm> run start` en la app abre la pantalla `HomePage`.
3. Ejecutar `expo install` con los paquetes resueltos. Si falla, `log.error` y `exit 1`. Prueba manual: `package.json` de la app tiene las versiones que eligió `expo install`.
4. Configurar Uniwind: `metro.config.js`, `global.css` e import en el layout. Prueba manual: una `className="text-red-500"` en `HomePage` se ve roja.
5. Configurar HeroUI Native y TanStack Query en `_layout.tsx` según los elegidos. Prueba manual: un `Button` de HeroUI se ve en `HomePage` y la app no muestra errores de provider.
6. Configurar Better Auth: `auth-client.ts`, `scheme` en `app.json` y `.env`. Prueba manual: con la app Nest de SPEC 04 en marcha, `authClient.signUp.email(...)` crea un usuario.

## Criterios de aceptación

- [ ] Con Expo elegido, después de su nombre aparece "Paquetes para <app>" con las 8 opciones marcadas.
- [ ] Ctrl+C en ese prompt muestra "Operación cancelada" y sale con código 0.
- [ ] Con todos los paquetes, `apps/<expo>/package.json` contiene `heroui-native`, `uniwind`, `better-auth`, `@better-auth/expo`, `expo-secure-store`, `@expo/vector-icons`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`, `zod` y `@shopify/flash-list`.
- [ ] Los paquetes se instalan con `expo install` y `npx expo install --check` no reporta versiones incompatibles.
- [ ] Un paquete desmarcado no aparece en `package.json` y su configuración no se genera.
- [ ] Con HeroUI y sin Uniwind, Uniwind se instala igualmente y se muestra el aviso.
- [ ] `@hookform/resolvers` solo se instala si se eligen React Hook Form y Zod.
- [ ] La app no tiene `eslint-config-expo`, `eslint.config.js` ni script `lint`.
- [ ] Existen `src/common/` y `src/modules/HomePage/index.tsx`, y la ruta `index` solo re-exporta `HomePage`.
- [ ] Imports con `@common/...` y `@modules/...` resuelven en TypeScript y en Metro.
- [ ] Con Better Auth, `app.json` tiene `scheme: "<app>"` y existe `.env` con `EXPO_PUBLIC_API_URL=http://localhost:3001`.
- [ ] `<pm> run start` en la app arranca Metro sin errores con todos los paquetes elegidos.
- [ ] `<pm> run lint` en la raíz termina con código 0.

## Decisiones

- **Sí:** multiselect con todo marcado. Es la base que quiere el usuario y se puede desmarcar lo que sobre.
- **Sí:** `expo install` para todos los paquetes. Elige la versión compatible con el SDK; para los paquetes que no son de Expo instala la última.
- **Sí:** Uniwind obligatorio con HeroUI Native. HeroUI Native depende de Uniwind para los estilos.
- **Sí:** `@hookform/resolvers` automático con RHF + Zod. Sin él no se pueden unir.
- **Sí:** Better Auth en Expo solo como cliente. El servidor vive en NestJS (SPEC 04).
- **Sí:** las rutas de expo-router solo re-exportan una `Page` de `modules/`. Es lo que pide la guía para routers por sistema de archivos.
- **Sí:** excepción a "sin export default" en las rutas. expo-router lo exige; Oxlint lo permite en esa carpeta (SPEC 03).
- **Sí:** alias `@common/*` y `@modules/*`. La guía pide imports absolutos fuera de la misma feature.
- **No:** módulos extra del SDK en esta spec. El usuario no los listó.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Uniwind o HeroUI Native cambian su setup (nombre del plugin de Metro, imports de CSS) | El setup está en `templates/expo/`. Se comprueba con la prueba manual de los pasos 4 y 5. |
| HeroUI Native pide una versión de Reanimated distinta de la del SDK | `expo install` instala la del SDK. Si HeroUI no la acepta, se documenta en la spec y se fija la versión. |
| `expo install` en monorepo pnpm instala en la raíz en lugar de en la app | Se ejecuta con `cwd: apps/<expo>`. Se comprueba en el paso 3. |
| Better Auth Expo necesita `expo-network` u otro peer nuevo | La lista está centralizada en `EXPO_PACKAGES["better-auth"]`. |

## Lo que **no** está en esta spec

- Pantallas de auth y protección de rutas.
- Módulos extra del SDK.
- EAS, tema de HeroUI y modo oscuro.
- Storybook y tests de componentes.
- Integración con `api-client`.

Cada uno, si llega, va en su propia spec.
